import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createAuditLog } from "@/lib/audit";

export async function GET() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Readonly workaround
          }
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { brandId: true, role: true },
  });

  // ── Auto-Provisioning for New Signups ──
  if (!dbUser) {
    const brandName = user.user_metadata?.brand_name || "My Brand";
    const fullName = user.user_metadata?.full_name || "Admin";

    // 1. Create the Brand
    const newBrand = await prisma.brand.create({
      data: {
        name: brandName,
        slug: brandName.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + Math.random().toString(36).substring(2, 6),
      },
    });

    // 2. Create the User linked to the Brand
    dbUser = await prisma.user.create({
      data: {
        id: user.id,
        email: user.email!,
        passwordHash: "oauth-managed", 
        fullName: fullName,
        role: "OWNER",
        brandId: newBrand.id,
      },
      select: { brandId: true, role: true },
    });
  }

  if (!dbUser?.brandId) {
    return NextResponse.json({ error: "No brand assigned" }, { status: 400 });
  }

  const brand = await prisma.brand.findUnique({
    where: { id: dbUser.brandId },
  });

  return NextResponse.json(brand);
}

export async function PUT(request: Request) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
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

  const oldBrand = await prisma.brand.findUnique({
    where: { id: dbUser.brandId },
  });

  const updatedBrand = await prisma.brand.update({
    where: { id: dbUser.brandId },
    data: {
      name,
      currency,
      logoUrl,
      commercialReg,
      taxId,
    },
  });

  // Audit log
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
}
