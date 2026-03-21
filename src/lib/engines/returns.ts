/**
 * Returns Engine v2 — Return Impact Analysis
 *
 * When a return occurs, calculates the full penalty:
 *   Return_Loss = Forward_Shipping + Return_Shipping + Refurbishment_Cost + Platform_Commission
 *
 * v2 Enhancements:
 *   - Platform commission (e.g. Shopify/WooCommerce fee that isn't refunded)
 *     is now included in the total loss calculation.
 *   - Shipping Returns Reconciliation: flags cases where the courier charged
 *     a return fee but the physical item hasn't been received back yet.
 */

import prisma from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { Decimal } from "@prisma/client/runtime/library";

interface ProcessReturnPayload {
  salesOrderId: string;
  reason?: string;
  isProductIntact: boolean;
  forwardShipping: number;
  returnShipping: number;
  refurbishmentCost?: number;
  platformCommission?: number; // v2: Shopify/WooCommerce fee not refunded
  tenantId: string;
  userId?: string;
}

export async function processReturn(payload: ProcessReturnPayload) {
  const {
    salesOrderId,
    reason,
    isProductIntact,
    forwardShipping,
    returnShipping,
    refurbishmentCost = 0,
    platformCommission = 0,
    tenantId,
    userId,
  } = payload;

  // v2: Full loss includes platform commission
  const totalLoss =
    forwardShipping + returnShipping + refurbishmentCost + platformCommission;

  return prisma.$transaction(async (tx) => {
    // 1. Create return record
    const record = await tx.returnRecord.create({
      data: {
        salesOrderId,
        reason,
        isProductIntact,
        forwardShipping: new Decimal(forwardShipping),
        returnShipping: new Decimal(returnShipping),
        refurbishmentCost: new Decimal(refurbishmentCost),
        totalLoss: new Decimal(totalLoss),
        returnedToStock: isProductIntact,
      },
    });

    // 2. Update order status
    await tx.salesOrder.update({
      where: { id: salesOrderId },
      data: { status: "RETURNED" },
    });

    // 3. If product is intact, return variant stock
    if (isProductIntact) {
      const orderItems = await tx.salesOrderItem.findMany({
        where: { salesOrderId },
      });

      for (const item of orderItems) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stockQty: { increment: item.qty } },
        });
      }
    }

    // 4. Audit with full breakdown
    await createAuditLog({
      tenantId,
      userId,
      tableName: "return_records",
      recordId: record.id,
      action: "CREATE",
      newValues: {
        salesOrderId,
        isProductIntact,
        forwardShipping,
        returnShipping,
        refurbishmentCost,
        platformCommission,
        totalLoss,
      },
    });

    return record;
  });
}

// ──────────────────────────────────────────────────────────────────────
// v2: Shipping Returns Reconciliation
// ──────────────────────────────────────────────────────────────────────

interface ShippingReturnFlag {
  orderNumber: string;
  returnFeeCharged: number;
  physicalItemReceived: boolean;
  flag: "RETURN_FEE_OK" | "RETURN_FEE_DISPUTED" | "ITEM_MISSING";
  recommendation: string;
}

/**
 * Cross-check: did the courier charge a return fee for an item
 * that hasn't physically arrived back at the warehouse?
 *
 * Usage: call after uploading shipping statement + processing returns.
 */
export async function reconcileShippingReturns(
  tenantId: string,
  reconRows: { orderNumber: string; returnFee: number }[],
  receivedOrderNumbers: string[] // Orders physically received in warehouse
): Promise<ShippingReturnFlag[]> {
  const flags: ShippingReturnFlag[] = [];

  for (const row of reconRows) {
    if (row.returnFee <= 0) continue; // No return fee — skip

    const isReceived = receivedOrderNumbers.includes(row.orderNumber);

    if (isReceived) {
      flags.push({
        orderNumber: row.orderNumber,
        returnFeeCharged: row.returnFee,
        physicalItemReceived: true,
        flag: "RETURN_FEE_OK",
        recommendation: "Return fee valid — item received.",
      });
    } else {
      // 🚨 Courier charged a fee but item not received
      flags.push({
        orderNumber: row.orderNumber,
        returnFeeCharged: row.returnFee,
        physicalItemReceived: false,
        flag: "ITEM_MISSING",
        recommendation:
          `⚠️ Courier charged EGP ${row.returnFee} return fee for ${row.orderNumber}, ` +
          `but the physical item has NOT been received. File a claim for compensation.`,
      });
    }
  }

  return flags;
}
