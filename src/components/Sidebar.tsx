"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_SECTIONS = [
  {
    title: "Overview",
    items: [
      { href: "/", icon: "📊", label: "Dashboard" },
    ],
  },
  {
    title: "Production",
    items: [
      { href: "/products", icon: "📦", label: "Products & BOM" },
      { href: "/raw-materials", icon: "🧵", label: "Raw Materials" },
      { href: "/production", icon: "🏭", label: "Production Orders" },
      { href: "/vendors", icon: "🤝", label: "Vendors" },
    ],
  },
  {
    title: "Sales & Logistics",
    items: [
      { href: "/orders", icon: "🛒", label: "Sales Orders" },
      { href: "/reconciliation", icon: "💳", label: "Reconciliation" },
      { href: "/returns", icon: "↩️", label: "Returns" },
      { href: "/pricing", icon: "✨", label: "Smart Pricing" },
    ],
  },
  {
    title: "Finance",
    items: [
      { href: "/reports", icon: "📈", label: "Reports" },
      { href: "/glossary", icon: "📖", label: "Smart Glossary" },
      { href: "/settings", icon: "⚙️", label: "Settings" },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <h1>Fashion ERP</h1>
        <span>Financial &amp; Ops Engine</span>
      </div>

      <ul className="sidebar-nav">
        {NAV_SECTIONS.map((section) => (
          <li key={section.title}>
            <span className="sidebar-section-title">{section.title}</span>
            <ul style={{ listStyle: "none", padding: 0 }}>
              {section.items.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={pathname === item.href ? "active" : ""}
                  >
                    {item.icon} {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </aside>
  );
}
