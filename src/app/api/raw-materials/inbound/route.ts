/**
 * API: Inbound Purchase (AVCO update)
 * POST /api/raw-materials/inbound — Record a purchase with optional landed cost
 */

import { NextRequest, NextResponse } from "next/server";
import { recordInbound } from "@/lib/engines/avco";
import { z } from "zod";

const InboundSchema = z.object({
  rawMaterialId: z.string().uuid(),
  qty: z.number().positive(),
  unitCost: z.number().nonnegative(),
  landedCost: z.number().nonnegative().optional(),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const tenantId = req.headers.get("x-tenant-id");
  const userId = req.headers.get("x-user-id") ?? undefined;
  if (!tenantId) return NextResponse.json({ error: "Missing tenant" }, { status: 400 });

  const body = await req.json();
  const parsed = InboundSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  try {
    const entry = await recordInbound({ ...parsed.data, tenantId, userId });
    return NextResponse.json(entry, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
