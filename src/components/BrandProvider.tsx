"use client";

/**
 * BrandProvider — Global Brand Context
 *
 * Fetches brand data ONCE after login and shares it application-wide.
 * Any component can call `useBrand()` to access name, currency, logo, etc.
 * without triggering an additional network request.
 *
 * Logo display URL:
 *  - If brand has a private Supabase logo → routes through /api/images/logo
 *    (which generates a signed URL server-side with cache headers).
 *  - If brand has an external logoUrl → uses it directly.
 *  - Falls back to null (components show initials placeholder).
 */

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

export interface BrandData {
  id: string;
  name: string;
  currency: string;
  /** The display URL to use in <img> — may be a signed URL, external URL, or null */
  logoDisplayUrl: string | null;
  /** True if the logo comes from private Supabase storage (routed via /api/images/logo) */
  hasStorageLogo: boolean;
  commercialReg: string | null;
  taxId: string | null;
}

interface BrandContextValue {
  brand: BrandData | null;
  loading: boolean;
  /** Call after save to force a fresh fetch */
  refresh: () => void;
}

const BrandContext = createContext<BrandContextValue>({
  brand: null,
  loading: true,
  refresh: () => {},
});

export function BrandProvider({ children }: { children: ReactNode }) {
  const [brand, setBrand] = useState<BrandData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/settings");
        if (!res.ok || cancelled) return;
        const data = await res.json();

        if (!cancelled) {
          setBrand({
            id: data.id,
            name: data.name || "",
            currency: data.currency || "EGP",
            /** 
             * Logo display URL resolution:
             * - logoKey present → use our image proxy (which generates a signed URL)
             * - logoUrl present → external URL, use directly
             * - Neither → null
             */
            logoDisplayUrl: data.logoKey
              ? `/api/images/logo?t=${Math.floor(Date.now() / (55 * 60 * 1000))}` // cache-bust hourly
              : data.logoUrl || null,
            hasStorageLogo: !!data.logoKey,
            commercialReg: data.commercialReg || null,
            taxId: data.taxId || null,
          });
        }
      } catch {
        // Non-fatal: brand data won't load but app still works
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [tick]); // re-fetch when refresh() is called

  return (
    <BrandContext.Provider value={{ brand, loading, refresh }}>
      {children}
    </BrandContext.Provider>
  );
}

/** Access brand data from any client component */
export function useBrand() {
  return useContext(BrandContext);
}

/**
 * BrandLogoOrInitials — reusable logo display component
 * Shows logo if available, otherwise an initials avatar.
 */
export function BrandLogoOrInitials({
  size = 40,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  const { brand } = useBrand();

  const initials = brand?.name
    ? brand.name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase()
    : "?";

  if (brand?.logoDisplayUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={brand.logoDisplayUrl}
        alt={brand.name + " logo"}
        width={size}
        height={size}
        style={{
          width: size,
          height: size,
          objectFit: "contain",
          borderRadius: 8,
          background: "var(--color-surface-elevated)",
        }}
        className={className}
      />
    );
  }

  // Initials fallback
  return null;
}
