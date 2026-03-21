"use client";

import DashboardLayout from "@/components/DashboardLayout";
import { useState } from "react";

interface ProductionOrder {
  id: string;
  orderNumber: string;
  product: string;
  vendor: string;
  status: string;
  qtyOrdered: number;
  qtyReceived: number;
  laborCost: number;
  efficiency: number | null;
  createdAt: string;
}

const STATUS_CONFIG: Record<string, { class: string; label: string }> = {
  DRAFT: { class: "badge-neutral", label: "Draft" },
  FABRIC_RESERVED: { class: "badge-info", label: "Fabric Reserved" },
  ISSUED_TO_FACTORY: { class: "badge-warning", label: "At Factory" },
  QC_PENDING: { class: "badge-warning", label: "QC Pending" },
  STOCKED: { class: "badge-success", label: "Stocked" },
  CANCELLED: { class: "badge-danger", label: "Cancelled" },
};

const DEMO_ORDERS: ProductionOrder[] = [
  { id: "1", orderNumber: "PO-2026-001", product: "Classic Hoodie", vendor: "Workshop A", status: "STOCKED", qtyOrdered: 200, qtyReceived: 195, laborCost: 50, efficiency: 88.5, createdAt: "2026-03-01" },
  { id: "2", orderNumber: "PO-2026-002", product: "Basic T-Shirt", vendor: "Workshop B", status: "ISSUED_TO_FACTORY", qtyOrdered: 500, qtyReceived: 0, laborCost: 25, efficiency: null, createdAt: "2026-03-10" },
  { id: "3", orderNumber: "PO-2026-003", product: "Classic Hoodie", vendor: "Workshop A", status: "QC_PENDING", qtyOrdered: 150, qtyReceived: 0, laborCost: 50, efficiency: null, createdAt: "2026-03-15" },
  { id: "4", orderNumber: "PO-2026-004", product: "Winter Bundle", vendor: "Workshop C", status: "DRAFT", qtyOrdered: 100, qtyReceived: 0, laborCost: 75, efficiency: null, createdAt: "2026-03-18" },
];

const WORKFLOW_STEPS = ["DRAFT", "FABRIC_RESERVED", "ISSUED_TO_FACTORY", "QC_PENDING", "STOCKED"];

function getStepIndex(status: string) {
  return WORKFLOW_STEPS.indexOf(status);
}

export default function ProductionPage() {
  const [selectedOrder, setSelectedOrder] = useState<ProductionOrder | null>(null);

  return (
    <DashboardLayout>
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h2>Production Orders</h2>
          <p>Track orders through the manufacturing pipeline</p>
        </div>
        <button className="btn btn-primary">+ New Production Order</button>
      </div>

      {/* Pipeline Summary */}
      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <h4 style={{ fontSize: "0.85rem", fontWeight: 600, marginBottom: "1rem", color: "var(--color-text-muted)" }}>
          PRODUCTION PIPELINE
        </h4>
        <div style={{ display: "flex", gap: "0.5rem", overflowX: "auto" }}>
          {WORKFLOW_STEPS.map((step, i) => {
            const count = DEMO_ORDERS.filter((o) => o.status === step).length;
            const config = STATUS_CONFIG[step];
            return (
              <div key={step} style={{
                flex: 1, minWidth: 140, padding: "0.75rem", borderRadius: 8,
                background: "var(--color-surface-elevated)", textAlign: "center",
                position: "relative",
              }}>
                {i < WORKFLOW_STEPS.length - 1 && (
                  <div style={{
                    position: "absolute", right: -14, top: "50%", transform: "translateY(-50%)",
                    fontSize: "1rem", color: "var(--color-text-muted)", zIndex: 1,
                  }}>→</div>
                )}
                <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>{count}</div>
                <div style={{ fontSize: "0.7rem", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {config.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Orders Table */}
      <div className="card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Order #</th>
              <th>Product</th>
              <th>Vendor</th>
              <th>Status</th>
              <th>Ordered</th>
              <th>Received</th>
              <th>Labor/Unit</th>
              <th>Efficiency</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {DEMO_ORDERS.map((order) => {
              const config = STATUS_CONFIG[order.status] || STATUS_CONFIG.DRAFT;
              return (
                <tr key={order.id}>
                  <td>
                    <code className="text-mono" style={{ fontSize: "0.8rem", fontWeight: 600 }}>{order.orderNumber}</code>
                  </td>
                  <td>{order.product}</td>
                  <td>{order.vendor}</td>
                  <td><span className={`badge ${config.class}`}>{config.label}</span></td>
                  <td className="text-mono">{order.qtyOrdered}</td>
                  <td className="text-mono">{order.qtyReceived || "—"}</td>
                  <td className="text-mono">EGP {order.laborCost}</td>
                  <td>
                    {order.efficiency !== null ? (
                      <span className={`text-mono ${order.efficiency >= 90 ? "text-success" : "text-danger"}`} style={{ fontWeight: 600 }}>
                        {order.efficiency}%
                      </span>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td>
                    <button
                      className="btn btn-outline"
                      style={{ padding: "0.3rem 0.6rem", fontSize: "0.75rem" }}
                      onClick={() => setSelectedOrder(order)}
                    >
                      View
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100,
        }} onClick={() => setSelectedOrder(null)}>
          <div className="card" style={{ width: "90%", maxWidth: 600 }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginBottom: "0.5rem", fontWeight: 700 }}>{selectedOrder.orderNumber}</h3>
            <p className="text-muted" style={{ fontSize: "0.85rem", marginBottom: "1.25rem" }}>
              {selectedOrder.product} — {selectedOrder.vendor}
            </p>

            {/* State Machine Visual */}
            <div style={{ marginBottom: "1.5rem" }}>
              <h4 style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "var(--color-text-muted)", marginBottom: "0.75rem" }}>
                Workflow Progress
              </h4>
              <div style={{ display: "flex", gap: "0.25rem" }}>
                {WORKFLOW_STEPS.map((step, i) => {
                  const currentIdx = getStepIndex(selectedOrder.status);
                  const isCompleted = i <= currentIdx;
                  const isCurrent = i === currentIdx;
                  return (
                    <div key={step} style={{
                      flex: 1, padding: "0.5rem 0.25rem", borderRadius: 6, textAlign: "center",
                      fontSize: "0.65rem", fontWeight: 600, textTransform: "uppercase",
                      background: isCurrent
                        ? "linear-gradient(135deg, var(--color-primary), var(--color-primary-light))"
                        : isCompleted
                        ? "rgba(0, 184, 148, 0.2)"
                        : "var(--color-surface-elevated)",
                      color: isCurrent ? "#fff" : isCompleted ? "var(--color-success)" : "var(--color-text-muted)",
                      border: isCurrent ? "none" : "1px solid var(--color-border)",
                    }}>
                      {STATUS_CONFIG[step].label}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Details Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1.25rem" }}>
              <div style={{ padding: "0.75rem", background: "var(--color-bg)", borderRadius: 8 }}>
                <div className="text-muted" style={{ fontSize: "0.7rem", marginBottom: "0.2rem" }}>Qty Ordered</div>
                <div className="text-mono" style={{ fontWeight: 700 }}>{selectedOrder.qtyOrdered}</div>
              </div>
              <div style={{ padding: "0.75rem", background: "var(--color-bg)", borderRadius: 8 }}>
                <div className="text-muted" style={{ fontSize: "0.7rem", marginBottom: "0.2rem" }}>Qty Received</div>
                <div className="text-mono" style={{ fontWeight: 700 }}>{selectedOrder.qtyReceived || "—"}</div>
              </div>
              <div style={{ padding: "0.75rem", background: "var(--color-bg)", borderRadius: 8 }}>
                <div className="text-muted" style={{ fontSize: "0.7rem", marginBottom: "0.2rem" }}>Labor Cost/Unit</div>
                <div className="text-mono" style={{ fontWeight: 700 }}>EGP {selectedOrder.laborCost}</div>
              </div>
              <div style={{ padding: "0.75rem", background: "var(--color-bg)", borderRadius: 8 }}>
                <div className="text-muted" style={{ fontSize: "0.7rem", marginBottom: "0.2rem" }}>Cutting Efficiency</div>
                <div className="text-mono" style={{
                  fontWeight: 700,
                  color: selectedOrder.efficiency !== null
                    ? selectedOrder.efficiency >= 90 ? "var(--color-success)" : "var(--color-danger)"
                    : undefined,
                }}>
                  {selectedOrder.efficiency !== null ? `${selectedOrder.efficiency}%` : "—"}
                </div>
              </div>
            </div>

            {selectedOrder.efficiency !== null && selectedOrder.efficiency < 90 && (
              <div style={{
                background: "rgba(225, 112, 85, 0.1)", border: "1px solid rgba(225, 112, 85, 0.3)",
                borderRadius: 8, padding: "0.75rem", marginBottom: "1rem", fontSize: "0.85rem",
              }}>
                ⚠️ <strong>Wastage Alert:</strong> Cutting efficiency is below 90%. Review the cutting process for this batch.
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
              <button className="btn btn-outline" onClick={() => setSelectedOrder(null)}>Close</button>
              {getStepIndex(selectedOrder.status) < WORKFLOW_STEPS.length - 1 && selectedOrder.status !== "CANCELLED" && (
                <button className="btn btn-primary">
                  Advance → {STATUS_CONFIG[WORKFLOW_STEPS[getStepIndex(selectedOrder.status) + 1]]?.label}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
