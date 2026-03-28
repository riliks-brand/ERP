import { PrismaClient, Prisma } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

// Pass DATABASE_URL explicitly if available (fixes Turbopack env loss),
// but fallback to undefined if missing (prevents Vercel build crash).
const options: Prisma.PrismaClientOptions | undefined = process.env.DATABASE_URL
  ? { datasources: { db: { url: process.env.DATABASE_URL } } }
  : undefined;

export const prisma = globalForPrisma.prisma || new PrismaClient(options);

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
