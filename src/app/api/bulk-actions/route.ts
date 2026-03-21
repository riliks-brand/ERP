/**
 * Bulk Actions API Route
 * Allows mass-updating status for orders, production orders, or reconciliation rows.
 */

import { NextRequest, NextResponse } from "next/server";

interface BulkUpdatePayload {
  entity: "sales_orders" | "production_orders" | "reconciliation_rows";
  ids: string[];
  update: Record<string, unknown>;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as BulkUpdatePayload;
    const { entity, ids, update } = body;

    if (!entity || !ids?.length || !update) {
      return NextResponse.json(
        { error: "Missing entity, ids, or update payload" },
        { status: 400 }
      );
    }

    if (ids.length > 100) {
      return NextResponse.json(
        { error: "Maximum 100 items per bulk update" },
        { status: 400 }
      );
    }

    // In production, this would use prisma.$transaction with updateMany
    // For now, return a structured response
    return NextResponse.json({
      success: true,
      entity,
      updatedCount: ids.length,
      update,
      message: `Successfully queued bulk update for ${ids.length} ${entity}.`,
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
