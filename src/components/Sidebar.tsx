"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeToggle from "./ThemeToggle";

const NAV_SECTIONS = [
  {
    title: "Overview",
    items: [
      { href: "/", label: "Dashboard" },
    ],
  },
  {
    title: "Production",
    items: [
      { href: "/products", label: "Products & BOM" },
      { href: "/raw-materials", label: "Raw Materials" },
      { href: "/production", label: "Production Orders" },
      { href: "/vendors", label: "Vendors" },
    ],
  },
  {
    title: "Sales & Logistics",
    items: [
      { href: "/orders", label: "Sales Orders" },
      { href: "/reconciliation", label: "Reconciliation" },
      { href: "/returns", label: "Returns" },
      { href: "/pricing", label: "Smart Pricing" },
    ],
  },
  {
    title: "Finance",
    items: [
      { href: "/reports", label: "Reports" },
      { href: "/glossary", label: "Smart Glossary" },
      { href: "/settings", label: "Settings" },
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
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>

      <div style={{ padding: "0 1.5rem" }}>
        <ThemeToggle />
      </div>
    </aside>
  );
}
