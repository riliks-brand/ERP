/**
 * COGS Engine — Dynamic Cost of Goods Sold Calculator
 *
 * Computes the true unit cost for any product variant using its BOM:
 *   C_unit = Σ(rawMaterial.avgCost × bomItem.qtyRequired) + laborCost + packagingCost
 */

import prisma from "@/lib/prisma";

interface CogsSummary {
  variantId: string;
  sku: string;
  materialCost: number;
  laborCost: number;
  packagingCost: number;
  totalUnitCost: number;
  breakdown: { material: string; qty: number; unitCost: number; lineCost: number }[];
}

/**
 * Calculate the real-time COGS for a single variant based on its BOM + current AVCO prices.
 */
export async function calculateVariantCogs(
  variantId: string,
  laborCostPerUnit: number = 0,
  packagingCostPerUnit: number = 0
): Promise<CogsSummary> {
  const variant = await prisma.productVariant.findUniqueOrThrow({
    where: { id: variantId },
    include: {
      bomItems: {
        include: { rawMaterial: true },
      },
    },
  });

  const breakdown = variant.bomItems.map((item) => {
    const qty = Number(item.qtyRequired);
    const unitCost = Number(item.rawMaterial.avgCost);
    return {
      material: item.rawMaterial.name,
      qty,
      unitCost,
      lineCost: qty * unitCost,
    };
  });

  const materialCost = breakdown.reduce((sum, b) => sum + b.lineCost, 0);
  const totalUnitCost = materialCost + laborCostPerUnit + packagingCostPerUnit;

  return {
    variantId,
    sku: variant.sku,
    materialCost,
    laborCost: laborCostPerUnit,
    packagingCost: packagingCostPerUnit,
    totalUnitCost,
    breakdown,
  };
}

/**
 * Batch-calculate COGS for all variants of a production order.
 */
export async function calculateProductionOrderCogs(productionOrderId: string) {
  const order = await prisma.productionOrder.findUniqueOrThrow({
    where: { id: productionOrderId },
    include: { items: { include: { variant: true } } },
  });

  const results = await Promise.all(
    order.items.map((item) =>
      calculateVariantCogs(
        item.variantId,
        Number(order.laborCostPerUnit),
        Number(order.packagingCostPerUnit)
      ).then((cogs) => ({
        ...cogs,
        qtyOrdered: item.qtyOrdered,
        totalLineCost: cogs.totalUnitCost * item.qtyOrdered,
      }))
    )
  );

  return {
    productionOrderId,
    orderNumber: order.orderNumber,
    items: results,
    grandTotal: results.reduce((s, r) => s + r.totalLineCost, 0),
  };
}
