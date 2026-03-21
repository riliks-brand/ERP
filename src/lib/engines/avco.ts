/**
 * AVCO Engine v2 — Weighted Average Cost Algorithm
 *
 * On every INBOUND (purchase), recalculates the weighted average cost:
 *   newAvgCost = (existingValue + incomingValue) / (existingQty + incomingQty)
 *
 * v2 Enhancements:
 *   - addDelayedLandedCost(): Recalculate AVCO when transport/customs invoices
 *     arrive AFTER the raw material was already received and stocked.
 *   - Row-level locking on outbound to prevent race conditions.
 */

import prisma from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { Decimal } from "@prisma/client/runtime/library";

interface InboundPayload {
  rawMaterialId: string;
  qty: number;
  unitCost: number;
  landedCost?: number;
  reference?: string;
  notes?: string;
  tenantId: string;
  userId?: string;
}

/**
 * Records a purchase (INBOUND) and recalculates the AVCO for the raw material.
 */
export async function recordInbound(payload: InboundPayload) {
  const {
    rawMaterialId,
    qty,
    unitCost,
    landedCost = 0,
    reference,
    notes,
    tenantId,
    userId,
  } = payload;

  return prisma.$transaction(async (tx) => {
    // Lock row to prevent concurrent modifications
    const locked = await tx.$queryRawUnsafe<
      { avg_cost: string; total_qty: string; total_value: string }[]
    >(
      `SELECT avg_cost, total_qty, total_value FROM raw_materials WHERE id = $1 FOR UPDATE`,
      rawMaterialId
    );

    if (!locked.length) throw new Error(`Raw material ${rawMaterialId} not found.`);

    const existingValue = Number(locked[0].total_value);
    const existingQty = Number(locked[0].total_qty);
    const oldAvgCost = Number(locked[0].avg_cost);

    // Calculate new AVCO
    const incomingTotal = qty * unitCost + landedCost;
    const newTotalValue = existingValue + incomingTotal;
    const newTotalQty = existingQty + qty;
    const newAvgCost = newTotalQty > 0 ? newTotalValue / newTotalQty : 0;

    // Create immutable ledger entry
    const entry = await tx.inventoryLedger.create({
      data: {
        rawMaterialId,
        type: "INBOUND",
        qty: new Decimal(qty),
        unitCost: new Decimal(unitCost),
        totalCost: new Decimal(incomingTotal),
        landedCost: new Decimal(landedCost),
        runningAvgCost: new Decimal(newAvgCost),
        runningQty: new Decimal(newTotalQty),
        runningValue: new Decimal(newTotalValue),
        reference,
        notes,
      },
    });

    // Update material running totals
    await tx.rawMaterial.update({
      where: { id: rawMaterialId },
      data: {
        avgCost: new Decimal(newAvgCost),
        totalQty: new Decimal(newTotalQty),
        totalValue: new Decimal(newTotalValue),
      },
    });

    // Audit with old vs new values
    await createAuditLog({
      tenantId,
      userId,
      tableName: "raw_materials",
      recordId: rawMaterialId,
      action: "UPDATE",
      oldValues: { avgCost: oldAvgCost, totalQty: existingQty, totalValue: existingValue },
      newValues: { avgCost: newAvgCost, totalQty: newTotalQty, totalValue: newTotalValue, landedCost },
    });

    return entry;
  });
}

// ──────────────────────────────────────────────────────────────────────
// NEW in v2: Delayed Landed Cost
// ──────────────────────────────────────────────────────────────────────

interface DelayedLandedCostPayload {
  rawMaterialId: string;
  amount: number; // Additional transport/customs cost arriving late
  reference?: string;
  notes?: string;
  tenantId: string;
  userId?: string;
}

/**
 * Add a delayed landed cost (e.g. transport invoice received after stocking).
 * This inflates the total inventory value and recalculates AVCO without
 * changing the quantity on hand.
 *
 * newAvgCost = (currentTotalValue + delayedCost) / currentTotalQty
 */
export async function addDelayedLandedCost(payload: DelayedLandedCostPayload) {
  const { rawMaterialId, amount, reference, notes, tenantId, userId } = payload;

  if (amount <= 0) throw new Error("Delayed landed cost must be positive.");

  return prisma.$transaction(async (tx) => {
    const locked = await tx.$queryRawUnsafe<
      { avg_cost: string; total_qty: string; total_value: string }[]
    >(
      `SELECT avg_cost, total_qty, total_value FROM raw_materials WHERE id = $1 FOR UPDATE`,
      rawMaterialId
    );

    if (!locked.length) throw new Error(`Raw material ${rawMaterialId} not found.`);

    const existingQty = Number(locked[0].total_qty);
    const existingValue = Number(locked[0].total_value);
    const oldAvgCost = Number(locked[0].avg_cost);

    if (existingQty <= 0) {
      throw new Error("Cannot apply landed cost: material has zero stock.");
    }

    const newTotalValue = existingValue + amount;
    const newAvgCost = newTotalValue / existingQty;

    // Ledger entry for the cost adjustment
    await tx.inventoryLedger.create({
      data: {
        rawMaterialId,
        type: "ADJUSTMENT_PLUS",
        qty: new Decimal(0), // No quantity change
        unitCost: new Decimal(0),
        totalCost: new Decimal(amount),
        landedCost: new Decimal(amount),
        runningAvgCost: new Decimal(newAvgCost),
        runningQty: new Decimal(existingQty),
        runningValue: new Decimal(newTotalValue),
        reference,
        notes: notes ?? "Delayed landed cost adjustment",
      },
    });

    await tx.rawMaterial.update({
      where: { id: rawMaterialId },
      data: {
        avgCost: new Decimal(newAvgCost),
        totalValue: new Decimal(newTotalValue),
      },
    });

    await createAuditLog({
      tenantId,
      userId,
      tableName: "raw_materials",
      recordId: rawMaterialId,
      action: "UPDATE",
      oldValues: { avgCost: oldAvgCost, totalValue: existingValue },
      newValues: { avgCost: newAvgCost, totalValue: newTotalValue, delayedLandedCost: amount },
    });

    return { rawMaterialId, oldAvgCost, newAvgCost, amountAdded: amount };
  });
}

// ──────────────────────────────────────────────────────────────────────
// OUTBOUND (unchanged logic, now with row-level lock)
// ──────────────────────────────────────────────────────────────────────

interface OutboundPayload {
  rawMaterialId: string;
  qty: number;
  reference?: string;
  notes?: string;
  tenantId: string;
  userId?: string;
}

/**
 * Records material consumption (OUTBOUND) for production at the current AVCO.
 */
export async function recordOutbound(payload: OutboundPayload) {
  const { rawMaterialId, qty, reference, notes, tenantId, userId } = payload;

  return prisma.$transaction(async (tx) => {
    // Row-level lock
    const locked = await tx.$queryRawUnsafe<
      { avg_cost: string; total_qty: string; total_value: string; name: string }[]
    >(
      `SELECT avg_cost, total_qty, total_value, name FROM raw_materials WHERE id = $1 FOR UPDATE`,
      rawMaterialId
    );

    if (!locked.length) throw new Error(`Raw material ${rawMaterialId} not found.`);

    const mat = locked[0];
    const currentAvgCost = Number(mat.avg_cost);
    const existingQty = Number(mat.total_qty);
    const existingValue = Number(mat.total_value);

    if (qty > existingQty) {
      throw new Error(
        `Insufficient stock for "${mat.name}". Available: ${existingQty}, Requested: ${qty}`
      );
    }

    const consumedValue = qty * currentAvgCost;
    const newTotalQty = existingQty - qty;
    const newTotalValue = existingValue - consumedValue;

    const entry = await tx.inventoryLedger.create({
      data: {
        rawMaterialId,
        type: "OUTBOUND",
        qty: new Decimal(-qty),
        unitCost: new Decimal(currentAvgCost),
        totalCost: new Decimal(-consumedValue),
        runningAvgCost: new Decimal(currentAvgCost),
        runningQty: new Decimal(newTotalQty),
        runningValue: new Decimal(newTotalValue),
        reference,
        notes,
      },
    });

    await tx.rawMaterial.update({
      where: { id: rawMaterialId },
      data: {
        totalQty: new Decimal(newTotalQty),
        totalValue: new Decimal(newTotalValue),
      },
    });

    await createAuditLog({
      tenantId,
      userId,
      tableName: "inventory_ledger",
      recordId: entry.id,
      action: "CREATE",
      newValues: { type: "OUTBOUND", qty, avgCost: currentAvgCost },
    });

    return entry;
  });
}
