"use client";

import DashboardLayout from "@/components/DashboardLayout";
import { useState, useEffect } from "react";
import { GLOSSARY_DATA, CATEGORY_LABELS } from "@/lib/glossary-data";
import type { GlossaryEntry } from "@/lib/glossary-data";

const ALL_CATEGORIES = Object.keys(CATEGORY_LABELS);

export default function GlossaryPage() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [highlighted, setHighlighted] = useState<string | null>(null);

  // Deep linking: check URL hash on mount
  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (hash) {
      setHighlighted(hash);
      setTimeout(() => {
        document.getElementById(`term-${hash}`)?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 300);
    }
  }, []);

  const filtered = GLOSSARY_DATA.filter((entry) => {
    const matchesSearch =
      !search ||
      entry.termEn.toLowerCase().includes(search.toLowerCase()) ||
      entry.termAr.includes(search) ||
      entry.definitionEn.toLowerCase().includes(search.toLowerCase()) ||
      entry.definitionAr.includes(search);

    const matchesCategory =
      !activeCategory || entry.category === activeCategory;

    return matchesSearch && matchesCategory;
  });

  // Group by category
  const grouped = ALL_CATEGORIES.reduce<Record<string, GlossaryEntry[]>>(
    (acc, cat) => {
      const items = filtered.filter((e) => e.category === cat);
      if (items.length) acc[cat] = items;
      return acc;
    },
    {}
  );

  return (
    <DashboardLayout>
      <div className="page-header">
        <h2>📖 القاموس الذكي — Smart Glossary</h2>
        <p>All apparel finance &amp; operations terms explained in English &amp; Arabic</p>
      </div>

      {/* Search + Filter Bar */}
      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
          {/* Search */}
          <div style={{ flex: 1, minWidth: 250 }}>
            <input
              className="input"
              type="text"
              placeholder="🔍 Search in English or Arabic..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: "100%" }}
            />
          </div>

          {/* Category Filters */}
          <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
            <button
              className={`btn ${!activeCategory ? "btn-primary" : "btn-outline"}`}
              style={{ padding: "0.35rem 0.75rem", fontSize: "0.78rem" }}
              onClick={() => setActiveCategory(null)}
            >
              All ({GLOSSARY_DATA.length})
            </button>
            {ALL_CATEGORIES.map((cat) => {
              const info = CATEGORY_LABELS[cat];
              const count = GLOSSARY_DATA.filter((e) => e.category === cat).length;
              return (
                <button
                  key={cat}
                  className={`btn ${activeCategory === cat ? "btn-primary" : "btn-outline"}`}
                  style={{ padding: "0.35rem 0.75rem", fontSize: "0.78rem" }}
                  onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
                >
                  {info.icon} {info.ar} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {search && (
          <div style={{ marginTop: "0.75rem", fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
            Found <strong>{filtered.length}</strong> result{filtered.length !== 1 ? "s" : ""} for &ldquo;{search}&rdquo;
          </div>
        )}
      </div>

      {/* Terms List */}
      {Object.entries(grouped).map(([cat, entries]) => {
        const catInfo = CATEGORY_LABELS[cat];
        return (
          <div key={cat} style={{ marginBottom: "1.5rem" }}>
            <h3 style={{
              fontSize: "0.85rem",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: "var(--color-text-muted)",
              marginBottom: "0.75rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}>
              {catInfo.icon} {catInfo.en} — {catInfo.ar}
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {entries.map((entry) => (
                <div
                  key={entry.slug}
                  id={`term-${entry.slug}`}
                  className="card"
                  style={{
                    transition: "box-shadow 0.3s, border-color 0.3s",
                    borderLeft: highlighted === entry.slug
                      ? "3px solid var(--color-primary)"
                      : "3px solid transparent",
                    boxShadow: highlighted === entry.slug
                      ? "0 0 20px rgba(108, 92, 231, 0.2)"
                      : undefined,
                  }}
                >
                  {/* Header */}
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: "0.6rem",
                  }}>
                    <div>
                      <span style={{
                        fontWeight: 700,
                        fontSize: "1rem",
                        color: "var(--color-primary-light)",
                      }}>
                        {entry.termEn}
                      </span>
                      <span style={{
                        marginLeft: "0.75rem",
                        fontSize: "0.9rem",
                        color: "var(--color-text)",
                        direction: "rtl",
                      }}>
                        {entry.termAr}
                      </span>
                    </div>

                    {/* Copy Link */}
                    <button
                      className="btn btn-outline"
                      style={{ padding: "0.2rem 0.5rem", fontSize: "0.65rem" }}
                      onClick={() => {
                        const url = `${window.location.origin}/glossary#${entry.slug}`;
                        navigator.clipboard.writeText(url);
                        setHighlighted(entry.slug);
                        setTimeout(() => setHighlighted(null), 2000);
                      }}
                    >
                      🔗 Copy Link
                    </button>
                  </div>

                  {/* EN Definition */}
                  <p style={{
                    fontSize: "0.88rem",
                    lineHeight: 1.65,
                    color: "var(--color-text)",
                    marginBottom: "0.5rem",
                  }}>
                    {entry.definitionEn}
                  </p>

                  {/* AR Definition */}
                  <p style={{
                    fontSize: "0.88rem",
                    lineHeight: 1.7,
                    color: "var(--color-text-muted)",
                    direction: "rtl",
                    textAlign: "right",
                    padding: "0.6rem 0.75rem",
                    background: "var(--color-bg)",
                    borderRadius: 8,
                    marginBottom: "0.5rem",
                  }}>
                    {entry.definitionAr}
                  </p>

                  {/* Related Terms */}
                  {entry.relatedTerms.length > 0 && (
                    <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginTop: "0.25rem" }}>
                      <span className="text-muted" style={{ fontSize: "0.7rem" }}>Related:</span>
                      {entry.relatedTerms.map((slug) => {
                        const related = GLOSSARY_DATA.find((g) => g.slug === slug);
                        return (
                          <a
                            key={slug}
                            href={`#${slug}`}
                            className="badge badge-neutral"
                            style={{
                              fontSize: "0.65rem",
                              textDecoration: "none",
                              cursor: "pointer",
                            }}
                            onClick={(e) => {
                              e.preventDefault();
                              setHighlighted(slug);
                              window.location.hash = slug;
                              document.getElementById(`term-${slug}`)?.scrollIntoView({
                                behavior: "smooth",
                                block: "center",
                              });
                            }}
                          >
                            {related?.termEn || slug}
                          </a>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {filtered.length === 0 && (
        <div className="card" style={{ textAlign: "center", padding: "3rem" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>🔍</div>
          <h4 style={{ marginBottom: "0.5rem" }}>No terms found</h4>
          <p className="text-muted" style={{ fontSize: "0.85rem" }}>
            Try a different search term or clear the category filter.
          </p>
        </div>
      )}
    </DashboardLayout>
  );
}
