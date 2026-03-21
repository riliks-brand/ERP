"use client";

import DashboardLayout from "@/components/DashboardLayout";

export default function ReportsPage() {
  return (
    <DashboardLayout>
      <div className="page-header">
        <h2>Financial Reports</h2>
        <p>CFO-level insights: true profit, cash flow forecast, and dead stock alerts</p>
      </div>

      {/* True Profit Report */}
      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1.25rem" }}>
          📈 True Profit Report — March 2026
        </h3>

        <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "0.5rem 2rem", fontSize: "0.9rem", maxWidth: 500 }}>
          <span>Revenue (Collected Orders)</span>
          <span className="text-mono" style={{ textAlign: "right", fontWeight: 600 }}>EGP 87,400</span>

          <span className="text-muted" style={{ paddingLeft: "1rem" }}>− Cost of Raw Materials (COGS)</span>
          <span className="text-mono text-danger" style={{ textAlign: "right" }}>(EGP 32,180)</span>

          <span className="text-muted" style={{ paddingLeft: "1rem" }}>− Manufacturing (Labor)</span>
          <span className="text-mono text-danger" style={{ textAlign: "right" }}>(EGP 8,750)</span>

          <span className="text-muted" style={{ paddingLeft: "1rem" }}>− Shipping Costs</span>
          <span className="text-mono text-danger" style={{ textAlign: "right" }}>(EGP 6,300)</span>

          <span className="text-muted" style={{ paddingLeft: "1rem" }}>− Return Losses</span>
          <span className="text-mono text-danger" style={{ textAlign: "right" }}>(EGP 2,425)</span>

          <span className="text-muted" style={{ paddingLeft: "1rem" }}>− Ad Spend Allocation</span>
          <span className="text-mono text-danger" style={{ textAlign: "right" }}>(EGP 15,000)</span>

          <div style={{ gridColumn: "1 / -1", borderTop: "2px solid var(--color-border)", margin: "0.5rem 0" }}></div>

          <span style={{ fontWeight: 700, fontSize: "1rem" }}>Net Profit</span>
          <span className="text-mono text-success" style={{ textAlign: "right", fontWeight: 700, fontSize: "1.1rem" }}>
            EGP 22,745
          </span>

          <span className="text-muted" style={{ fontSize: "0.8rem" }}>Profit Margin</span>
          <span className="text-mono text-success" style={{ textAlign: "right", fontWeight: 600 }}>26.0%</span>
        </div>
      </div>

      <div className="card-grid" style={{ marginBottom: "1.5rem" }}>
        {/* Cash Flow Forecast */}
        <div className="card">
          <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1rem" }}>
            💰 Cash Flow Forecast
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <div style={{ padding: "0.75rem", background: "var(--color-bg)", borderRadius: 8 }}>
              <div className="text-muted" style={{ fontSize: "0.7rem", marginBottom: "0.2rem" }}>Cash in Bank</div>
              <div className="text-mono text-success" style={{ fontSize: "1.25rem", fontWeight: 700 }}>EGP 45,200</div>
            </div>
            <div style={{ padding: "0.75rem", background: "var(--color-bg)", borderRadius: 8 }}>
              <div className="text-muted" style={{ fontSize: "0.7rem", marginBottom: "0.2rem" }}>In-Transit (Shipping Wallet)</div>
              <div className="text-mono" style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--color-info)" }}>EGP 28,600</div>
              <div className="text-muted" style={{ fontSize: "0.75rem" }}>Expected by Tue, March 25</div>
            </div>
            <div style={{ padding: "0.75rem", background: "var(--color-bg)", borderRadius: 8 }}>
              <div className="text-muted" style={{ fontSize: "0.7rem", marginBottom: "0.2rem" }}>Pending Payables (Vendors)</div>
              <div className="text-mono text-danger" style={{ fontSize: "1.25rem", fontWeight: 700 }}>EGP 13,300</div>
            </div>
            <div style={{ padding: "0.75rem", background: "var(--color-surface-elevated)", borderRadius: 8, border: "1px solid var(--color-primary)" }}>
              <div className="text-muted" style={{ fontSize: "0.7rem", marginBottom: "0.2rem" }}>Forecast (30-Day)</div>
              <div className="text-mono" style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--color-primary-light)" }}>EGP 60,500</div>
            </div>
          </div>
        </div>

        {/* Dead Stock Alert */}
        <div className="card">
          <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1rem" }}>
            ⚠️ Dead Stock Alerts
          </h3>
          <p className="text-muted" style={{ fontSize: "0.85rem", marginBottom: "1rem" }}>
            Items with zero movement for 30+ days
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {[
              { sku: "HDY-001-GRY-XL", name: "Classic Hoodie (Grey, XL)", days: 45, qty: 22 },
              { sku: "TSH-001-WHT-XS", name: "Basic T-Shirt (White, XS)", days: 38, qty: 65 },
            ].map((item) => (
              <div key={item.sku} style={{
                padding: "0.75rem", background: "var(--color-bg)", borderRadius: 8,
                borderLeft: "3px solid var(--color-warning)",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.3rem" }}>
                  <span style={{ fontWeight: 600, fontSize: "0.85rem" }}>{item.name}</span>
                  <code className="text-mono" style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>{item.sku}</code>
                </div>
                <div style={{ display: "flex", gap: "1.5rem", fontSize: "0.8rem" }}>
                  <span className="text-danger">🕐 {item.days} days idle</span>
                  <span className="text-muted">{item.qty} units in stock</span>
                </div>
              </div>
            ))}
          </div>

          <div style={{
            marginTop: "1rem", padding: "0.75rem", background: "rgba(253, 203, 110, 0.08)",
            borderRadius: 8, fontSize: "0.8rem", color: "var(--color-warning)",
          }}>
            💡 <strong>Recommendation:</strong> Consider running a 20% discount campaign for these items to free up warehouse space and recover capital.
          </div>
        </div>
      </div>

      {/* Burn Rate */}
      <div className="card">
        <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1rem" }}>
          🔥 Monthly Burn Rate
        </h3>
        <div className="card-grid">
          {[
            { label: "Rent & Utilities", amount: 8000 },
            { label: "Salaries", amount: 22000 },
            { label: "Manufacturing", amount: 8750 },
            { label: "Marketing (Ads)", amount: 15000 },
            { label: "Shipping (Net)", amount: 6300 },
            { label: "Misc / Other", amount: 2000 },
          ].map((item) => (
            <div key={item.label} style={{
              padding: "0.75rem", background: "var(--color-surface-elevated)", borderRadius: 8,
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <span style={{ fontSize: "0.85rem" }}>{item.label}</span>
              <span className="text-mono" style={{ fontWeight: 600 }}>EGP {item.amount.toLocaleString()}</span>
            </div>
          ))}
          <div style={{
            padding: "0.75rem", background: "rgba(225, 112, 85, 0.1)", borderRadius: 8,
            display: "flex", justifyContent: "space-between", alignItems: "center",
            border: "1px solid rgba(225, 112, 85, 0.3)", gridColumn: "1 / -1",
          }}>
            <span style={{ fontWeight: 700 }}>Total Monthly Burn</span>
            <span className="text-mono text-danger" style={{ fontWeight: 700, fontSize: "1.1rem" }}>
              EGP {(8000 + 22000 + 8750 + 15000 + 6300 + 2000).toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
