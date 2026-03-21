/**
 * API: Returns
 * POST /api/returns — Process a return and calculate financial loss
 */

import { NextRequest, NextResponse } from "next/server";
import { processReturn } from "@/lib/engines/returns";
import { z } from "zod";

const ReturnSchema = z.object({
  salesOrderId: z.string().uuid(),
  reason: z.string().optional(),
  isProductIntact: z.boolean(),
  forwardShipping: z.number().nonnegative(),
  returnShipping: z.number().nonnegative(),
  refurbishmentCost: z.number().nonnegative().optional(),
});

export async function POST(req: NextRequest) {
  const tenantId = req.headers.get("x-tenant-id");
  const userId = req.headers.get("x-user-id") ?? undefined;
  if (!tenantId) return NextResponse.json({ error: "Missing tenant" }, { status: 400 });

  const body = await req.json();
  const parsed = ReturnSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  try {
    const record = await processReturn({ ...parsed.data, tenantId, userId });
    return NextResponse.json(record, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
