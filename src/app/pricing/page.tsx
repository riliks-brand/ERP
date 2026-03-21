"use client";

import DashboardLayout from "@/components/DashboardLayout";
import { useState } from "react";

export default function PricingPage() {
  const [targetMargin, setTargetMargin] = useState(30);
  const [returnRate, setReturnRate] = useState(12);
  const [platformFee, setPlatformFee] = useState(5);
  const [shippingCost, setShippingCost] = useState(45);
  const [absorbShipping, setAbsorbShipping] = useState(true);

  // Demo COGS values (would come from API in production)
  const demoCogs = [
    { sku: "HDY-001-BLK-M", name: "Classic Hoodie (BLK-M)", materialCost: 135, laborCost: 30, packagingCost: 8 },
    { sku: "HDY-001-BLK-XL", name: "Classic Hoodie (BLK-XL)", materialCost: 155, laborCost: 30, packagingCost: 8 },
    { sku: "TSH-001-WHT-M", name: "Basic T-Shirt (WHT-M)", materialCost: 38, laborCost: 12, packagingCost: 5 },
  ];

  const totalDeductionPct = (targetMargin + returnRate + platformFee) / 100;
  const isViable = totalDeductionPct < 1;

  function calcPrice(cogs: number) {
    const effectiveCost = cogs + (absorbShipping ? shippingCost : 0);
    if (!isViable) return { suggested: 0, rounded: 0 };
    const suggested = effectiveCost / (1 - totalDeductionPct);
    return {
      suggested: Math.round(suggested * 100) / 100,
      rounded: Math.ceil(suggested / 5) * 5,
    };
  }

  return (
    <DashboardLayout>
      <div className="page-header">
        <h2>Smart Pricing Calculator ✨</h2>
        <p>Set your target profit margin and let the engine calculate the optimal selling price</p>
      </div>

      {/* Controls */}
      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1.25rem" }}>
          🎯 Pricing Parameters
        </h3>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "1rem" }}>
          <div>
            <label className="text-muted" style={{ fontSize: "0.75rem", display: "block", marginBottom: "0.3rem" }}>
              Target Profit Margin %
            </label>
            <input
              className="input"
              type="number"
              value={targetMargin}
              onChange={(e) => setTargetMargin(Number(e.target.value))}
              min="5" max="80"
            />
          </div>
          <div>
            <label className="text-muted" style={{ fontSize: "0.75rem", display: "block", marginBottom: "0.3rem" }}>
              Avg Return Rate %
            </label>
            <input
              className="input"
              type="number"
              value={returnRate}
              onChange={(e) => setReturnRate(Number(e.target.value))}
              min="0" max="50"
            />
          </div>
          <div>
            <label className="text-muted" style={{ fontSize: "0.75rem", display: "block", marginBottom: "0.3rem" }}>
              Platform Commission %
            </label>
            <input
              className="input"
              type="number"
              value={platformFee}
              onChange={(e) => setPlatformFee(Number(e.target.value))}
              min="0" max="30"
            />
          </div>
          <div>
            <label className="text-muted" style={{ fontSize: "0.75rem", display: "block", marginBottom: "0.3rem" }}>
              Shipping / Order (EGP)
            </label>
            <input
              className="input"
              type="number"
              value={shippingCost}
              onChange={(e) => setShippingCost(Number(e.target.value))}
              min="0"
            />
          </div>
        </div>

        <div style={{ marginTop: "1rem", display: "flex", alignItems: "center", gap: "1.5rem" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={absorbShipping}
              onChange={(e) => setAbsorbShipping(e.target.checked)}
            />{" "}
            Absorb shipping cost into selling price (free shipping model)
          </label>

          {!isViable && (
            <span style={{
              background: "rgba(225, 112, 85, 0.15)", color: "var(--color-danger)",
              padding: "0.4rem 0.8rem", borderRadius: 6, fontSize: "0.8rem", fontWeight: 600,
            }}>
              ⚠️ Total deductions ({Math.round(totalDeductionPct * 100)}%) exceed 100%!
            </span>
          )}
        </div>
      </div>

      {/* Formula */}
      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <h4 style={{ fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.75rem", color: "var(--color-text-muted)" }}>
          PRICING FORMULA
        </h4>
        <code className="text-mono" style={{ fontSize: "0.85rem", color: "var(--color-primary-light)" }}>
          Selling_Price = (COGS{absorbShipping ? " + Shipping" : ""}) / (1 - {targetMargin}% - {returnRate}% - {platformFee}%)
          = Cost / {isViable ? (1 - totalDeductionPct).toFixed(2) : "ERROR"}
        </code>
      </div>

      {/* Results Table */}
      <div className="card">
        <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1rem" }}>
          💰 Suggested Prices
        </h3>

        <table className="data-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>SKU</th>
              <th>Material</th>
              <th>Labor</th>
              <th>Pkg</th>
              <th>COGS</th>
              {absorbShipping && <th>+ Ship</th>}
              <th>Eff. Cost</th>
              <th>Suggested</th>
              <th>Rounded</th>
              <th>Margin</th>
            </tr>
          </thead>
          <tbody>
            {demoCogs.map((item) => {
              const totalCogs = item.materialCost + item.laborCost + item.packagingCost;
              const prices = calcPrice(totalCogs);
              const actualMargin = prices.rounded > 0
                ? ((prices.rounded - totalCogs - (absorbShipping ? shippingCost : 0)) / prices.rounded * 100)
                : 0;

              return (
                <tr key={item.sku}>
                  <td style={{ fontWeight: 600 }}>{item.name}</td>
                  <td><code className="text-mono" style={{ fontSize: "0.75rem" }}>{item.sku}</code></td>
                  <td className="text-mono">EGP {item.materialCost}</td>
                  <td className="text-mono">EGP {item.laborCost}</td>
                  <td className="text-mono">EGP {item.packagingCost}</td>
                  <td className="text-mono" style={{ fontWeight: 600 }}>EGP {totalCogs}</td>
                  {absorbShipping && <td className="text-mono text-muted">+{shippingCost}</td>}
                  <td className="text-mono" style={{ fontWeight: 600, color: "var(--color-warning)" }}>
                    EGP {totalCogs + (absorbShipping ? shippingCost : 0)}
                  </td>
                  <td className="text-mono">EGP {prices.suggested}</td>
                  <td className="text-mono" style={{ fontWeight: 700, fontSize: "1rem", color: "var(--color-primary-light)" }}>
                    EGP {prices.rounded}
                  </td>
                  <td>
                    <span className={`text-mono ${actualMargin >= targetMargin ? "text-success" : "text-warning"}`} style={{ fontWeight: 600 }}>
                      {actualMargin.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}
