import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// ── Auth helper ───────────────────────────────────────────────────────────────
async function verifySuperAdmin() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
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
          } catch {}
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true },
  });

  const role = user.user_metadata?.role || dbUser?.role || "STAFF";
  if (role !== "SUPER_ADMIN") return null;

  return user;
}

// ── PATCH /api/super-admin/brand/[brandId] ────────────────────────────────────
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ brandId: string }> }
) {
  try {
    const user = await verifySuperAdmin();
    if (!user) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { brandId } = await params;
    const body = await request.json();

    // Verify the brand exists
    const brand = await prisma.brand.findUnique({
      where: { id: brandId },
    });

    if (!brand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    // ── Update Subscription Tier ──
    if (body.subscriptionTier) {
      const validTiers = ["FREE", "PRO", "ENTERPRISE"];
      if (!validTiers.includes(body.subscriptionTier)) {
        return NextResponse.json(
          { error: `Invalid tier. Must be one of: ${validTiers.join(", ")}` },
          { status: 400 }
        );
      }

      await prisma.brand.update({
        where: { id: brandId },
        data: { subscriptionTier: body.subscriptionTier },
      });
    }

    // ── Suspend / Reactivate Brand ──
    if (typeof body.suspend === "boolean") {
      // Toggle isActive on ALL users belonging to this brand
      await prisma.user.updateMany({
        where: { brandId },
        data: { isActive: !body.suspend },
      });
    }

    // Return updated brand info
    const updated = await prisma.brand.findUnique({
      where: { id: brandId },
      include: {
        _count: { select: { products: true, salesOrders: true, users: true } },
        users: { select: { isActive: true }, take: 1 },
      },
    });

    return NextResponse.json({
      ...updated,
      isSuspended: updated?.users?.[0]?.isActive === false,
    });
  } catch (err: any) {
    console.error("PATCH /api/super-admin/brand error:", err);
    return NextResponse.json(
      { error: err.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
