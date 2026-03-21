/**
 * Production Engine
 *
 * Manages the production order state machine:
 *   DRAFT -> FABRIC_RESERVED -> ISSUED_TO_FACTORY -> QC_PENDING -> STOCKED
 *
 * On FABRIC_RESERVED: auto-deducts BOM materials from inventory (Inventory Pull).
 * On STOCKED: records finished goods into variant stock + calculates wastage.
 */

import prisma from "@/lib/prisma";
import { recordOutbound } from "@/lib/engines/avco";
import { createAuditLog } from "@/lib/audit";
import { Decimal } from "@prisma/client/runtime/library";
import type { ProductionStatus } from "@prisma/client";

const VALID_TRANSITIONS: Record<ProductionStatus, ProductionStatus[]> = {
  DRAFT: ["FABRIC_RESERVED", "CANCELLED"],
  FABRIC_RESERVED: ["ISSUED_TO_FACTORY", "CANCELLED"],
  ISSUED_TO_FACTORY: ["QC_PENDING"],
  QC_PENDING: ["STOCKED"],
  STOCKED: [],
  CANCELLED: [],
};

/**
 * Transition a production order to the next state.
 */
export async function transitionProductionOrder(
  orderId: string,
  targetStatus: ProductionStatus,
  context: { tenantId: string; userId?: string }
) {
  const order = await prisma.productionOrder.findUniqueOrThrow({
    where: { id: orderId },
    include: {
      items: {
        include: {
          variant: {
            include: { bomItems: { include: { rawMaterial: true } } },
          },
        },
      },
    },
  });

  const allowed = VALID_TRANSITIONS[order.status];
  if (!allowed.includes(targetStatus)) {
    throw new Error(
      `Invalid transition: ${order.status} → ${targetStatus}. Allowed: ${allowed.join(", ")}`
    );
  }

  // ── FABRIC_RESERVED: Auto-deduct raw materials (Inventory Pull) ──
  if (targetStatus === "FABRIC_RESERVED") {
    for (const item of order.items) {
      for (const bom of item.variant.bomItems) {
        const totalRequired = Number(bom.qtyRequired) * item.qtyOrdered;
        await recordOutbound({
          rawMaterialId: bom.rawMaterialId,
          qty: totalRequired,
          reference: `PO-${order.orderNumber}`,
          notes: `Auto-deducted for production order ${order.orderNumber}, variant ${item.variant.sku}`,
          tenantId: context.tenantId,
          userId: context.userId,
        });
      }
    }
  }

  // ── STOCKED: Move finished goods into variant stock ──
  if (targetStatus === "STOCKED") {
    for (const item of order.items) {
      await prisma.productVariant.update({
        where: { id: item.variantId },
        data: { stockQty: { increment: item.qtyReceived } },
      });
    }
  }

  // ── Update order status ──
  const oldStatus = order.status;
  const updated = await prisma.productionOrder.update({
    where: { id: orderId },
    data: { status: targetStatus },
  });

  await createAuditLog({
    tenantId: context.tenantId,
    userId: context.userId,
    tableName: "production_orders",
    recordId: orderId,
    action: "UPDATE",
    oldValues: { status: oldStatus },
    newValues: { status: targetStatus },
  });

  return updated;
}

/**
 * Record wastage for a production batch.
 * efficiencyPct = (theoreticalUsage / actualUsage) × 100
 */
export async function recordWastage(
  productionOrderId: string,
  theoreticalUsage: number,
  actualUsage: number,
  notes?: string
) {
  const efficiencyPct =
    actualUsage > 0 ? (theoreticalUsage / actualUsage) * 100 : 100;

  return prisma.wastageRecord.create({
    data: {
      productionOrderId,
      theoreticalUsage: new Decimal(theoreticalUsage),
      actualUsage: new Decimal(actualUsage),
      efficiencyPct: new Decimal(efficiencyPct),
      notes,
    },
  });
}
