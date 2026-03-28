import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// ── Auth helper: verify caller is SUPER_ADMIN ─────────────────────────────────
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
          } catch {
            // Readonly — ignored
          }
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Check role from DB (authoritative) or fallback to user_metadata
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true },
  });

  const role = user.user_metadata?.role || dbUser?.role || "STAFF";
  if (role !== "SUPER_ADMIN") return null;

  return user;
}

// ── GET /api/super-admin ──────────────────────────────────────────────────────
export async function GET() {
  try {
    const user = await verifySuperAdmin();
    if (!user) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch all brands with counts
    const brands = await prisma.brand.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            products: true,
            salesOrders: true,
            users: true,
          },
        },
      },
    });

    // Calculate per-brand sales totals using aggregation
    const brandSales = await prisma.salesOrder.groupBy({
      by: ["brandId"],
      _sum: { totalAmount: true },
    });

    const salesMap = new Map(
      brandSales.map((s) => [s.brandId, Number(s._sum.totalAmount || 0)])
    );

    // Global metrics
    const [totalBrands, totalProducts, totalOrders] = await Promise.all([
      prisma.brand.count(),
      prisma.product.count(),
      prisma.salesOrder.count(),
    ]);

    const gmvResult = await prisma.salesOrder.aggregate({
      _sum: { totalAmount: true },
    });
    const totalGMV = Number(gmvResult._sum.totalAmount || 0);

    // Enrich brands with sales data
    const enrichedBrands = brands.map((b) => ({
      id: b.id,
      name: b.name,
      slug: b.slug,
      subscriptionTier: b.subscriptionTier,
      createdAt: b.createdAt,
      logoUrl: b.logoUrl,
      currency: b.currency,
      productCount: b._count.products,
      orderCount: b._count.salesOrders,
      userCount: b._count.users,
      totalSales: salesMap.get(b.id) || 0,
    }));

    return NextResponse.json({
      metrics: {
        totalBrands,
        totalGMV,
        totalProducts,
        totalOrders,
      },
      brands: enrichedBrands,
    });
  } catch (err: any) {
    console.error("GET /api/super-admin error:", err);
    return NextResponse.json(
      { error: err.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
