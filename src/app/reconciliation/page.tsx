"use client";

import DashboardLayout from "@/components/DashboardLayout";
import { useState } from "react";

interface ReconRow {
  id: string;
  orderNumber: string;
  expectedCod: number;
  actualCod: number;
  expectedFee: number;
  actualFee: number;
  returnFee: number;
  flag: "MATCHED" | "DISCREPANCY" | "HIDDEN_FEE" | "MISSING";
}

const FLAG_CONFIG: Record<string, { class: string; label: string; rowClass: string }> = {
  MATCHED: { class: "badge-success", label: "Matched", rowClass: "recon-matched" },
  DISCREPANCY: { class: "badge-warning", label: "Discrepancy", rowClass: "recon-discrepancy" },
  HIDDEN_FEE: { class: "badge-danger", label: "Hidden Fee", rowClass: "" },
  MISSING: { class: "badge-danger", label: "Missing", rowClass: "recon-missing" },
};

const DEMO_ROWS: ReconRow[] = [
  { id: "1", orderNumber: "ORD-2026-0130", expectedCod: 450, actualCod: 450, expectedFee: 45, actualFee: 45, returnFee: 0, flag: "MATCHED" },
  { id: "2", orderNumber: "ORD-2026-0131", expectedCod: 580, actualCod: 540, expectedFee: 45, actualFee: 45, returnFee: 0, flag: "DISCREPANCY" },
  { id: "3", orderNumber: "ORD-2026-0132", expectedCod: 360, actualCod: 360, expectedFee: 45, actualFee: 65, returnFee: 0, flag: "HIDDEN_FEE" },
  { id: "4", orderNumber: "ORD-2026-0133", expectedCod: 920, actualCod: 920, expectedFee: 45, actualFee: 45, returnFee: 0, flag: "MATCHED" },
  { id: "5", orderNumber: "ORD-2026-0134", expectedCod: 180, actualCod: 0, expectedFee: 45, actualFee: 0, returnFee: 45, flag: "MISSING" },
  { id: "6", orderNumber: "ORD-2026-0135", expectedCod: 250, actualCod: 250, expectedFee: 45, actualFee: 45, returnFee: 0, flag: "MATCHED" },
];

export default function ReconciliationPage() {
  const [activeTab, setActiveTab] = useState<"upload" | "results">("results");

  const matched = DEMO_ROWS.filter((r) => r.flag === "MATCHED").length;
  const discrepancies = DEMO_ROWS.filter((r) => r.flag === "DISCREPANCY").length;
  const hiddenFees = DEMO_ROWS.filter((r) => r.flag === "HIDDEN_FEE").length;
  const missing = DEMO_ROWS.filter((r) => r.flag === "MISSING").length;
  const netPayout = DEMO_ROWS.reduce((s, r) => s + r.actualCod - r.actualFee - r.returnFee, 0);

  return (
    <DashboardLayout>
      <div className="page-header">
        <h2>Shipping Reconciliation</h2>
        <p>Match shipping provider statements against your orders — flag discrepancies instantly</p>
      </div>

      {/* Tab Selector */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
        <button
          className={`btn ${activeTab === "upload" ? "btn-primary" : "btn-outline"}`}
          onClick={() => setActiveTab("upload")}
        >
          📤 Upload File
        </button>
        <button
          className={`btn ${activeTab === "results" ? "btn-primary" : "btn-outline"}`}
          onClick={() => setActiveTab("results")}
        >
          📊 Reconciliation Results
        </button>
      </div>

      {activeTab === "upload" && (
        <div className="card" style={{ maxWidth: 600 }}>
          <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1rem" }}>Upload Shipping Statement</h3>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <label className="text-muted" style={{ fontSize: "0.75rem", display: "block", marginBottom: "0.3rem" }}>Shipping Provider</label>
              <select className="input">
                <option value="">Select provider...</option>
                <option value="bosta">Bosta</option>
                <option value="jnt">J&amp;T Express</option>
                <option value="aramex">Aramex</option>
              </select>
            </div>

            <div>
              <label className="text-muted" style={{ fontSize: "0.75rem", display: "block", marginBottom: "0.3rem" }}>Statement File (CSV / Excel)</label>
              <div style={{
                border: "2px dashed var(--color-border)", borderRadius: 12, padding: "2rem",
                textAlign: "center", cursor: "pointer", transition: "border-color 0.2s",
              }}>
                <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>📁</div>
                <p style={{ fontSize: "0.9rem", fontWeight: 500, marginBottom: "0.25rem" }}>
                  Click to upload or drag &amp; drop
                </p>
                <p className="text-muted" style={{ fontSize: "0.75rem" }}>
                  Supports .csv, .xlsx, .xls
                </p>
              </div>
            </div>

            <button className="btn btn-primary" style={{ alignSelf: "flex-start" }}>
              🔄 Run Reconciliation
            </button>
          </div>
        </div>
      )}

      {activeTab === "results" && (
        <>
          {/* KPIs */}
          <div className="card-grid" style={{ marginBottom: "1.5rem" }}>
            <div className="card">
              <div className="kpi">
                <span className="kpi-label">Net Payout</span>
                <span className="kpi-value text-success">EGP {netPayout.toLocaleString()}</span>
              </div>
            </div>
            <div className="card">
              <div className="kpi">
                <span className="kpi-label">Matched</span>
                <span className="kpi-value" style={{ color: "var(--color-success)" }}>{matched}</span>
              </div>
            </div>
            <div className="card">
              <div className="kpi">
                <span className="kpi-label">Discrepancies</span>
                <span className="kpi-value text-warning">{discrepancies}</span>
              </div>
            </div>
            <div className="card">
              <div className="kpi">
                <span className="kpi-label">Hidden Fees</span>
                <span className="kpi-value text-danger">{hiddenFees}</span>
              </div>
            </div>
          </div>

          {/* Results Table */}
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h4 style={{ fontSize: "0.9rem", fontWeight: 600 }}>Statement: bosta_week_12_2026.xlsx</h4>
              <span className="badge badge-neutral">{DEMO_ROWS.length} rows</span>
            </div>

            <table className="data-table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Expected COD</th>
                  <th>Actual COD</th>
                  <th>Expected Fee</th>
                  <th>Actual Fee</th>
                  <th>Return Fee</th>
                  <th>Flag</th>
                </tr>
              </thead>
              <tbody>
                {DEMO_ROWS.map((row) => {
                  const config = FLAG_CONFIG[row.flag];
                  return (
                    <tr key={row.id} className={config.rowClass}>
                      <td><code className="text-mono" style={{ fontSize: "0.8rem" }}>{row.orderNumber}</code></td>
                      <td className="text-mono">EGP {row.expectedCod}</td>
                      <td className={`text-mono ${row.actualCod < row.expectedCod ? "text-danger" : ""}`} style={{ fontWeight: 600 }}>
                        EGP {row.actualCod}
                      </td>
                      <td className="text-mono">EGP {row.expectedFee}</td>
                      <td className={`text-mono ${row.actualFee > row.expectedFee ? "text-danger" : ""}`} style={{ fontWeight: row.actualFee > row.expectedFee ? 600 : 400 }}>
                        EGP {row.actualFee}
                      </td>
                      <td className="text-mono">{row.returnFee > 0 ? `EGP ${row.returnFee}` : "—"}</td>
                      <td><span className={`badge ${config.class}`}>{config.label}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
