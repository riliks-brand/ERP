/**
 * Production Engine (v2)
 *
 * Manages the production order state machine:
 *   DRAFT -> FABRIC_RESERVED -> ISSUED_TO_FACTORY -> QC_PENDING -> STOCKED
 *
 * v2 Enhancements:
 *   - Database Transaction + Row-Level Locking on FABRIC_RESERVED
 *     (prevents double-booking the same raw material for two orders)
 *   - Pessimistic locking via SELECT ... FOR UPDATE (raw SQL)
 */

import prisma from "@/lib/prisma";
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
 *
 * When transitioning to FABRIC_RESERVED, the entire operation runs
 * inside a serializable transaction with row-level locks on raw_materials
 * to prevent concurrent production orders from double-booking inventory.
 */
export async function transitionProductionOrder(
  orderId: string,
  targetStatus: ProductionStatus,
  context: { tenantId: string; userId?: string }
) {
  // Wrap the entire transition in a database transaction
  return prisma.$transaction(
    async (tx) => {
      const order = await tx.productionOrder.findUniqueOrThrow({
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

      // ── FABRIC_RESERVED: Auto-deduct with Row-Level Lock ──────────
      if (targetStatus === "FABRIC_RESERVED") {
        for (const item of order.items) {
          for (const bom of item.variant.bomItems) {
            const totalRequired = Number(bom.qtyRequired) * item.qtyOrdered;

            // 🔒 Pessimistic lock: lock the raw_material row to prevent
            // concurrent production orders from reading stale quantities.
            const locked = await tx.$queryRawUnsafe<
              { id: string; avg_cost: string; total_qty: string; total_value: string; name: string }[]
            >(
              `SELECT id, avg_cost, total_qty, total_value, name
               FROM raw_materials
               WHERE id = $1
               FOR UPDATE`,
              bom.rawMaterialId
            );

            if (!locked.length) {
              throw new Error(`Raw material ${bom.rawMaterialId} not found.`);
            }

            const mat = locked[0];
            const existingQty = Number(mat.total_qty);
            const existingValue = Number(mat.total_value);
            const avgCost = Number(mat.avg_cost);

            if (totalRequired > existingQty) {
              throw new Error(
                `Insufficient stock for "${mat.name}". Available: ${existingQty}, Required: ${totalRequired}`
              );
            }

            const consumedValue = totalRequired * avgCost;
            const newTotalQty = existingQty - totalRequired;
            const newTotalValue = existingValue - consumedValue;

            // Create immutable ledger entry
            await tx.inventoryLedger.create({
              data: {
                rawMaterialId: bom.rawMaterialId,
                type: "OUTBOUND",
                qty: new Decimal(-totalRequired),
                unitCost: new Decimal(avgCost),
                totalCost: new Decimal(-consumedValue),
                runningAvgCost: new Decimal(avgCost),
                runningQty: new Decimal(newTotalQty),
                runningValue: new Decimal(newTotalValue),
                reference: `PO-${order.orderNumber}`,
                notes: `Auto-deducted for production order ${order.orderNumber}, variant ${item.variant.sku}`,
              },
            });

            // Update material running totals
            await tx.rawMaterial.update({
              where: { id: bom.rawMaterialId },
              data: {
                totalQty: new Decimal(newTotalQty),
                totalValue: new Decimal(newTotalValue),
              },
            });
          }
        }
      }

      // ── STOCKED: Move finished goods into variant stock ──────────
      if (targetStatus === "STOCKED") {
        for (const item of order.items) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stockQty: { increment: item.qtyReceived } },
          });
        }
      }

      // ── Update order status ──────────
      const oldStatus = order.status;
      const updated = await tx.productionOrder.update({
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
    },
    {
      // Serializable isolation for maximum safety on financial operations
      isolationLevel: "Serializable",
      timeout: 15000, // 15s timeout for complex production orders
    }
  );
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
