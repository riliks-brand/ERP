/**
 * AVCO Engine — Weighted Average Cost Algorithm
 *
 * On every INBOUND (purchase), recalculates the weighted average cost:
 *   newAvgCost = (existingValue + incomingValue) / (existingQty + incomingQty)
 *
 * Supports Landed Cost: customs, transport, etc. are distributed proportionally
 * to the purchase quantity to inflate the unit cost before AVCO calculation.
 */

import prisma from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { Decimal } from "@prisma/client/runtime/library";

interface InboundPayload {
  rawMaterialId: string;
  qty: number;
  unitCost: number;
  landedCost?: number; // customs, transport, etc.
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
    // 1. Lock & fetch current material state
    const material = await tx.rawMaterial.findUniqueOrThrow({
      where: { id: rawMaterialId },
    });

    // 2. Calculate new AVCO
    const incomingTotal = qty * unitCost + landedCost;
    const existingValue = Number(material.totalValue);
    const existingQty = Number(material.totalQty);

    const newTotalValue = existingValue + incomingTotal;
    const newTotalQty = existingQty + qty;
    const newAvgCost = newTotalQty > 0 ? newTotalValue / newTotalQty : 0;

    // 3. Create immutable ledger entry
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

    // 4. Update material running totals
    await tx.rawMaterial.update({
      where: { id: rawMaterialId },
      data: {
        avgCost: new Decimal(newAvgCost),
        totalQty: new Decimal(newTotalQty),
        totalValue: new Decimal(newTotalValue),
      },
    });

    // 5. Audit
    await createAuditLog({
      tenantId,
      userId,
      tableName: "inventory_ledger",
      recordId: entry.id,
      action: "CREATE",
      newValues: {
        type: "INBOUND",
        qty,
        unitCost,
        landedCost,
        newAvgCost,
      },
    });

    return entry;
  });
}

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
    const material = await tx.rawMaterial.findUniqueOrThrow({
      where: { id: rawMaterialId },
    });

    const currentAvgCost = Number(material.avgCost);
    const existingQty = Number(material.totalQty);
    const existingValue = Number(material.totalValue);

    if (qty > existingQty) {
      throw new Error(
        `Insufficient stock for ${material.name}. Available: ${existingQty}, Requested: ${qty}`
      );
    }

    const consumedValue = qty * currentAvgCost;
    const newTotalQty = existingQty - qty;
    const newTotalValue = existingValue - consumedValue;
    // AVCO remains the same on outbound
    const avgCost = currentAvgCost;

    const entry = await tx.inventoryLedger.create({
      data: {
        rawMaterialId,
        type: "OUTBOUND",
        qty: new Decimal(-qty),
        unitCost: new Decimal(avgCost),
        totalCost: new Decimal(-consumedValue),
        runningAvgCost: new Decimal(avgCost),
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
      newValues: { type: "OUTBOUND", qty, avgCost },
    });

    return entry;
  });
}
