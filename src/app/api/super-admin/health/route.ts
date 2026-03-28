import { NextResponse } from "next/server";
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

// ── GET /api/super-admin/health ───────────────────────────────────────────────
export async function GET() {
  try {
    const user = await verifySuperAdmin();
    if (!user) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // ── Database Health Check ──
    let dbStatus: "healthy" | "degraded" | "down" = "down";
    let dbLatency = 0;

    try {
      const start = performance.now();
      await prisma.$queryRaw`SELECT 1`;
      dbLatency = Math.round(performance.now() - start);

      if (dbLatency < 200) {
        dbStatus = "healthy";
      } else if (dbLatency < 1000) {
        dbStatus = "degraded";
      } else {
        dbStatus = "down";
      }
    } catch {
      dbStatus = "down";
      dbLatency = -1;
    }

    // ── API Health (self-check round trip) ──
    let apiStatus: "healthy" | "degraded" | "down" = "healthy";
    let apiLatency = 0;

    try {
      const start = performance.now();
      // Simple internal check — we already responded, so this is a proxy test
      await prisma.brand.count();
      apiLatency = Math.round(performance.now() - start);

      if (apiLatency < 300) {
        apiStatus = "healthy";
      } else if (apiLatency < 1500) {
        apiStatus = "degraded";
      } else {
        apiStatus = "down";
      }
    } catch {
      apiStatus = "down";
      apiLatency = -1;
    }

    return NextResponse.json({
      database: { status: dbStatus, latencyMs: dbLatency },
      api: { status: apiStatus, latencyMs: apiLatency },
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("GET /api/super-admin/health error:", err);
    return NextResponse.json(
      { error: err.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
