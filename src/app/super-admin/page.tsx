"use client";

import { useState, useEffect, useCallback } from "react";
import DashboardLayout from "@/components/DashboardLayout";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Metrics {
  totalBrands: number;
  totalGMV: number;
  totalProducts: number;
  totalOrders: number;
}

interface BrandRow {
  id: string;
  name: string;
  slug: string;
  subscriptionTier: "FREE" | "PRO" | "ENTERPRISE";
  createdAt: string;
  currency: string;
  productCount: number;
  orderCount: number;
  userCount: number;
  totalSales: number;
}

interface HealthData {
  database: { status: "healthy" | "degraded" | "down"; latencyMs: number };
  api: { status: "healthy" | "degraded" | "down"; latencyMs: number };
  timestamp: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-EG", {
    style: "currency",
    currency: "EGP",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

function tierBadgeClass(tier: string) {
  switch (tier) {
    case "ENTERPRISE":
      return "sa-badge sa-badge-enterprise";
    case "PRO":
      return "sa-badge sa-badge-pro";
    default:
      return "sa-badge sa-badge-free";
  }
}

function healthDot(status: string) {
  switch (status) {
    case "healthy":
      return "sa-health-dot sa-health-healthy";
    case "degraded":
      return "sa-health-dot sa-health-degraded";
    default:
      return "sa-health-dot sa-health-down";
  }
}

function healthLabel(status: string) {
  switch (status) {
    case "healthy":
      return "Healthy";
    case "degraded":
      return "Degraded";
    default:
      return "Down";
  }
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function SuperAdminPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [brands, setBrands] = useState<BrandRow[]>([]);
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [healthLoading, setHealthLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    brandId: string;
    brandName: string;
    action: "suspend" | "reactivate";
  } | null>(null);

  // ── Fetch dashboard data ──
  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/super-admin");
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setMetrics(data.metrics);
      setBrands(data.brands);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Fetch health ──
  const fetchHealth = useCallback(async () => {
    setHealthLoading(true);
    try {
      const res = await fetch("/api/super-admin/health");
      if (!res.ok) throw new Error("Health check failed");
      const data = await res.json();
      setHealth(data);
    } catch {
      setHealth(null);
    } finally {
      setHealthLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    fetchHealth();

    // Auto-refresh health every 30 seconds
    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, [fetchData, fetchHealth]);

  // ── Handle tier change ──
  async function handleTierChange(brandId: string, newTier: string) {
    setActionLoading(brandId);
    try {
      const res = await fetch(`/api/super-admin/brand/${brandId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscriptionTier: newTier }),
      });
      if (!res.ok) throw new Error("Failed");
      await fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  }

  // ── Handle suspend / reactivate ──
  async function handleSuspend(brandId: string, suspend: boolean) {
    setActionLoading(brandId);
    setConfirmAction(null);
    try {
      const res = await fetch(`/api/super-admin/brand/${brandId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ suspend }),
      });
      if (!res.ok) throw new Error("Failed");
      await fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  }

  // ── Filter brands ──
  const filtered = brands.filter(
    (b) =>
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <DashboardLayout>
        <div
          style={{
            padding: "4rem",
            textAlign: "center",
            color: "var(--color-text-muted)",
          }}
        >
          <div className="sa-spinner" />
          <p style={{ marginTop: "1rem" }}>Loading platform data...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* ── Page Header ── */}
      <div className="page-header" style={{ marginBottom: "1.5rem" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            marginBottom: "0.25rem",
          }}
        >
          <span style={{ fontSize: "1.5rem" }}>🛡️</span>
          <h2 style={{ margin: 0 }}>Super Admin Console</h2>
        </div>
        <p>Platform-level control over all brands, subscriptions, and system health.</p>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
           SECTION 1: Global Metrics
         ══════════════════════════════════════════════════════════════════════ */}
      <div className="sa-metrics-grid">
        <div className="sa-metric-card sa-metric-brands">
          <div className="sa-metric-icon">🏢</div>
          <div className="sa-metric-content">
            <span className="sa-metric-label">Total Brands</span>
            <span className="sa-metric-value">{metrics?.totalBrands ?? 0}</span>
            <span className="sa-metric-sub">Registered on platform</span>
          </div>
        </div>

        <div className="sa-metric-card sa-metric-gmv">
          <div className="sa-metric-icon">💰</div>
          <div className="sa-metric-content">
            <span className="sa-metric-label">Gross Merchandise Volume</span>
            <span className="sa-metric-value">
              {formatCurrency(metrics?.totalGMV ?? 0)}
            </span>
            <span className="sa-metric-sub">Total platform sales</span>
          </div>
        </div>

        <div className="sa-metric-card sa-metric-products">
          <div className="sa-metric-icon">📦</div>
          <div className="sa-metric-content">
            <span className="sa-metric-label">Total Products</span>
            <span className="sa-metric-value">
              {metrics?.totalProducts ?? 0}
            </span>
            <span className="sa-metric-sub">Across all brands</span>
          </div>
        </div>

        <div className="sa-metric-card sa-metric-orders">
          <div className="sa-metric-icon">🧾</div>
          <div className="sa-metric-content">
            <span className="sa-metric-label">Total Orders</span>
            <span className="sa-metric-value">{metrics?.totalOrders ?? 0}</span>
            <span className="sa-metric-sub">All-time processed</span>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
           SECTION 2 + 3: Brand Directory & Subscription Management
         ══════════════════════════════════════════════════════════════════════ */}
      <div className="card" style={{ marginTop: "2rem" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1.25rem",
            flexWrap: "wrap",
            gap: "1rem",
          }}
        >
          <h3 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0 }}>
            Brand Directory
          </h3>
          <div style={{ position: "relative", minWidth: "240px" }}>
            <input
              type="text"
              className="input"
              placeholder="Search brands..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: "2.25rem" }}
            />
            <span
              style={{
                position: "absolute",
                left: "0.75rem",
                top: "50%",
                transform: "translateY(-50%)",
                fontSize: "0.9rem",
                opacity: 0.5,
              }}
            >
              🔍
            </span>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div
            style={{
              padding: "2rem",
              textAlign: "center",
              color: "var(--color-text-muted)",
            }}
          >
            {searchQuery
              ? "No brands match your search."
              : "No brands registered yet."}
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Brand</th>
                  <th>Subscription</th>
                  <th>Joined</th>
                  <th style={{ textAlign: "right" }}>Products</th>
                  <th style={{ textAlign: "right" }}>Orders</th>
                  <th style={{ textAlign: "right" }}>Total Sales</th>
                  <th style={{ textAlign: "right" }}>Users</th>
                  <th style={{ textAlign: "center" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((brand) => (
                  <tr key={brand.id}>
                    {/* Name */}
                    <td>
                      <div>
                        <strong style={{ fontSize: "0.9rem" }}>
                          {brand.name}
                        </strong>
                        <div
                          className="text-muted"
                          style={{ fontSize: "0.7rem" }}
                        >
                          {brand.slug}
                        </div>
                      </div>
                    </td>

                    {/* Tier */}
                    <td>
                      <span className={tierBadgeClass(brand.subscriptionTier)}>
                        {brand.subscriptionTier}
                      </span>
                    </td>

                    {/* Joined */}
                    <td style={{ fontSize: "0.82rem", whiteSpace: "nowrap" }}>
                      {formatDate(brand.createdAt)}
                    </td>

                    {/* Products */}
                    <td
                      style={{
                        textAlign: "right",
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      {brand.productCount}
                    </td>

                    {/* Orders */}
                    <td
                      style={{
                        textAlign: "right",
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      {brand.orderCount}
                    </td>

                    {/* Sales */}
                    <td
                      style={{
                        textAlign: "right",
                        fontFamily: "var(--font-mono)",
                        fontWeight: 600,
                      }}
                    >
                      {formatCurrency(brand.totalSales)}
                    </td>

                    {/* Users */}
                    <td
                      style={{
                        textAlign: "right",
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      {brand.userCount}
                    </td>

                    {/* Actions */}
                    <td>
                      <div
                        style={{
                          display: "flex",
                          gap: "0.4rem",
                          justifyContent: "center",
                          flexWrap: "wrap",
                        }}
                      >
                        {/* Tier Select */}
                        <select
                          className="input"
                          value={brand.subscriptionTier}
                          onChange={(e) =>
                            handleTierChange(brand.id, e.target.value)
                          }
                          disabled={actionLoading === brand.id}
                          style={{
                            width: "auto",
                            padding: "0.3rem 0.5rem",
                            fontSize: "0.72rem",
                            minWidth: "90px",
                          }}
                        >
                          <option value="FREE">FREE</option>
                          <option value="PRO">PRO</option>
                          <option value="ENTERPRISE">ENTERPRISE</option>
                        </select>

                        {/* Suspend / Reactivate */}
                        <button
                          className="btn sa-btn-suspend"
                          onClick={() =>
                            setConfirmAction({
                              brandId: brand.id,
                              brandName: brand.name,
                              action: "suspend",
                            })
                          }
                          disabled={actionLoading === brand.id}
                          style={{
                            padding: "0.3rem 0.6rem",
                            fontSize: "0.72rem",
                          }}
                          title="Suspend brand temporarily"
                        >
                          ⏸️ Suspend
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
           SECTION 4: System Health
         ══════════════════════════════════════════════════════════════════════ */}
      <div className="card" style={{ marginTop: "2rem" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1.25rem",
          }}
        >
          <h3 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0 }}>
            System Health
          </h3>
          <button
            className="btn btn-outline"
            onClick={fetchHealth}
            disabled={healthLoading}
            style={{ padding: "0.35rem 0.75rem", fontSize: "0.78rem" }}
          >
            {healthLoading ? "Checking..." : "🔄 Refresh"}
          </button>
        </div>

        <div className="sa-health-grid">
          {/* Database */}
          <div className="sa-health-card">
            <div className="sa-health-header">
              <span className={healthDot(health?.database.status ?? "down")} />
              <span style={{ fontWeight: 600 }}>Database (PostgreSQL)</span>
            </div>
            <div className="sa-health-detail">
              <span>Status</span>
              <span
                style={{
                  fontWeight: 600,
                  color:
                    health?.database.status === "healthy"
                      ? "var(--color-success)"
                      : health?.database.status === "degraded"
                      ? "var(--color-warning)"
                      : "var(--color-danger)",
                }}
              >
                {healthLabel(health?.database.status ?? "down")}
              </span>
            </div>
            <div className="sa-health-detail">
              <span>Latency</span>
              <span className="text-mono" style={{ fontWeight: 600 }}>
                {health?.database.latencyMs ?? "—"} ms
              </span>
            </div>
          </div>

          {/* API */}
          <div className="sa-health-card">
            <div className="sa-health-header">
              <span className={healthDot(health?.api.status ?? "down")} />
              <span style={{ fontWeight: 600 }}>API Layer (Next.js)</span>
            </div>
            <div className="sa-health-detail">
              <span>Status</span>
              <span
                style={{
                  fontWeight: 600,
                  color:
                    health?.api.status === "healthy"
                      ? "var(--color-success)"
                      : health?.api.status === "degraded"
                      ? "var(--color-warning)"
                      : "var(--color-danger)",
                }}
              >
                {healthLabel(health?.api.status ?? "down")}
              </span>
            </div>
            <div className="sa-health-detail">
              <span>Latency</span>
              <span className="text-mono" style={{ fontWeight: 600 }}>
                {health?.api.latencyMs ?? "—"} ms
              </span>
            </div>
          </div>

          {/* Timestamp */}
          <div className="sa-health-card">
            <div className="sa-health-header">
              <span style={{ fontSize: "1rem" }}>🕐</span>
              <span style={{ fontWeight: 600 }}>Last Check</span>
            </div>
            <div className="sa-health-detail">
              <span>Timestamp</span>
              <span className="text-mono" style={{ fontSize: "0.78rem" }}>
                {health?.timestamp
                  ? new Date(health.timestamp).toLocaleString("en-GB")
                  : "—"}
              </span>
            </div>
            <div className="sa-health-detail">
              <span>Auto-refresh</span>
              <span style={{ color: "var(--color-success)", fontWeight: 600 }}>
                Every 30s
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Confirmation Modal ── */}
      {confirmAction && (
        <div className="sa-modal-overlay">
          <div className="sa-modal">
            <h3 style={{ marginBottom: "0.75rem", fontSize: "1.1rem" }}>
              {confirmAction.action === "suspend"
                ? "⏸️ Suspend Brand?"
                : "▶️ Reactivate Brand?"}
            </h3>
            <p
              style={{
                color: "var(--color-text-muted)",
                fontSize: "0.88rem",
                marginBottom: "1.5rem",
                lineHeight: 1.6,
              }}
            >
              {confirmAction.action === "suspend" ? (
                <>
                  This will <strong>deactivate all users</strong> under{" "}
                  <strong>{confirmAction.brandName}</strong>. They won&apos;t be
                  able to log in until reactivated.
                </>
              ) : (
                <>
                  This will <strong>reactivate all users</strong> under{" "}
                  <strong>{confirmAction.brandName}</strong>.
                </>
              )}
            </p>
            <div
              style={{
                display: "flex",
                gap: "0.75rem",
                justifyContent: "flex-end",
              }}
            >
              <button
                className="btn btn-outline"
                onClick={() => setConfirmAction(null)}
              >
                Cancel
              </button>
              <button
                className="btn"
                style={{
                  background:
                    confirmAction.action === "suspend"
                      ? "var(--color-danger)"
                      : "var(--color-success)",
                  color: "white",
                }}
                onClick={() =>
                  handleSuspend(
                    confirmAction.brandId,
                    confirmAction.action === "suspend"
                  )
                }
              >
                {confirmAction.action === "suspend"
                  ? "Confirm Suspend"
                  : "Confirm Reactivate"}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
