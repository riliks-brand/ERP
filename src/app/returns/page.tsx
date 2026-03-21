"use client";

import DashboardLayout from "@/components/DashboardLayout";

interface ReturnItem {
  id: string;
  orderNumber: string;
  product: string;
  reason: string;
  intact: boolean;
  forwardShipping: number;
  returnShipping: number;
  refurbishment: number;
  totalLoss: number;
  date: string;
}

const DEMO_RETURNS: ReturnItem[] = [
  { id: "1", orderNumber: "ORD-2026-0112", product: "Classic Hoodie (BLK-L)", reason: "Wrong size", intact: true, forwardShipping: 45, returnShipping: 45, refurbishment: 0, totalLoss: 90, date: "2026-03-14" },
  { id: "2", orderNumber: "ORD-2026-0119", product: "Basic T-Shirt (WHT-M)", reason: "Defective stitching", intact: false, forwardShipping: 45, returnShipping: 45, refurbishment: 25, totalLoss: 115, date: "2026-03-16" },
  { id: "3", orderNumber: "ORD-2026-0125", product: "Winter Bundle (SET)", reason: "Customer changed mind", intact: true, forwardShipping: 60, returnShipping: 60, refurbishment: 10, totalLoss: 130, date: "2026-03-17" },
  { id: "4", orderNumber: "ORD-2026-0149", product: "Basic T-Shirt (BLK-M)", reason: "Arrived late", intact: true, forwardShipping: 45, returnShipping: 45, refurbishment: 0, totalLoss: 90, date: "2026-03-18" },
];

export default function ReturnsPage() {
  const totalLoss = DEMO_RETURNS.reduce((s, r) => s + r.totalLoss, 0);
  const intactCount = DEMO_RETURNS.filter((r) => r.intact).length;
  const defectiveCount = DEMO_RETURNS.filter((r) => !r.intact).length;

  return (
    <DashboardLayout>
      <div className="page-header">
        <h2>Returns &amp; Impact Analysis</h2>
        <p>Track return penalties — forward shipping + return shipping + refurbishment = true loss</p>
      </div>

      {/* KPIs */}
      <div className="card-grid" style={{ marginBottom: "1.5rem" }}>
        <div className="card">
          <div className="kpi">
            <span className="kpi-label">Total Return Loss (MTD)</span>
            <span className="kpi-value text-danger">EGP {totalLoss.toLocaleString()}</span>
            <span className="text-muted" style={{ fontSize: "0.8rem" }}>Sunk cost across {DEMO_RETURNS.length} returns</span>
          </div>
        </div>
        <div className="card">
          <div className="kpi">
            <span className="kpi-label">Restocked (Intact)</span>
            <span className="kpi-value text-success">{intactCount}</span>
            <span className="text-muted" style={{ fontSize: "0.8rem" }}>Returned to inventory</span>
          </div>
        </div>
        <div className="card">
          <div className="kpi">
            <span className="kpi-label">Defective / Lost</span>
            <span className="kpi-value text-danger">{defectiveCount}</span>
            <span className="text-muted" style={{ fontSize: "0.8rem" }}>Cannot restock</span>
          </div>
        </div>
      </div>

      {/* Returns Breakdown */}
      <div className="card">
        <h4 style={{ fontSize: "0.9rem", fontWeight: 600, marginBottom: "0.75rem" }}>Return Loss Breakdown</h4>

        <table className="data-table">
          <thead>
            <tr>
              <th>Order #</th>
              <th>Product</th>
              <th>Reason</th>
              <th>∟ Forward</th>
              <th>∟ Return</th>
              <th>∟ Refurbish</th>
              <th>Total Loss</th>
              <th>Condition</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {DEMO_RETURNS.map((r) => (
              <tr key={r.id}>
                <td><code className="text-mono" style={{ fontSize: "0.8rem" }}>{r.orderNumber}</code></td>
                <td style={{ fontWeight: 500 }}>{r.product}</td>
                <td className="text-muted">{r.reason}</td>
                <td className="text-mono">EGP {r.forwardShipping}</td>
                <td className="text-mono">EGP {r.returnShipping}</td>
                <td className="text-mono">{r.refurbishment > 0 ? `EGP ${r.refurbishment}` : "—"}</td>
                <td className="text-mono text-danger" style={{ fontWeight: 700 }}>EGP {r.totalLoss}</td>
                <td>
                  <span className={`badge ${r.intact ? "badge-success" : "badge-danger"}`}>
                    {r.intact ? "Intact → Restocked" : "Defective"}
                  </span>
                </td>
                <td className="text-muted" style={{ fontSize: "0.85rem" }}>{r.date}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Loss Formula */}
        <div style={{
          marginTop: "1.25rem", padding: "1rem", background: "var(--color-bg)",
          borderRadius: 8, border: "1px solid var(--color-border)", fontSize: "0.85rem",
        }}>
          <strong style={{ color: "var(--color-primary-light)" }}>Formula:</strong>{" "}
          <code className="text-mono" style={{ fontSize: "0.8rem" }}>
            Return_Loss = Forward_Shipping + Return_Shipping + Refurbishment_Cost
          </code>
        </div>
      </div>
    </DashboardLayout>
  );
}
