"use client";

import DashboardLayout from "@/components/DashboardLayout";

interface SalesOrder {
  id: string;
  orderNumber: string;
  customer: string;
  status: string;
  total: number;
  cod: number;
  shipping: string;
  tracking: string;
  date: string;
}

const STATUS_MAP: Record<string, { class: string; label: string }> = {
  PENDING: { class: "badge-neutral", label: "Pending" },
  PROCESSING: { class: "badge-info", label: "Processing" },
  SHIPPED: { class: "badge-warning", label: "Shipped" },
  DELIVERED: { class: "badge-success", label: "Delivered" },
  COLLECTED: { class: "badge-success", label: "Collected" },
  RETURNED: { class: "badge-danger", label: "Returned" },
  CANCELLED: { class: "badge-danger", label: "Cancelled" },
};

const DEMO_ORDERS: SalesOrder[] = [
  { id: "1", orderNumber: "ORD-2026-0147", customer: "Ahmed M.", status: "DELIVERED", total: 450, cod: 450, shipping: "Bosta", tracking: "BST-88812345", date: "2026-03-18" },
  { id: "2", orderNumber: "ORD-2026-0148", customer: "Sara K.", status: "SHIPPED", total: 580, cod: 580, shipping: "J&T", tracking: "JNT-99923456", date: "2026-03-18" },
  { id: "3", orderNumber: "ORD-2026-0149", customer: "Mohamed H.", status: "RETURNED", total: 180, cod: 180, shipping: "Aramex", tracking: "ARX-44434567", date: "2026-03-17" },
  { id: "4", orderNumber: "ORD-2026-0150", customer: "Fatma A.", status: "PENDING", total: 920, cod: 920, shipping: "—", tracking: "—", date: "2026-03-19" },
  { id: "5", orderNumber: "ORD-2026-0151", customer: "Khaled R.", status: "COLLECTED", total: 360, cod: 360, shipping: "Bosta", tracking: "BST-88812399", date: "2026-03-15" },
  { id: "6", orderNumber: "ORD-2026-0152", customer: "Nour S.", status: "PROCESSING", total: 1050, cod: 1050, shipping: "J&T", tracking: "JNT-99923500", date: "2026-03-19" },
];

export default function OrdersPage() {
  return (
    <DashboardLayout>
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h2>Sales Orders</h2>
          <p>Track orders through the delivery &amp; collection lifecycle</p>
        </div>
        <button className="btn btn-primary">+ New Order</button>
      </div>

      {/* Pipeline KPIs */}
      <div className="card-grid" style={{ marginBottom: "1.5rem" }}>
        <div className="card">
          <div className="kpi">
            <span className="kpi-label">Total Orders</span>
            <span className="kpi-value">{DEMO_ORDERS.length}</span>
          </div>
        </div>
        <div className="card">
          <div className="kpi">
            <span className="kpi-label">Awaiting Collection</span>
            <span className="kpi-value text-warning">
              {DEMO_ORDERS.filter((o) => o.status === "DELIVERED").length}
            </span>
          </div>
        </div>
        <div className="card">
          <div className="kpi">
            <span className="kpi-label">Revenue (Collected)</span>
            <span className="kpi-value text-success">
              EGP {DEMO_ORDERS.filter((o) => o.status === "COLLECTED").reduce((s, o) => s + o.total, 0).toLocaleString()}
            </span>
          </div>
        </div>
        <div className="card">
          <div className="kpi">
            <span className="kpi-label">Returns</span>
            <span className="kpi-value text-danger">
              {DEMO_ORDERS.filter((o) => o.status === "RETURNED").length}
            </span>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Order #</th>
              <th>Customer</th>
              <th>Status</th>
              <th>Total</th>
              <th>COD</th>
              <th>Shipping</th>
              <th>Tracking</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {DEMO_ORDERS.map((order) => {
              const config = STATUS_MAP[order.status] || STATUS_MAP.PENDING;
              return (
                <tr key={order.id}>
                  <td><code className="text-mono" style={{ fontSize: "0.8rem", fontWeight: 600 }}>{order.orderNumber}</code></td>
                  <td>{order.customer}</td>
                  <td><span className={`badge ${config.class}`}>{config.label}</span></td>
                  <td className="text-mono" style={{ fontWeight: 600 }}>EGP {order.total}</td>
                  <td className="text-mono">EGP {order.cod}</td>
                  <td>{order.shipping}</td>
                  <td><code className="text-mono" style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>{order.tracking}</code></td>
                  <td className="text-muted" style={{ fontSize: "0.85rem" }}>{order.date}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}
