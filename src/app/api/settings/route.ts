import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createAuditLog } from "@/lib/audit";

// ── Supabase client helper (reused in both handlers) ──────────────────────────
async function makeSupabaseClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (list) => {
          try {
            list.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Readonly in Server Components — safely ignored
          }
        },
      },
    }
  );
}

// ── GET /api/settings ─────────────────────────────────────────────────────────
export async function GET() {
  try {
    const supabase = await makeSupabaseClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: `Unauthorized: ${authError?.message || "No user"}` },
        { status: 401 }
      );
    }

    // Step 1: get user's brandId
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { brandId: true, role: true },
    });

    // ── Auto-Provisioning for New Signups ──
    if (!dbUser) {
      const brandName = user.user_metadata?.brand_name || "My Brand";
      const fullName  = user.user_metadata?.full_name  || "Admin";

      const newBrand = await prisma.brand.create({
        data: {
          name: brandName,
          slug:
            brandName.toLowerCase().replace(/[^a-z0-9]+/g, "-") +
            "-" +
            Math.random().toString(36).substring(2, 6),
        },
      });

      await prisma.user.create({
        data: {
          id: user.id,
          email: user.email || `${user.id}@example.com`,
          passwordHash: "oauth-managed",
          fullName,
          role: "OWNER",
          brandId: newBrand.id,
        },
      });

      return NextResponse.json(newBrand);
    }

    if (!dbUser.brandId) {
      return NextResponse.json({ error: "No brand assigned" }, { status: 400 });
    }

    // Step 2: fetch the full brand (includes logoKey for signed URL routing)
    const brand = await prisma.brand.findUnique({
      where: { id: dbUser.brandId },
    });

    if (!brand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    return NextResponse.json(brand);
  } catch (err: any) {
    console.error("GET /api/settings error:", err);
    return NextResponse.json(
      { error: err.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

// ── PUT /api/settings ─────────────────────────────────────────────────────────
export async function PUT(request: Request) {
  try {
    const supabase = await makeSupabaseClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { brandId: true, role: true },
    });

    if (!dbUser?.brandId) {
      return NextResponse.json({ error: "No brand assigned" }, { status: 400 });
    }

    if (dbUser.role !== "OWNER" && dbUser.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Only BRAND OWNER can update settings" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, currency, logoUrl, commercialReg, taxId } = body;

    // Note: logoKey is managed exclusively by POST /api/upload/logo.
    // We never touch it here — prevents wiping an uploaded logo on save.

    const [oldBrand, updatedBrand] = await Promise.all([
      prisma.brand.findUnique({ where: { id: dbUser.brandId } }),
      prisma.brand.update({
        where: { id: dbUser.brandId },
        data: {
          name,
          currency,
          commercialReg,
          taxId,
          // Only set logoUrl when explicitly provided and non-empty
          ...(logoUrl !== undefined && { logoUrl: logoUrl || null }),
        },
      }),
    ]);

    // Audit trail
    await createAuditLog({
      action: "UPDATE",
      tableName: "Brand",
      recordId: dbUser.brandId,
      brandId: dbUser.brandId,
      userId: user.id,
      oldValues: oldBrand || undefined,
      newValues: updatedBrand || undefined,
    });

    return NextResponse.json(updatedBrand);
  } catch (err: any) {
    console.error("PUT /api/settings error:", err);
    return NextResponse.json(
      { error: err.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
