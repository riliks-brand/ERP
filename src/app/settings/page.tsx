"use client";

import DashboardLayout from "@/components/DashboardLayout";

export default function SettingsPage() {
  return (
    <DashboardLayout>
      <div className="page-header">
        <h2>Settings</h2>
        <p>System configuration, currencies, and shipping providers</p>
      </div>

      <div className="card-grid">
        {/* General */}
        <div className="card">
          <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1rem" }}>🏢 Brand Settings</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <div>
              <label className="text-muted" style={{ fontSize: "0.75rem", display: "block", marginBottom: "0.3rem" }}>Brand Name</label>
              <input className="input" placeholder="Your brand name" defaultValue="My Fashion Brand" />
            </div>
            <div>
              <label className="text-muted" style={{ fontSize: "0.75rem", display: "block", marginBottom: "0.3rem" }}>Default Currency</label>
              <select className="input" defaultValue="EGP">
                <option value="EGP">EGP — Egyptian Pound</option>
                <option value="USD">USD — US Dollar</option>
                <option value="SAR">SAR — Saudi Riyal</option>
                <option value="AED">AED — UAE Dirham</option>
              </select>
            </div>
            <button className="btn btn-primary" style={{ alignSelf: "flex-start" }}>Save</button>
          </div>
        </div>

        {/* Shipping Providers */}
        <div className="card">
          <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1rem" }}>🚚 Shipping Providers</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {[
              { name: "Bosta", code: "bosta", rate: 45 },
              { name: "J&T Express", code: "jnt", rate: 45 },
              { name: "Aramex", code: "aramex", rate: 55 },
            ].map((p) => (
              <div key={p.code} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "0.6rem 0.75rem", background: "var(--color-bg)", borderRadius: 8,
              }}>
                <span style={{ fontWeight: 500, fontSize: "0.9rem" }}>{p.name}</span>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span className="text-mono text-muted" style={{ fontSize: "0.8rem" }}>
                    Agreed: EGP {p.rate}
                  </span>
                  <button className="btn btn-outline" style={{ padding: "0.2rem 0.5rem", fontSize: "0.7rem" }}>Edit</button>
                </div>
              </div>
            ))}
            <button className="btn btn-outline" style={{ marginTop: "0.5rem" }}>+ Add Provider</button>
          </div>
        </div>

        {/* Exchange Rates */}
        <div className="card">
          <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1rem" }}>💱 Exchange Rates</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {[
              { from: "USD", to: "EGP", rate: 50.25, manual: false },
              { from: "EUR", to: "EGP", rate: 54.80, manual: true },
            ].map((fx) => (
              <div key={`${fx.from}-${fx.to}`} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "0.6rem 0.75rem", background: "var(--color-bg)", borderRadius: 8,
              }}>
                <span style={{ fontWeight: 500 }}>{fx.from} → {fx.to}</span>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <span className="text-mono" style={{ fontWeight: 600 }}>{fx.rate}</span>
                  <span className={`badge ${fx.manual ? "badge-warning" : "badge-info"}`}>
                    {fx.manual ? "Manual" : "API"}
                  </span>
                </div>
              </div>
            ))}
            <button className="btn btn-outline" style={{ marginTop: "0.5rem" }}>+ Add Rate</button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
