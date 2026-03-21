export default function Home() {
  return (
    <div className="dashboard-grid">
      {/* ── Sidebar ── */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <h1>Fashion ERP</h1>
          <span>Financial &amp; Ops Engine</span>
        </div>

        <ul className="sidebar-nav">
          <li className="sidebar-section-title">Overview</li>
          <li>
            <a href="/" className="active">
              📊 Dashboard
            </a>
          </li>

          <li className="sidebar-section-title">Production</li>
          <li>
            <a href="/products">📦 Products &amp; BOM</a>
          </li>
          <li>
            <a href="/raw-materials">🧵 Raw Materials</a>
          </li>
          <li>
            <a href="/production">🏭 Production Orders</a>
          </li>
          <li>
            <a href="/vendors">🤝 Vendors</a>
          </li>

          <li className="sidebar-section-title">Sales &amp; Logistics</li>
          <li>
            <a href="/orders">🛒 Sales Orders</a>
          </li>
          <li>
            <a href="/reconciliation">💳 Shipping Reconciliation</a>
          </li>
          <li>
            <a href="/returns">↩️ Returns</a>
          </li>

          <li className="sidebar-section-title">Finance</li>
          <li>
            <a href="/reports">📈 Reports</a>
          </li>
          <li>
            <a href="/settings">⚙️ Settings</a>
          </li>
        </ul>
      </aside>

      {/* ── Main Content ── */}
      <main className="main-content">
        <div className="page-header">
          <h2>Financial Dashboard</h2>
          <p>Real-time overview of your brand&apos;s financial health</p>
        </div>

        {/* KPI Cards */}
        <div className="card-grid" style={{ marginBottom: "2rem" }}>
          <div className="card">
            <div className="kpi">
              <span className="kpi-label">True Net Profit</span>
              <span className="kpi-value text-success">—</span>
              <span className="kpi-trend up">Connect DB to load data</span>
            </div>
          </div>

          <div className="card">
            <div className="kpi">
              <span className="kpi-label">In-Transit Cash</span>
              <span className="kpi-value" style={{ color: "var(--color-info)" }}>—</span>
              <span className="kpi-trend" style={{ color: "var(--color-text-muted)" }}>
                Shipping wallet balance
              </span>
            </div>
          </div>

          <div className="card">
            <div className="kpi">
              <span className="kpi-label">Cutting Efficiency</span>
              <span className="kpi-value" style={{ color: "var(--color-warning)" }}>—</span>
              <span className="kpi-trend" style={{ color: "var(--color-text-muted)" }}>
                Avg across batches
              </span>
            </div>
          </div>

          <div className="card">
            <div className="kpi">
              <span className="kpi-label">Return Loss (MTD)</span>
              <span className="kpi-value text-danger">—</span>
              <span className="kpi-trend down">Forward + return shipping + refurbishment</span>
            </div>
          </div>
        </div>

        {/* Placeholder Sections */}
        <div className="card" style={{ marginBottom: "1.5rem" }}>
          <h3 style={{ marginBottom: "0.75rem", fontSize: "1rem", fontWeight: 600 }}>
            🚀 Getting Started
          </h3>
          <p className="text-muted" style={{ fontSize: "0.9rem", lineHeight: 1.7 }}>
            Welcome to <strong>Fashion ERP</strong>. To begin, configure your
            database connection in <code>.env</code>, run{" "}
            <code>npx prisma db push</code> to create the schema, then start
            adding your raw materials, products, and BOM definitions.
          </p>
        </div>

        <div className="card-grid">
          <div className="card">
            <h4 style={{ marginBottom: "0.5rem", fontSize: "0.9rem" }}>
              Recent Production Orders
            </h4>
            <p className="text-muted" style={{ fontSize: "0.8rem" }}>
              No production orders yet.
            </p>
          </div>
          <div className="card">
            <h4 style={{ marginBottom: "0.5rem", fontSize: "0.9rem" }}>
              Dead Stock Alerts
            </h4>
            <p className="text-muted" style={{ fontSize: "0.8rem" }}>
              No stale inventory detected.
            </p>
          </div>
          <div className="card">
            <h4 style={{ marginBottom: "0.5rem", fontSize: "0.9rem" }}>
              Pending Reconciliations
            </h4>
            <p className="text-muted" style={{ fontSize: "0.8rem" }}>
              Upload a shipping file to begin.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
