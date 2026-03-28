/**
 * GET /api/images/logo
 *
 * Secure image proxy for brand logos stored in a PRIVATE Supabase bucket.
 *
 * Flow:
 *   1. Validate auth cookie
 *   2. Lookup brand's logo fields from DB
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

// Force dynamic — uses auth cookies + DB, must never be statically rendered
export const dynamic = "force-dynamic";

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
          setAll: (list) => {
            try { list.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); } catch {}
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

    // ── 3. Fetch full brand (logoKey + logoUrl) ──
    const brand = await prisma.brand.findUnique({
      where: { id: dbUser.brandId },
    });

    if (!brand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    // ── 4. If no storage key, fall back to external logoUrl or 404 ──
    const logoKey = (brand as any).logoKey as string | null;
    const logoUrl = brand.logoUrl;

    if (!logoKey) {
      if (logoUrl) {
        return NextResponse.redirect(logoUrl, {
          status: 302,
          headers: { "Cache-Control": "public, max-age=3600" },
        });
      }
      return NextResponse.json({ error: "No logo set" }, { status: 404 });
    }

    // ── 5. Generate signed URL for private bucket ──
    const { data: signedData, error: signError } = await supabaseAdmin.storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(logoKey, SIGNED_URL_TTL);

    if (signError || !signedData?.signedUrl) {
      console.error("Signed URL error:", signError);
      return NextResponse.json({ error: "Could not generate image URL" }, { status: 500 });
    }

    // ── 6. Redirect with browser cache headers ──
    // 55 min < 60 min TTL — avoids serving an expired signed URL from cache
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
