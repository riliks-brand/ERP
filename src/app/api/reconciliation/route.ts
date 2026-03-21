/**
 * API: Shipping Reconciliation
 * POST /api/reconciliation — Upload a shipping provider file and run matching
 */

import { NextRequest, NextResponse } from "next/server";
import { parseShippingFile, PROVIDER_MAPPINGS } from "@/lib/parsers/shipping-parser";
import { reconcileShipment } from "@/lib/engines/reconciliation";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const tenantId = req.headers.get("x-tenant-id");
  if (!tenantId) return NextResponse.json({ error: "Missing tenant" }, { status: 400 });

  const reconciliations = await prisma.shippingReconciliation.findMany({
    where: { tenantId },
    include: { shippingProvider: true },
    orderBy: { uploadedAt: "desc" },
  });

  return NextResponse.json(reconciliations);
}

export async function POST(req: NextRequest) {
  const tenantId = req.headers.get("x-tenant-id");
  if (!tenantId) return NextResponse.json({ error: "Missing tenant" }, { status: 400 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const providerId = formData.get("shippingProviderId") as string | null;
  const providerCode = formData.get("providerCode") as string | null;

  if (!file || !providerId || !providerCode) {
    return NextResponse.json(
      { error: "Missing file, shippingProviderId, or providerCode" },
      { status: 400 }
    );
  }

  const mapping = PROVIDER_MAPPINGS[providerCode.toLowerCase()];
  if (!mapping) {
    return NextResponse.json(
      { error: `Unknown provider code: ${providerCode}. Supported: ${Object.keys(PROVIDER_MAPPINGS).join(", ")}` },
      { status: 400 }
    );
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const rows = parseShippingFile(buffer, mapping);
    const result = await reconcileShipment(tenantId, providerId, file.name, rows);
    return NextResponse.json(result, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Parsing error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
