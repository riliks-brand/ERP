"use client";

import DashboardLayout from "@/components/DashboardLayout";
import { useState } from "react";

interface RawMaterial {
  id: string;
  name: string;
  sku: string;
  unit: string;
  avgCost: number;
  totalQty: number;
  totalValue: number;
  minStock: number;
  currency: string;
  status: "ok" | "low" | "out";
}

const DEMO_MATERIALS: RawMaterial[] = [
  { id: "1", name: "Jersey Cotton Fabric - Black", sku: "FAB-JRS-BLK", unit: "METER", avgCost: 85.5, totalQty: 320, totalValue: 27360, minStock: 50, currency: "EGP", status: "ok" },
  { id: "2", name: "Melton Wool Fabric - Grey", sku: "FAB-MLT-GRY", unit: "METER", avgCost: 145.0, totalQty: 180, totalValue: 26100, minStock: 30, currency: "EGP", status: "ok" },
  { id: "3", name: "YKK Zipper 50cm - Black", sku: "ACC-ZIP-BLK50", unit: "PIECE", avgCost: 12.0, totalQty: 15, totalValue: 180, minStock: 50, currency: "EGP", status: "low" },
  { id: "4", name: "Brand Woven Label", sku: "ACC-LBL-WVN", unit: "PIECE", avgCost: 3.5, totalQty: 0, totalValue: 0, minStock: 200, currency: "EGP", status: "out" },
  { id: "5", name: "Polyester Thread - White", sku: "ACC-THR-WHT", unit: "ROLL", avgCost: 22.0, totalQty: 48, totalValue: 1056, minStock: 10, currency: "EGP", status: "ok" },
  { id: "6", name: "Packing Poly Bag (M)", sku: "PKG-BAG-M", unit: "PIECE", avgCost: 1.25, totalQty: 500, totalValue: 625, minStock: 100, currency: "EGP", status: "ok" },
];

const STATUS_STYLES: Record<string, string> = {
  ok: "badge-success",
  low: "badge-warning",
  out: "badge-danger",
};

const STATUS_LABELS: Record<string, string> = {
  ok: "In Stock",
  low: "Low Stock",
  out: "Out of Stock",
};

export default function RawMaterialsPage() {
  const [showInbound, setShowInbound] = useState(false);

  return (
    <DashboardLayout>
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h2>Raw Materials</h2>
          <p>Inventory management with AVCO (Weighted Average Cost) tracking</p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button className="btn btn-outline" onClick={() => setShowInbound(true)}>📥 Record Purchase</button>
          <button className="btn btn-primary">+ New Material</button>
        </div>
      </div>

      {/* Stats */}
      <div className="card-grid" style={{ marginBottom: "1.5rem" }}>
        <div className="card">
          <div className="kpi">
            <span className="kpi-label">Total Inventory Value</span>
            <span className="kpi-value" style={{ color: "var(--color-primary-light)" }}>
              EGP {DEMO_MATERIALS.reduce((s, m) => s + m.totalValue, 0).toLocaleString()}
            </span>
          </div>
        </div>
        <div className="card">
          <div className="kpi">
            <span className="kpi-label">Low Stock Items</span>
            <span className="kpi-value text-warning">{DEMO_MATERIALS.filter((m) => m.status === "low").length}</span>
          </div>
        </div>
        <div className="card">
          <div className="kpi">
            <span className="kpi-label">Out of Stock</span>
            <span className="kpi-value text-danger">{DEMO_MATERIALS.filter((m) => m.status === "out").length}</span>
          </div>
        </div>
      </div>

      {/* Materials Table */}
      <div className="card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Material</th>
              <th>SKU</th>
              <th>Unit</th>
              <th>Avg Cost</th>
              <th>Qty on Hand</th>
              <th>Total Value</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {DEMO_MATERIALS.map((m) => (
              <tr key={m.id}>
                <td style={{ fontWeight: 600 }}>{m.name}</td>
                <td><code className="text-mono" style={{ fontSize: "0.8rem" }}>{m.sku}</code></td>
                <td>{m.unit}</td>
                <td className="text-mono">EGP {m.avgCost.toFixed(2)}</td>
                <td className="text-mono">{m.totalQty}</td>
                <td className="text-mono" style={{ fontWeight: 600 }}>EGP {m.totalValue.toLocaleString()}</td>
                <td><span className={`badge ${STATUS_STYLES[m.status]}`}>{STATUS_LABELS[m.status]}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Inbound Purchase Modal */}
      {showInbound && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100,
        }} onClick={() => setShowInbound(false)}>
          <div className="card" style={{ width: "90%", maxWidth: 520 }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginBottom: "1.25rem", fontSize: "1.1rem", fontWeight: 700 }}>📥 Record Purchase (Inbound)</h3>
            <p className="text-muted" style={{ fontSize: "0.8rem", marginBottom: "1rem" }}>
              This will update the Weighted Average Cost (AVCO) automatically.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label className="text-muted" style={{ fontSize: "0.75rem", display: "block", marginBottom: "0.3rem" }}>Raw Material</label>
                <select className="input">
                  <option value="">Select material...</option>
                  {DEMO_MATERIALS.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div>
                  <label className="text-muted" style={{ fontSize: "0.75rem", display: "block", marginBottom: "0.3rem" }}>Quantity</label>
                  <input className="input" type="number" placeholder="e.g. 200" />
                </div>
                <div>
                  <label className="text-muted" style={{ fontSize: "0.75rem", display: "block", marginBottom: "0.3rem" }}>Unit Cost (EGP)</label>
                  <input className="input" type="number" placeholder="e.g. 90.00" />
                </div>
              </div>
              <div>
                <label className="text-muted" style={{ fontSize: "0.75rem", display: "block", marginBottom: "0.3rem" }}>Landed Cost — Transport / Customs (EGP)</label>
                <input className="input" type="number" placeholder="0.00" />
              </div>
              <div>
                <label className="text-muted" style={{ fontSize: "0.75rem", display: "block", marginBottom: "0.3rem" }}>Reference / Invoice#</label>
                <input className="input" placeholder="e.g. INV-2026-042" />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem" }}>
                <button className="btn btn-outline" onClick={() => setShowInbound(false)}>Cancel</button>
                <button className="btn btn-primary">Record Purchase</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
