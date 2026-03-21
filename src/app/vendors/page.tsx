"use client";

import DashboardLayout from "@/components/DashboardLayout";

interface Vendor {
  id: string;
  name: string;
  type: string;
  typeLabel: string;
  phone: string;
  balance: number;
  currency: string;
  pendingOrders: number;
}

const DEMO_VENDORS: Vendor[] = [
  { id: "1", name: "Al-Mahalla Textiles", type: "FABRIC_SUPPLIER", typeLabel: "Fabric Supplier", phone: "0100-456-7890", balance: -12500, currency: "EGP", pendingOrders: 1 },
  { id: "2", name: "Workshop A — Ahmed Tailor", type: "SEWING_WORKSHOP", typeLabel: "Sewing Workshop", phone: "0111-234-5678", balance: 3200, currency: "EGP", pendingOrders: 2 },
  { id: "3", name: "Workshop B — Cairo Cut", type: "CUTTING_WORKSHOP", typeLabel: "Cutting Workshop", phone: "0122-345-6789", balance: 0, currency: "EGP", pendingOrders: 1 },
  { id: "4", name: "Delta Accessories Co.", type: "ACCESSORIES_SUPPLIER", typeLabel: "Accessories", phone: "0100-111-2222", balance: -800, currency: "EGP", pendingOrders: 0 },
  { id: "5", name: "PackPro Egypt", type: "PACKAGING_SUPPLIER", typeLabel: "Packaging", phone: "0155-888-9999", balance: 0, currency: "EGP", pendingOrders: 0 },
];

const TYPE_BADGES: Record<string, string> = {
  FABRIC_SUPPLIER: "badge-info",
  SEWING_WORKSHOP: "badge-success",
  CUTTING_WORKSHOP: "badge-warning",
  ACCESSORIES_SUPPLIER: "badge-neutral",
  PACKAGING_SUPPLIER: "badge-neutral",
};

export default function VendorsPage() {
  return (
    <DashboardLayout>
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h2>Vendors</h2>
          <p>Supplier &amp; sub-contractor ledger management</p>
        </div>
        <button className="btn btn-primary">+ New Vendor</button>
      </div>

      {/* Summary */}
      <div className="card-grid" style={{ marginBottom: "1.5rem" }}>
        <div className="card">
          <div className="kpi">
            <span className="kpi-label">Total Payable</span>
            <span className="kpi-value text-danger">
              EGP {Math.abs(DEMO_VENDORS.filter((v) => v.balance < 0).reduce((s, v) => s + v.balance, 0)).toLocaleString()}
            </span>
            <span className="text-muted" style={{ fontSize: "0.8rem" }}>Amount you owe to vendors</span>
          </div>
        </div>
        <div className="card">
          <div className="kpi">
            <span className="kpi-label">Total Receivable</span>
            <span className="kpi-value text-success">
              EGP {DEMO_VENDORS.filter((v) => v.balance > 0).reduce((s, v) => s + v.balance, 0).toLocaleString()}
            </span>
            <span className="text-muted" style={{ fontSize: "0.8rem" }}>Pending vendor sub-contracting</span>
          </div>
        </div>
        <div className="card">
          <div className="kpi">
            <span className="kpi-label">Active Vendors</span>
            <span className="kpi-value">{DEMO_VENDORS.length}</span>
          </div>
        </div>
      </div>

      {/* Vendors Table */}
      <div className="card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Vendor</th>
              <th>Type</th>
              <th>Phone</th>
              <th>Balance</th>
              <th>Pending Orders</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {DEMO_VENDORS.map((v) => (
              <tr key={v.id}>
                <td style={{ fontWeight: 600 }}>{v.name}</td>
                <td><span className={`badge ${TYPE_BADGES[v.type]}`}>{v.typeLabel}</span></td>
                <td className="text-mono" style={{ fontSize: "0.85rem" }}>{v.phone}</td>
                <td>
                  <span className={`text-mono ${v.balance < 0 ? "text-danger" : v.balance > 0 ? "text-warning" : "text-muted"}`} style={{ fontWeight: 600 }}>
                    {v.balance < 0 ? `(${Math.abs(v.balance).toLocaleString()})` : v.balance === 0 ? "Settled" : `EGP ${v.balance.toLocaleString()}`}
                  </span>
                </td>
                <td className="text-mono">{v.pendingOrders || "—"}</td>
                <td>
                  <div style={{ display: "flex", gap: "0.4rem" }}>
                    <button className="btn btn-outline" style={{ padding: "0.3rem 0.6rem", fontSize: "0.7rem" }}>Ledger</button>
                    <button className="btn btn-outline" style={{ padding: "0.3rem 0.6rem", fontSize: "0.7rem" }}>Pay</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}
