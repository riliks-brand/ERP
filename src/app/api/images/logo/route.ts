/**
 * GET /api/images/logo
 *
 * Secure image proxy for brand logos stored in a PRIVATE Supabase bucket.
 *
 * Flow:
 *   1. Validate auth cookie
 *   2. Lookup brand's logoKey from DB (cached 60s)
 *   3. Generate a short-lived signed URL via Service Role key
 *   4. 302 Redirect with Cache-Control: private, max-age=3300
 *      (browser caches for ~55 min; signed URL valid for 60 min)
 *
 * Result: Supabase egress only happens when browser cache expires,
 *         NOT on every page visit or component render.
 */

import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { supabaseAdmin, STORAGE_BUCKET, SIGNED_URL_TTL } from "@/lib/supabase/admin";
import { unstable_cache } from "next/cache";

/** Cache the logoKey lookup — brand logos don't change often. */
const getLogoKey = unstable_cache(
  async (brandId: string) => {
    const brand = await prisma.brand.findUnique({
      where: { id: brandId },
      select: { logoKey: true, logoUrl: true },
    });
    return brand;
  },
  ["logo-key"],
  { revalidate: 60, tags: ["settings"] }
);

export async function GET() {
  try {
    // ── 1. Auth ──
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (cookiesToSet) => {
            try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); } catch {}
          },
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ── 2. Get brandId ──
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { brandId: true },
    });

    if (!dbUser?.brandId) {
      return NextResponse.json({ error: "No brand" }, { status: 400 });
    }

    // ── 3. Look up brand logo ──
    const brand = await getLogoKey(dbUser.brandId);

    if (!brand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    // ── 4. If no storage key, return logoUrl (external) or 404 ──
    if (!brand.logoKey) {
      if (brand.logoUrl) {
        // External URL — redirect directly (no signed URL needed)
        return NextResponse.redirect(brand.logoUrl, {
          status: 302,
          headers: { "Cache-Control": "public, max-age=3600" },
        });
      }
      return NextResponse.json({ error: "No logo set" }, { status: 404 });
    }

    // ── 5. Generate signed URL for private bucket ──
    const { data: signedData, error: signError } = await supabaseAdmin.storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(brand.logoKey, SIGNED_URL_TTL);

    if (signError || !signedData?.signedUrl) {
      console.error("Signed URL error:", signError);
      return NextResponse.json({ error: "Could not generate image URL" }, { status: 500 });
    }

    // ── 6. Redirect to signed URL with browser cache headers ──
    // Cache for 55 min (< 60 min TTL of signed URL, to prevent edge expiry)
    return NextResponse.redirect(signedData.signedUrl, {
      status: 302,
      headers: {
        "Cache-Control": "private, max-age=3300, stale-while-revalidate=60",
      },
    });

  } catch (err: any) {
    console.error("GET /api/images/logo error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
