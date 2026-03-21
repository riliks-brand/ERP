"use client";

import { useState, useRef, useEffect } from "react";
import { GLOSSARY_MAP } from "@/lib/glossary-data";

interface TooltipProps {
  term: string; // slug from glossary
  children: React.ReactNode;
}

/**
 * GlossaryTooltip — wrap any element to show a bilingual definition on hover.
 *
 * Usage:
 *   <GlossaryTooltip term="cogs">
 *     <span>COGS</span>
 *   </GlossaryTooltip>
 */
export default function GlossaryTooltip({ term, children }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  const entry = GLOSSARY_MAP.get(term);

  // Close on click outside
  useEffect(() => {
    if (!visible) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setVisible(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [visible]);

  if (!entry) return <>{children}</>;

  return (
    <span
      ref={ref}
      className="glossary-tooltip-wrapper"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      style={{ position: "relative", cursor: "help" }}
    >
      <span style={{
        borderBottom: "1px dashed var(--color-primary)",
        paddingBottom: 1,
        color: visible ? "var(--color-primary)" : "inherit",
        transition: "color 0.2s"
      }}>
        {children}
      </span>

      {visible && (
        <div
          className="glossary-tooltip"
          style={{
            position: "absolute",
            bottom: "calc(100% + 8px)",
            left: "50%",
            transform: "translateX(-50%)",
            width: 320,
            padding: "0.85rem 1rem",
            background: "var(--color-primary)",
            border: "none",
            borderRadius: 10,
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
            zIndex: 200,
            animation: "tooltipFadeIn 0.2s ease-out",
          }}
        >
          {/* Arrow */}
          <div style={{
            position: "absolute",
            bottom: -6,
            left: "50%",
            transform: "translateX(-50%) rotate(45deg)",
            width: 12,
            height: 12,
            background: "var(--color-primary)",
            borderRight: "none",
            borderBottom: "none",
          }} />

          {/* Header */}
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: "0.5rem",
          }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "white" }}>
                {entry.termEn}
              </div>
              <div style={{ fontSize: "0.75rem", color: "rgba(255, 255, 255, 0.8)", direction: "rtl" }}>
                {entry.termAr}
              </div>
            </div>
            <span style={{ 
              fontSize: "0.6rem", 
              padding: "0.2rem 0.5rem", 
              background: "rgba(255, 255, 255, 0.2)", 
              borderRadius: "100px",
              color: "white",
              fontWeight: 600,
              textTransform: "uppercase"
            }}>
              {entry.category}
            </span>
          </div>

          {/* EN Definition */}
          <p style={{ fontSize: "0.78rem", lineHeight: 1.5, marginBottom: "0.4rem", color: "white" }}>
            {entry.definitionEn}
          </p>

          {/* AR Definition */}
          <p style={{
            fontSize: "0.78rem",
            lineHeight: 1.6,
            color: "rgba(255, 255, 255, 0.9)",
            direction: "rtl",
            textAlign: "right",
            borderTop: "1px dashed rgba(255, 255, 255, 0.3)",
            paddingTop: "0.4rem",
            marginBottom: 0,
          }}>
            {entry.definitionAr}
          </p>

          {/* Deep link */}
          <a
            href={`/glossary#${entry.slug}`}
            style={{
              display: "block",
              marginTop: "0.5rem",
              fontSize: "0.7rem",
              color: "white",
              textDecoration: "underline",
            }}
          >
            📖 View in glossary →
          </a>
        </div>
      )}
    </span>
  );
}
