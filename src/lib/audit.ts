/**
 * Audit Logger
 * Records every financial data mutation as an immutable audit log entry.
 * Principle: No deletions — only reversals.
 */

import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import type { AuditAction } from "@prisma/client";

interface AuditPayload {
  tenantId: string;
  userId?: string;
  tableName: string;
  recordId: string;
  action: AuditAction;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  ipAddress?: string;
}

export async function createAuditLog(payload: AuditPayload) {
  return prisma.auditLog.create({
    data: {
      tenantId: payload.tenantId,
      userId: payload.userId ?? null,
      tableName: payload.tableName,
      recordId: payload.recordId,
      action: payload.action,
      oldValues: (payload.oldValues as Prisma.InputJsonValue) ?? Prisma.JsonNull,
      newValues: (payload.newValues as Prisma.InputJsonValue) ?? Prisma.JsonNull,
      ipAddress: payload.ipAddress ?? null,
    },
  });
}
