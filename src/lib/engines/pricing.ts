/**
 * Smart Pricing Engine
 *
 * Recommends an optimal selling price for a product variant based on:
 *   SellingPrice = COGS / (1 - TargetMargin% - AvgReturnRate% - PlatformCommission% - ShippingAbsorption%)
 *
 * This ensures the brand hits its target net profit AFTER accounting for:
 *   - True COGS (from BOM × AVCO)
 *   - Average return rate (sunk cost of double shipping + refurbishment)
 *   - Platform commission (e.g. 5% Shopify fee)
 *   - Shipping cost absorption (if the brand offers "free shipping")
 */

import { calculateVariantCogs } from "@/lib/engines/cogs";

interface PricingInput {
  variantId: string;
  laborCostPerUnit: number;
  packagingCostPerUnit: number;
  targetMarginPct: number;       // e.g. 30 = 30% net profit
  avgReturnRatePct?: number;     // e.g. 12 = 12% of orders get returned
  platformCommissionPct?: number; // e.g. 5 = 5%
  shippingCostPerOrder?: number;  // e.g. 45 EGP
  absorbShipping?: boolean;       // If true, shipping is baked into price
}

interface PricingResult {
  variantId: string;
  sku: string;
  cogs: number;
  suggestedPrice: number;
  roundedPrice: number;
  breakdown: {
    materialCost: number;
    laborCost: number;
    packagingCost: number;
    totalCogs: number;
    shippingAbsorbed: number;
    effectiveCost: number;
    targetMarginPct: number;
    avgReturnRatePct: number;
    platformCommissionPct: number;
    totalDeductionPct: number;
  };
}

/**
 * Calculate the recommended selling price for a variant.
 */
export async function calculateSmartPrice(
  input: PricingInput
): Promise<PricingResult> {
  const {
    variantId,
    laborCostPerUnit,
    packagingCostPerUnit,
    targetMarginPct,
    avgReturnRatePct = 0,
    platformCommissionPct = 0,
    shippingCostPerOrder = 0,
    absorbShipping = false,
  } = input;

  // 1. Get real-time COGS from BOM engine
  const cogs = await calculateVariantCogs(
    variantId,
    laborCostPerUnit,
    packagingCostPerUnit
  );

  // 2. Effective cost = COGS + shipping (if absorbed)
  const shippingAbsorbed = absorbShipping ? shippingCostPerOrder : 0;
  const effectiveCost = cogs.totalUnitCost + shippingAbsorbed;

  // 3. Total deduction percentage
  //    These are costs that come FROM the selling price, not from production.
  const totalDeductionPct =
    (targetMarginPct + avgReturnRatePct + platformCommissionPct) / 100;

  if (totalDeductionPct >= 1) {
    throw new Error(
      `Total deduction percentages (${targetMarginPct}% + ${avgReturnRatePct}% + ${platformCommissionPct}%) ` +
      `exceed 100%. Cannot calculate a viable price.`
    );
  }

  // 4. The formula:
  //    SellingPrice = EffectiveCost / (1 - totalDeductionPct)
  //
  //    Example: COGS = 100, target margin 30%, return rate 10%, commission 5%
  //    Price = 100 / (1 - 0.45) = 100 / 0.55 = 181.82 EGP
  const suggestedPrice = effectiveCost / (1 - totalDeductionPct);

  // Round up to nearest 5 or 10 for clean pricing
  const roundedPrice = Math.ceil(suggestedPrice / 5) * 5;

  return {
    variantId,
    sku: cogs.sku,
    cogs: cogs.totalUnitCost,
    suggestedPrice: Math.round(suggestedPrice * 100) / 100,
    roundedPrice,
    breakdown: {
      materialCost: cogs.materialCost,
      laborCost: cogs.laborCost,
      packagingCost: cogs.packagingCost,
      totalCogs: cogs.totalUnitCost,
      shippingAbsorbed,
      effectiveCost,
      targetMarginPct,
      avgReturnRatePct,
      platformCommissionPct,
      totalDeductionPct: totalDeductionPct * 100,
    },
  };
}

/**
 * Batch pricing: calculate suggested prices for multiple variants.
 */
export async function calculateBatchPricing(
  variantIds: string[],
  defaults: Omit<PricingInput, "variantId">
): Promise<PricingResult[]> {
  return Promise.all(
    variantIds.map((variantId) =>
      calculateSmartPrice({ ...defaults, variantId })
    )
  );
}
