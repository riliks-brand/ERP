/**
 * Cash Flow Predictor Engine
 *
 * Aggregates financial data from multiple sources to produce a 30-day
 * liquidity forecast for the brand owner.
 *
 * Sources:
 *   - Shipping Provider Wallets (In-Transit Cash)
 *   - Vendor Ledger (Pending Payables)
 *   - Recent revenue & expenses trends
 */

import prisma from "@/lib/prisma";

interface CashFlowSnapshot {
  brandId: string;
  generatedAt: string;

  // Current State
  inTransitCash: number;           // Money held by shipping companies
  pendingVendorPayables: number;   // Amount owed to suppliers/workshops
  pendingVendorReceivables: number; // Amount vendors owe us (rare)

  // Revenue Forecast
  avgDailyRevenue: number;          // Based on last 30 days collected
  projectedRevenue30d: number;

  // Expense Forecast
  avgDailyExpenses: number;
  projectedExpenses30d: number;

  // Net Forecast
  netCashForecast30d: number;

  // Alerts
  alerts: CashFlowAlert[];

  // Vendor Breakdown
  vendorBreakdown: { name: string; type: string; balance: number; urgent: boolean }[];
}

interface CashFlowAlert {
  type: "DANGER" | "WARNING" | "INFO";
  message: string;
}

/**
 * Generate a comprehensive 30-day cash flow forecast.
 */
export async function generateCashFlowForecast(
  brandId: string
): Promise<CashFlowSnapshot> {
  // 1. In-Transit Cash from shipping wallets
  const shippingProviders = await prisma.shippingProvider.findMany({
    where: { brandId },
    select: { name: true, walletBalance: true },
  });
  const inTransitCash = shippingProviders.reduce(
    (sum, p) => sum + Number(p.walletBalance),
    0
  );

  // 2. Vendor Payables & Receivables
  const vendors = await prisma.vendor.findMany({
    where: { brandId },
    select: { name: true, type: true, balance: true },
  });

  const pendingVendorPayables = vendors
    .filter((v) => Number(v.balance) < 0)
    .reduce((sum, v) => sum + Math.abs(Number(v.balance)), 0);

  const pendingVendorReceivables = vendors
    .filter((v) => Number(v.balance) > 0)
    .reduce((sum, v) => sum + Number(v.balance), 0);

  const vendorBreakdown = vendors.map((v) => ({
    name: v.name,
    type: v.type,
    balance: Number(v.balance),
    urgent: Number(v.balance) < -5000, // Flag if we owe more than 5k
  }));

  // 3. Revenue: average from COLLECTED orders in the last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const collectedOrders = await prisma.salesOrder.findMany({
    where: {
      brandId,
      status: "COLLECTED",
      updatedAt: { gte: thirtyDaysAgo },
    },
    select: { totalAmount: true },
  });

  const totalRevenue30d = collectedOrders.reduce(
    (sum, o) => sum + Number(o.totalAmount),
    0
  );
  const avgDailyRevenue = totalRevenue30d / 30;
  const projectedRevenue30d = avgDailyRevenue * 30;

  // 4. Expenses: vendor payments in last 30 days
  const recentPayments = await prisma.vendorLedger.findMany({
    where: {
      vendor: { brandId },
      type: "PAYMENT",
      createdAt: { gte: thirtyDaysAgo },
    },
    select: { amount: true },
  });

  const totalExpenses30d = recentPayments.reduce(
    (sum, p) => sum + Number(p.amount),
    0
  );
  const avgDailyExpenses = totalExpenses30d / 30;
  const projectedExpenses30d = avgDailyExpenses * 30;

  // 5. Net Forecast
  const netCashForecast30d =
    inTransitCash +
    projectedRevenue30d -
    pendingVendorPayables -
    projectedExpenses30d;

  // 6. Generate Alerts
  const alerts: CashFlowAlert[] = [];

  if (pendingVendorPayables > inTransitCash + totalRevenue30d * 0.5) {
    alerts.push({
      type: "DANGER",
      message: `⚠️ المديونية للموردين (EGP ${pendingVendorPayables.toLocaleString()}) تتجاوز 50% من السيولة المتوقعة. يجب تأجيل بعض المدفوعات أو تسريع التحصيل.`,
    });
  }

  if (inTransitCash > projectedRevenue30d * 0.4) {
    alerts.push({
      type: "WARNING",
      message: `💰 ${Math.round((inTransitCash / (inTransitCash + totalRevenue30d)) * 100)}% من أموالك محتجزة لدى شركات الشحن (EGP ${inTransitCash.toLocaleString()}). تواصل مع الشركات لتسريع التحويل.`,
    });
  }

  if (netCashForecast30d > 0) {
    alerts.push({
      type: "INFO",
      message: `✅ التوقع الصافي للـ 30 يوم القادمة إيجابي: EGP ${Math.round(netCashForecast30d).toLocaleString()}.`,
    });
  }

  const urgentVendors = vendorBreakdown.filter((v) => v.urgent);
  if (urgentVendors.length > 0) {
    alerts.push({
      type: "WARNING",
      message: `🏭 ${urgentVendors.length} مورّد لديه مديونية تتجاوز 5,000 جنيه. راجع جدول السداد.`,
    });
  }

  return {
    brandId,
    generatedAt: new Date().toISOString(),
    inTransitCash,
    pendingVendorPayables,
    pendingVendorReceivables,
    avgDailyRevenue: Math.round(avgDailyRevenue),
    projectedRevenue30d: Math.round(projectedRevenue30d),
    avgDailyExpenses: Math.round(avgDailyExpenses),
    projectedExpenses30d: Math.round(projectedExpenses30d),
    netCashForecast30d: Math.round(netCashForecast30d),
    alerts,
    vendorBreakdown,
  };
}
