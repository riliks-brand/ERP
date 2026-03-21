"use client";

import DashboardLayout from "@/components/DashboardLayout";
import { useState } from "react";

// ---------------------------------------------------------------------------
// Demo audit data — in production, this will be fetched from Prisma via API.
// ---------------------------------------------------------------------------
interface AuditEntry {
  id: string;
  userName: string;
  userRole: string;
  action: "CREATE" | "UPDATE" | "REVERSE";
  tableName: string;
  recordId: string;
  oldValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
  createdAt: string;
}

const DEMO_AUDIT_LOGS: AuditEntry[] = [
  {
    id: "1",
    userName: "Ahmed Mohamed",
    userRole: "OWNER",
    action: "UPDATE",
    tableName: "raw_materials",
    recordId: "rm-001",
    oldValues: { avgCost: 185.5, totalQty: 200 },
    newValues: { avgCost: 192.75, totalQty: 350 },
    createdAt: "2026-03-21T03:45:00Z",
  },
  {
    id: "2",
    userName: "Sara Ali",
    userRole: "ACCOUNTANT",
    action: "CREATE",
    tableName: "vendor_ledger",
    recordId: "vl-045",
    oldValues: null,
    newValues: { vendorId: "v-003", type: "PAYMENT", amount: 15000 },
    createdAt: "2026-03-21T03:30:00Z",
  },
  {
    id: "3",
    userName: "Mohamed Hassan",
    userRole: "STAFF",
    action: "UPDATE",
    tableName: "sales_orders",
    recordId: "so-128",
    oldValues: { status: "PENDING" },
    newValues: { status: "SHIPPED" },
    createdAt: "2026-03-21T02:15:00Z",
  },
  {
    id: "4",
    userName: "Ahmed Mohamed",
    userRole: "OWNER",
    action: "UPDATE",
    tableName: "product_variants",
    recordId: "pv-012",
    oldValues: { sellingPrice: 450.0 },
    newValues: { sellingPrice: 499.0 },
    createdAt: "2026-03-21T01:00:00Z",
  },
  {
    id: "5",
    userName: "Sara Ali",
    userRole: "ACCOUNTANT",
    action: "REVERSE",
    tableName: "inventory_ledger",
    recordId: "il-089",
    oldValues: { qty: 50, type: "OUTBOUND" },
    newValues: { qty: 50, type: "REVERSAL" },
    createdAt: "2026-03-20T22:30:00Z",
  },
  {
    id: "6",
    userName: "Mohamed Hassan",
    userRole: "STAFF",
    action: "UPDATE",
    tableName: "production_orders",
    recordId: "po-007",
    oldValues: { status: "FABRIC_RESERVED" },
    newValues: { status: "ISSUED_TO_FACTORY" },
    createdAt: "2026-03-20T19:45:00Z",
  },
];

const ACTION_COLORS: Record<string, { bg: string; text: string }> = {
  CREATE: { bg: "#dcfce7", text: "#166534" },
  UPDATE: { bg: "#dbeafe", text: "#1e40af" },
  REVERSE: { bg: "#fef3c7", text: "#92400e" },
};

const ROLE_COLORS: Record<string, { bg: string; text: string }> = {
  OWNER: { bg: "#ede9fe", text: "#6d28d9" },
  ADMIN: { bg: "#dbeafe", text: "#1e40af" },
  ACCOUNTANT: { bg: "#fce7f3", text: "#9d174d" },
  STAFF: { bg: "#f3f4f6", text: "#374151" },
};

function formatTableName(name: string): string {
  return name
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function DiffViewer({ oldValues, newValues }: { oldValues: Record<string, unknown> | null; newValues: Record<string, unknown> | null }) {
  if (!oldValues && !newValues) return null;

  const allKeys = new Set([
    ...Object.keys(oldValues || {}),
    ...Object.keys(newValues || {}),
  ]);

  return (
    <div style={{ fontSize: "0.75rem", marginTop: "0.5rem" }}>
      {Array.from(allKeys).map((key) => {
        const oldVal = oldValues?.[key];
        const newVal = newValues?.[key];
        const changed = oldVal !== undefined && newVal !== undefined && oldVal !== newVal;

        return (
          <div
            key={key}
            style={{
              display: "flex",
              gap: "0.5rem",
              alignItems: "center",
              padding: "0.2rem 0",
              fontFamily: "monospace",
            }}
          >
            <span style={{ color: "var(--color-text-muted)", minWidth: 120 }}>
              {key}:
            </span>
            {oldVal !== undefined && (
              <span
                style={{
                  color: changed ? "#dc2626" : "var(--color-text-muted)",
                  textDecoration: changed ? "line-through" : "none",
                }}
              >
                {String(oldVal)}
              </span>
            )}
            {changed && (
              <span style={{ color: "var(--color-text-muted)" }}>&rarr;</span>
            )}
            {newVal !== undefined && (
              <span style={{ color: changed ? "#16a34a" : "var(--color-text)", fontWeight: changed ? 600 : 400 }}>
                {String(newVal)}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function AuditPage() {
  const [filter, setFilter] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredLogs =
    filter === "all"
      ? DEMO_AUDIT_LOGS
      : DEMO_AUDIT_LOGS.filter((log) => log.action === filter);

  return (
    <DashboardLayout>
      <div
        className="page-header"
        style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}
      >
        <div>
          <h2>Audit Trail</h2>
          <p>Immutable record of every system change — Who did what, and when</p>
        </div>
      </div>

      {/* Stats */}
      <div className="card-grid" style={{ marginBottom: "1.5rem" }}>
        <div className="card">
          <div className="kpi">
            <span className="kpi-label">Total Actions</span>
            <span className="kpi-value">{DEMO_AUDIT_LOGS.length}</span>
          </div>
        </div>
        <div className="card">
          <div className="kpi">
            <span className="kpi-label">Updates</span>
            <span className="kpi-value">
              {DEMO_AUDIT_LOGS.filter((l) => l.action === "UPDATE").length}
            </span>
          </div>
        </div>
        <div className="card">
          <div className="kpi">
            <span className="kpi-label">Reversals</span>
            <span className="kpi-value">
              {DEMO_AUDIT_LOGS.filter((l) => l.action === "REVERSE").length}
            </span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
        {["all", "CREATE", "UPDATE", "REVERSE"].map((f) => (
          <button
            key={f}
            className={`btn ${filter === f ? "btn-primary" : "btn-outline"}`}
            style={{ fontSize: "0.8rem", padding: "0.4rem 0.85rem" }}
            onClick={() => setFilter(f)}
          >
            {f === "all" ? "All" : f}
          </button>
        ))}
      </div>

      {/* Audit Log Table */}
      <div className="card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>User</th>
              <th>Role</th>
              <th>Action</th>
              <th>Table</th>
              <th>Record ID</th>
              <th style={{ width: 30 }}></th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.map((log) => (
              <tr
                key={log.id}
                onClick={() =>
                  setExpandedId(expandedId === log.id ? null : log.id)
                }
                style={{ cursor: "pointer" }}
              >
                <td style={{ fontSize: "0.8rem", whiteSpace: "nowrap" }}>
                  {formatDate(log.createdAt)}
                </td>
                <td style={{ fontWeight: 500 }}>{log.userName}</td>
                <td>
                  <span
                    style={{
                      padding: "0.15rem 0.5rem",
                      borderRadius: 4,
                      fontSize: "0.7rem",
                      fontWeight: 600,
                      background: ROLE_COLORS[log.userRole]?.bg || "#f3f4f6",
                      color: ROLE_COLORS[log.userRole]?.text || "#374151",
                    }}
                  >
                    {log.userRole}
                  </span>
                </td>
                <td>
                  <span
                    style={{
                      padding: "0.15rem 0.5rem",
                      borderRadius: 4,
                      fontSize: "0.7rem",
                      fontWeight: 600,
                      background: ACTION_COLORS[log.action]?.bg || "#f3f4f6",
                      color: ACTION_COLORS[log.action]?.text || "#374151",
                    }}
                  >
                    {log.action}
                  </span>
                </td>
                <td style={{ fontSize: "0.85rem" }}>
                  {formatTableName(log.tableName)}
                </td>
                <td>
                  <code
                    className="text-mono"
                    style={{ fontSize: "0.75rem", color: "var(--color-primary-light)" }}
                  >
                    {log.recordId}
                  </code>
                </td>
                <td style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                  {expandedId === log.id ? "▼" : "▶"}
                </td>
              </tr>
            ))}
            {/* Expanded Diff Row */}
            {filteredLogs.map(
              (log) =>
                expandedId === log.id && (
                  <tr key={`${log.id}-diff`}>
                    <td
                      colSpan={7}
                      style={{
                        background: "var(--color-surface-elevated, #f8f9fa)",
                        padding: "0.75rem 1.5rem",
                      }}
                    >
                      <strong style={{ fontSize: "0.8rem" }}>
                        Data Changes:
                      </strong>
                      <DiffViewer
                        oldValues={log.oldValues}
                        newValues={log.newValues}
                      />
                    </td>
                  </tr>
                )
            )}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}
