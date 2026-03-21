/**
 * Shipping Reconciliation Engine
 *
 * 1. Parses uploaded CSV/Excel files from shipping providers.
 * 2. Matches rows against internal SalesOrders by orderNumber.
 * 3. Flags discrepancies (COD mismatch, hidden fees, missing orders).
 * 4. Calculates Net Payout = Σ COD_delivered − Σ Shipping_Fees − Σ Return_Fees.
 */

import prisma from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";
import type { ReconcileFlag } from "@prisma/client";

export interface ParsedShippingRow {
  orderNumber: string;
  codCollected: number;
  shippingFee: number;
  returnFee: number;
  status: string; // e.g., "Delivered", "Returned"
}

export interface ReconciliationResult {
  reconciliationId: string;
  totalRows: number;
  matched: number;
  discrepancies: number;
  missing: number;
  hiddenFees: number;
  netPayout: number;
}

/**
 * Run reconciliation against parsed shipping rows.
 */
export async function reconcileShipment(
  tenantId: string,
  shippingProviderId: string,
  fileName: string,
  rows: ParsedShippingRow[]
): Promise<ReconciliationResult> {
  // 1. Create the reconciliation header
  const recon = await prisma.shippingReconciliation.create({
    data: {
      tenantId,
      shippingProviderId,
      fileName,
      totalRows: rows.length,
      status: "PROCESSING",
    },
  });

  // 2. Get the shipping provider for agreed rate comparison
  const provider = await prisma.shippingProvider.findUniqueOrThrow({
    where: { id: shippingProviderId },
  });
  const agreedRate = Number(provider.agreedRate);

  let matched = 0;
  let discrepancies = 0;
  let missing = 0;
  let hiddenFees = 0;
  let netPayout = 0;

  for (const row of rows) {
    // 3. Find the internal order
    const order = await prisma.salesOrder.findFirst({
      where: { tenantId, orderNumber: row.orderNumber },
    });

    let flag: ReconcileFlag;
    let expectedCod = 0;
    let expectedShippingFee = agreedRate;

    if (!order) {
      flag = "MISSING";
      missing++;
    } else {
      expectedCod = Number(order.codAmount);

      if (
        row.codCollected < expectedCod &&
        Math.abs(row.codCollected - expectedCod) > 0.01
      ) {
        flag = "DISCREPANCY";
        discrepancies++;
      } else if (row.shippingFee > agreedRate + 0.01) {
        flag = "HIDDEN_FEE";
        hiddenFees++;
      } else {
        flag = "MATCHED";
        matched++;
      }
    }

    netPayout += row.codCollected - row.shippingFee - row.returnFee;

    await prisma.shippingReconciliationRow.create({
      data: {
        reconciliationId: recon.id,
        orderNumber: row.orderNumber,
        expectedCod: new Decimal(expectedCod),
        actualCod: new Decimal(row.codCollected),
        expectedShippingFee: new Decimal(expectedShippingFee),
        actualShippingFee: new Decimal(row.shippingFee),
        returnFee: new Decimal(row.returnFee),
        flag,
      },
    });
  }

  // 4. Update reconciliation summary
  await prisma.shippingReconciliation.update({
    where: { id: recon.id },
    data: {
      matchedCount: matched,
      discrepancyCount: discrepancies + hiddenFees,
      missingCount: missing,
      netPayout: new Decimal(netPayout),
      status: "COMPLETED",
    },
  });

  return {
    reconciliationId: recon.id,
    totalRows: rows.length,
    matched,
    discrepancies,
    missing,
    hiddenFees,
    netPayout,
  };
}
