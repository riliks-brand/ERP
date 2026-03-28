/**
 * Audit Logger
 * Records every financial data mutation as an immutable audit log entry.
 * Principle: No deletions — only reversals.
 */

import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import type { AuditAction } from "@prisma/client";

interface AuditPayload {
  brandId: string;
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
      brandId: payload.brandId,
      userId: payload.userId ?? null,
      tableName: payload.tableName,
      recordId: payload.recordId,
      action: payload.action,
      oldValues: payload.oldValues ? JSON.parse(JSON.stringify(payload.oldValues)) : Prisma.JsonNull,
      newValues: payload.newValues ? JSON.parse(JSON.stringify(payload.newValues)) : Prisma.JsonNull,
      ipAddress: payload.ipAddress ?? null,
    },
  });
}

/**
 * Wraps a data-modifying operation to automatically generate an audit log.
 */
export async function withAuditLog<T>(
  params: Omit<AuditPayload, "newValues">,
  operation: () => Promise<T>
): Promise<T> {
  const result = await operation();
  const newValues =
    result && typeof result === "object" ? (result as Record<string, unknown>) : null;

  await createAuditLog({
    ...params,
    newValues: newValues ?? undefined,
  });

  return result;
}

/**
 * Fetches audit logs for a specific brand with pagination and optional filters.
 */
export async function getAuditLogs(
  brandId: string,
  options: {
    page?: number;
    perPage?: number;
    tableName?: string;
    userId?: string;
  } = {}
) {
  const { page = 1, perPage = 50, tableName, userId } = options;

  const where = {
    brandId,
    ...(tableName && { tableName }),
    ...(userId && { userId }),
  };

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
      include: {
        user: {
          select: { fullName: true, email: true, role: true },
        },
      },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return {
    logs,
    total,
    totalPages: Math.ceil(total / perPage),
    currentPage: page,
  };
}

