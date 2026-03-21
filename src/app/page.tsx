"use client";

import DashboardLayout from "@/components/DashboardLayout";

export default function Home() {
  return (
    <DashboardLayout>
      <div className="page-header">
        <h2>Financial Dashboard</h2>
        <p>Real-time overview of your brand&apos;s financial health</p>
      </div>

      {/* KPI Cards */}
      <div className="card-grid" style={{ marginBottom: "2rem" }}>
        <div className="card">
          <div className="kpi">
            <span className="kpi-label">True Net Profit</span>
            <span className="kpi-value text-success">EGP 0</span>
            <span className="kpi-trend up">+0% from last month</span>
          </div>
        </div>

        <div className="card">
          <div className="kpi">
            <span className="kpi-label">In-Transit Cash</span>
            <span className="kpi-value" style={{ color: "var(--color-info)" }}>
              EGP 0
            </span>
            <span className="text-muted" style={{ fontSize: "0.8rem" }}>
              Shipping wallet balance
            </span>
          </div>
        </div>

        <div className="card">
          <div className="kpi">
            <span className="kpi-label">Cutting Efficiency</span>
            <span className="kpi-value" style={{ color: "var(--color-warning)" }}>
              —%
            </span>
            <span className="text-muted" style={{ fontSize: "0.8rem" }}>
              Avg across production batches
            </span>
          </div>
        </div>

        <div className="card">
          <div className="kpi">
            <span className="kpi-label">Return Loss (MTD)</span>
            <span className="kpi-value text-danger">EGP 0</span>
            <span className="kpi-trend down">Shipping + refurbishment costs</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <h3 style={{ marginBottom: "1rem", fontSize: "1rem", fontWeight: 600 }}>
          ⚡ Quick Actions
        </h3>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <a href="/products" className="btn btn-primary">+ New Product</a>
          <a href="/raw-materials" className="btn btn-outline">+ Add Raw Material</a>
          <a href="/production" className="btn btn-outline">+ Production Order</a>
          <a href="/reconciliation" className="btn btn-outline">📤 Upload Shipping File</a>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="card-grid">
        <div className="card">
          <h4 style={{ marginBottom: "0.75rem", fontSize: "0.9rem", fontWeight: 600 }}>
            🏭 Recent Production
          </h4>
          <p className="text-muted" style={{ fontSize: "0.85rem" }}>No production orders yet.</p>
        </div>
        <div className="card">
          <h4 style={{ marginBottom: "0.75rem", fontSize: "0.9rem", fontWeight: 600 }}>
            ⚠️ Dead Stock Alerts
          </h4>
          <p className="text-muted" style={{ fontSize: "0.85rem" }}>No stale inventory detected.</p>
        </div>
        <div className="card">
          <h4 style={{ marginBottom: "0.75rem", fontSize: "0.9rem", fontWeight: 600 }}>
            💳 Pending Reconciliations
          </h4>
          <p className="text-muted" style={{ fontSize: "0.85rem" }}>Upload a shipping file to begin.</p>
        </div>
      </div>
    </DashboardLayout>
  );
}
