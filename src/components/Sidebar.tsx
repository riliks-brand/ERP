"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import ThemeToggle from "./ThemeToggle";
import { createClient } from "@/lib/supabase/client";
import { BrandLogoOrInitials, useBrand } from "@/components/BrandProvider";

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
      { href: "/audit", label: "Audit Trail" },
      { href: "/settings", label: "Settings" },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const { brand } = useBrand();
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.user_metadata?.role === "SUPER_ADMIN") {
        setIsSuperAdmin(true);
      }
    });
  }, [supabase]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="sidebar">
      {/* ── Brand Identity ── */}
      <div className="sidebar-logo">
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
          <BrandLogoOrInitials size={36} />
          <div style={{ overflow: "hidden" }}>
            <h1 style={{ fontSize: "0.95rem", fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", textTransform: "uppercase" }}>
              {brand?.name || "Fashion ERP"}
            </h1>
            <span style={{ fontSize: "0.65rem" }}>Financial &amp; Ops Engine</span>
          </div>
        </div>
      </div>

      <ul className="sidebar-nav">
        {isSuperAdmin && (
          <li>
            <span className="sidebar-section-title">Platform</span>
            <ul style={{ listStyle: "none", padding: 0 }}>
              <li>
                <Link
                  href="/super-admin"
                  className={pathname === "/super-admin" ? "active" : ""}
                  style={{ color: "var(--color-primary)", fontWeight: 700 }}
                >
                  🛡️ Super Admin
                </Link>
              </li>
            </ul>
          </li>
        )}

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

      <div style={{ padding: "0 1.5rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <ThemeToggle />
        <button
          onClick={handleLogout}
          className="btn btn-outline"
          style={{ width: "100%", fontSize: "0.8rem" }}
        >
          Logout
        </button>
      </div>
    </aside>
  );
}

