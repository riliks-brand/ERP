/**
 * POST /api/upload/logo
 *
 * Secure server-side logo upload.
 * - Validates auth via Supabase (anon key cookie check)
 * - Uses SERVICE_ROLE key to upload to private bucket
 * - Stores storage path (logoKey) in DB — NOT the full URL
 * - Deletes old logo file to prevent storage bloat
 * - Returns the freshly-generated signed URL for immediate preview
 */

import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { supabaseAdmin, STORAGE_BUCKET, SIGNED_URL_TTL } from "@/lib/supabase/admin";

// 5 MB max per upload
const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"];

export async function POST(request: Request) {
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

    // ── 2. Get brand ──
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { brandId: true, role: true, brand: { select: { logoKey: true } } },
    });

    if (!dbUser?.brandId) {
      return NextResponse.json({ error: "No brand assigned" }, { status: 400 });
    }
    if (dbUser.role !== "OWNER" && dbUser.role !== "SUPER_ADMIN" && dbUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    // ── 3. Parse multipart form ──
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type. Use JPEG, PNG, WebP, GIF or SVG." }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "File too large. Maximum 5 MB." }, { status: 400 });
    }

    // ── 4. Upload to private Supabase bucket ──
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const newKey = `logos/${dbUser.brandId}/${Date.now()}.${ext}`;
    const buffer = await file.arrayBuffer();

    const { error: uploadError } = await supabaseAdmin.storage
      .from(STORAGE_BUCKET)
      .upload(newKey, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return NextResponse.json({ error: "Upload failed: " + uploadError.message }, { status: 500 });
    }

    // ── 5. Delete old logo (avoid storage bloat) ──
    const oldKey = dbUser.brand?.logoKey;
    if (oldKey && oldKey !== newKey) {
      await supabaseAdmin.storage.from(STORAGE_BUCKET).remove([oldKey]);
      // Non-fatal — log but don't fail the request
    }

    // ── 6. Persist the storage path in DB ──
    await prisma.brand.update({
      where: { id: dbUser.brandId },
      data: { logoKey: newKey, logoUrl: null }, // clear any old external URL
    });

    // ── 7. Generate a signed URL for immediate client preview ──
    const { data: signedData, error: signError } = await supabaseAdmin.storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(newKey, SIGNED_URL_TTL);

    if (signError || !signedData?.signedUrl) {
      // Upload succeeded but signed URL failed — return key anyway
      return NextResponse.json({ logoKey: newKey, signedUrl: null });
    }

    return NextResponse.json({ logoKey: newKey, signedUrl: signedData.signedUrl });

  } catch (err: any) {
    console.error("POST /api/upload/logo error:", err);
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
  }
}
