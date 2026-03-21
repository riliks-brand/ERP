"use client";

import DashboardLayout from "@/components/DashboardLayout";
import { useState } from "react";

interface Product {
  id: string;
  name: string;
  baseSku: string;
  category: string;
  isBundle: boolean;
  variants: Variant[];
}

interface Variant {
  id: string;
  sku: string;
  color: string;
  size: string;
  fit: string;
  sellingPrice: number;
  standardCost: number;
  stockQty: number;
}

// Demo data
const DEMO_PRODUCTS: Product[] = [
  {
    id: "1",
    name: "Classic Hoodie",
    baseSku: "HDY-001",
    category: "Outerwear",
    isBundle: false,
    variants: [
      { id: "v1", sku: "HDY-001-BLK-M", color: "Black", size: "M", fit: "Regular", sellingPrice: 450, standardCost: 185.5, stockQty: 42 },
      { id: "v2", sku: "HDY-001-BLK-L", color: "Black", size: "L", fit: "Regular", sellingPrice: 450, standardCost: 198.0, stockQty: 35 },
      { id: "v3", sku: "HDY-001-BLK-XL", color: "Black", size: "XL", fit: "Regular", sellingPrice: 470, standardCost: 215.0, stockQty: 18 },
      { id: "v4", sku: "HDY-001-GRY-M", color: "Grey", size: "M", fit: "Regular", sellingPrice: 450, standardCost: 185.5, stockQty: 28 },
    ],
  },
  {
    id: "2",
    name: "Basic T-Shirt",
    baseSku: "TSH-001",
    category: "Tops",
    isBundle: false,
    variants: [
      { id: "v5", sku: "TSH-001-WHT-S", color: "White", size: "S", fit: "Slim", sellingPrice: 180, standardCost: 62.0, stockQty: 120 },
      { id: "v6", sku: "TSH-001-WHT-M", color: "White", size: "M", fit: "Slim", sellingPrice: 180, standardCost: 68.0, stockQty: 95 },
      { id: "v7", sku: "TSH-001-BLK-M", color: "Black", size: "M", fit: "Slim", sellingPrice: 180, standardCost: 68.0, stockQty: 80 },
    ],
  },
  {
    id: "3",
    name: "Winter Bundle",
    baseSku: "BND-001",
    category: "Bundles",
    isBundle: true,
    variants: [
      { id: "v8", sku: "BND-001-SET", color: "Mixed", size: "M", fit: "—", sellingPrice: 580, standardCost: 253.5, stockQty: 15 },
    ],
  },
];

export default function ProductsPage() {
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  return (
    <DashboardLayout>
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h2>Products &amp; BOM</h2>
          <p>Manage product matrix, variants, and bill of materials</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + New Product
        </button>
      </div>

      {/* Stats */}
      <div className="card-grid" style={{ marginBottom: "1.5rem" }}>
        <div className="card">
          <div className="kpi">
            <span className="kpi-label">Total Products</span>
            <span className="kpi-value">{DEMO_PRODUCTS.length}</span>
          </div>
        </div>
        <div className="card">
          <div className="kpi">
            <span className="kpi-label">Total SKUs</span>
            <span className="kpi-value">{DEMO_PRODUCTS.reduce((s, p) => s + p.variants.length, 0)}</span>
          </div>
        </div>
        <div className="card">
          <div className="kpi">
            <span className="kpi-label">Bundles</span>
            <span className="kpi-value">{DEMO_PRODUCTS.filter((p) => p.isBundle).length}</span>
          </div>
        </div>
      </div>

      {/* Product List */}
      <div className="card">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: "30px" }}></th>
              <th>Product</th>
              <th>Base SKU</th>
              <th>Category</th>
              <th>Type</th>
              <th>Variants</th>
              <th>Total Stock</th>
            </tr>
          </thead>
          <tbody>
            {DEMO_PRODUCTS.map((product) => (
              <>
                <tr
                  key={product.id}
                  onClick={() => setExpandedProduct(expandedProduct === product.id ? null : product.id)}
                  style={{ cursor: "pointer" }}
                >
                  <td style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                    {expandedProduct === product.id ? "▼" : "▶"}
                  </td>
                  <td style={{ fontWeight: 600 }}>{product.name}</td>
                  <td><code className="text-mono" style={{ fontSize: "0.8rem" }}>{product.baseSku}</code></td>
                  <td>{product.category}</td>
                  <td>
                    <span className={`badge ${product.isBundle ? "badge-info" : "badge-neutral"}`}>
                      {product.isBundle ? "Bundle" : "Standard"}
                    </span>
                  </td>
                  <td>{product.variants.length}</td>
                  <td className="text-mono">{product.variants.reduce((s, v) => s + v.stockQty, 0)}</td>
                </tr>

                {/* Expanded Variant Rows */}
                {expandedProduct === product.id &&
                  product.variants.map((v) => (
                    <tr key={v.id} style={{ background: "var(--color-surface-elevated)" }}>
                      <td></td>
                      <td style={{ paddingLeft: "2rem" }}>
                        <code className="text-mono" style={{ fontSize: "0.8rem", color: "var(--color-primary-light)" }}>
                          {v.sku}
                        </code>
                      </td>
                      <td>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
                          <span style={{
                            width: 10, height: 10, borderRadius: "50%",
                            background: v.color === "Black" ? "#333" : v.color === "White" ? "#eee" : v.color === "Grey" ? "#888" : "var(--color-primary)",
                            border: "1px solid var(--color-border)",
                          }}></span>
                          {v.color}
                        </span>
                      </td>
                      <td>{v.size}</td>
                      <td>{v.fit}</td>
                      <td>
                        <div style={{ display: "flex", gap: "1.5rem", fontSize: "0.8rem" }}>
                          <span>Sell: <strong className="text-success">EGP {v.sellingPrice}</strong></span>
                          <span>Cost: <strong className="text-warning">EGP {v.standardCost}</strong></span>
                        </div>
                      </td>
                      <td className="text-mono">{v.stockQty}</td>
                    </tr>
                  ))}
              </>
            ))}
          </tbody>
        </table>
      </div>

      {/* New Product Modal */}
      {showModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100,
        }} onClick={() => setShowModal(false)}>
          <div className="card" style={{ width: "90%", maxWidth: 600, maxHeight: "80vh", overflow: "auto" }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginBottom: "1.25rem", fontSize: "1.1rem", fontWeight: 700 }}>Create New Product</h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label className="text-muted" style={{ fontSize: "0.75rem", display: "block", marginBottom: "0.3rem" }}>Product Name</label>
                <input className="input" placeholder="e.g. Classic Hoodie" />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div>
                  <label className="text-muted" style={{ fontSize: "0.75rem", display: "block", marginBottom: "0.3rem" }}>Base SKU</label>
                  <input className="input" placeholder="e.g. HDY-002" />
                </div>
                <div>
                  <label className="text-muted" style={{ fontSize: "0.75rem", display: "block", marginBottom: "0.3rem" }}>Category</label>
                  <input className="input" placeholder="e.g. Outerwear" />
                </div>
              </div>
              <div>
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", cursor: "pointer" }}>
                  <input type="checkbox" /> This is a Bundle (Virtual Bundling)
                </label>
              </div>

              <h4 style={{ fontSize: "0.9rem", fontWeight: 600, marginTop: "0.5rem", paddingTop: "0.75rem", borderTop: "1px solid var(--color-border)" }}>
                BOM — Bill of Materials
              </h4>
              <div style={{ background: "var(--color-bg)", borderRadius: 8, padding: "1rem", border: "1px dashed var(--color-border)" }}>
                <p className="text-muted" style={{ fontSize: "0.8rem", textAlign: "center" }}>
                  Drag raw materials here or click to add components
                </p>
                <button className="btn btn-outline" style={{ marginTop: "0.75rem", width: "100%" }}>
                  + Add BOM Component
                </button>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem" }}>
                <button className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button className="btn btn-primary">Save Product</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
