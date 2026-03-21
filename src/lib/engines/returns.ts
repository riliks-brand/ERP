/**
 * Returns Engine — Return Impact Analysis
 *
 * When a return occurs, calculates the full penalty:
 *   Return_Loss = Forward_Shipping + Return_Shipping + Refurbishment_Cost
 *
 * If the product is intact, it returns to stock automatically.
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
    tenantId,
    userId,
  } = payload;

  const totalLoss = forwardShipping + returnShipping + refurbishmentCost;

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

    // 4. Audit
    await createAuditLog({
      tenantId,
      userId,
      tableName: "return_records",
      recordId: record.id,
      action: "CREATE",
      newValues: {
        salesOrderId,
        isProductIntact,
        totalLoss,
      },
    });

    return record;
  });
}
