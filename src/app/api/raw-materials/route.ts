/**
 * API: Raw Materials (AVCO Inventory)
 * GET  /api/raw-materials        — List all raw materials
 * POST /api/raw-materials        — Create a new raw material
 * POST /api/raw-materials/inbound — Record a purchase (updates AVCO)
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { recordInbound } from "@/lib/engines/avco";
import { z } from "zod";

// ── GET — List raw materials ──
export async function GET(req: NextRequest) {
  const tenantId = req.headers.get("x-tenant-id");
  if (!tenantId) return NextResponse.json({ error: "Missing tenant" }, { status: 400 });

  const materials = await prisma.rawMaterial.findMany({
    where: { tenantId, isActive: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(materials);
}

// ── POST — Create new raw material ──
const CreateSchema = z.object({
  name: z.string().min(1),
  sku: z.string().min(1),
  unit: z.enum(["METER", "KILOGRAM", "PIECE", "ROLL", "YARD"]),
  minStock: z.number().optional(),
  currency: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const tenantId = req.headers.get("x-tenant-id");
  if (!tenantId) return NextResponse.json({ error: "Missing tenant" }, { status: 400 });

  const body = await req.json();
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const material = await prisma.rawMaterial.create({
    data: { tenantId, ...parsed.data },
  });

  return NextResponse.json(material, { status: 201 });
}
