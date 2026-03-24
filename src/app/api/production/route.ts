/**
 * API: Production Orders
 * GET  /api/production          — List production orders
 * POST /api/production          — Create a new production order
 * PATCH /api/production         — Transition order status (State Machine)
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { transitionProductionOrder, recordWastage } from "@/lib/engines/production";
import { withAuditLog } from "@/lib/audit";
import { z } from "zod";

export async function GET(req: NextRequest) {
  const brandId = req.headers.get("x-brand-id");
  if (!brandId) return NextResponse.json({ error: "Missing brand" }, { status: 400 });

  const orders = await prisma.productionOrder.findMany({
    where: { brandId },
    include: { items: { include: { variant: true } }, vendor: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(orders);
}

const CreateSchema = z.object({
  orderNumber: z.string().min(1),
  vendorId: z.string().uuid().optional(),
  laborCostPerUnit: z.number().nonnegative().optional(),
  packagingCostPerUnit: z.number().nonnegative().optional(),
  items: z.array(
    z.object({
      variantId: z.string().uuid(),
      qtyOrdered: z.number().int().positive(),
    })
  ),
  notes: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const brandId = req.headers.get("x-brand-id");
  if (!brandId) return NextResponse.json({ error: "Missing brand" }, { status: 400 });

  const body = await req.json();
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const order = await prisma.productionOrder.create({
    data: {
      brandId,
      orderNumber: parsed.data.orderNumber,
      vendorId: parsed.data.vendorId,
      laborCostPerUnit: parsed.data.laborCostPerUnit,
      packagingCostPerUnit: parsed.data.packagingCostPerUnit,
      notes: parsed.data.notes,
      items: {
        create: parsed.data.items.map((it) => ({
          variantId: it.variantId,
          qtyOrdered: it.qtyOrdered,
        })),
      },
    },
    include: { items: true },
  });

  return NextResponse.json(order, { status: 201 });
}

const TransitionSchema = z.object({
  orderId: z.string().uuid(),
  targetStatus: z.enum([
    "DRAFT",
    "FABRIC_RESERVED",
    "ISSUED_TO_FACTORY",
    "QC_PENDING",
    "STOCKED",
    "CANCELLED",
  ]),
});

export async function PATCH(req: NextRequest) {
  const brandId = req.headers.get("x-brand-id");
  const userId = req.headers.get("x-user-id") ?? undefined;
  if (!brandId) return NextResponse.json({ error: "Missing brand" }, { status: 400 });

  const body = await req.json();
  const parsed = TransitionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  try {
    const oldOrder = await prisma.productionOrder.findUnique({
      where: { id: parsed.data.orderId },
      select: { status: true },
    });

    const updated = await withAuditLog(
      {
        brandId,
        userId: userId ?? undefined,
        tableName: "production_orders",
        recordId: parsed.data.orderId,
        action: "UPDATE",
        oldValues: oldOrder ? { status: oldOrder.status } : undefined,
      },
      () =>
        transitionProductionOrder(parsed.data.orderId, parsed.data.targetStatus, {
          brandId,
          userId: userId ?? undefined,
        })
    );

    return NextResponse.json(updated);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
