import type {
  AuditSeverity,
  Prisma,
  PrismaClient,
} from "@/app/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";

export interface AuditParams {
  organizationId: string;
  userId?: string | null;
  action: string;
  resource: string;
  resourceId?: string | null;
  severity?: AuditSeverity;
  ipAddress?: string | null;
  userAgent?: string | null;
  before?: unknown;
  after?: unknown;
  metadata?: Record<string, unknown>;
  correlationId?: string;
}

type AuditDb = PrismaClient | Prisma.TransactionClient;

export async function writeAuditLog(
  params: AuditParams,
  db: AuditDb = prisma,
): Promise<void> {
  await db.auditLog.create({
    data: {
      organizationId: params.organizationId,
      userId: params.userId ?? null,
      action: params.action,
      resource: params.resource,
      resourceId: params.resourceId ?? null,
      severity: params.severity ?? "INFO",
      ipAddress: params.ipAddress ?? null,
      userAgent: params.userAgent ?? null,
      before: params.before ? (params.before as object) : undefined,
      after: params.after ? (params.after as object) : undefined,
      metadata: params.metadata ? (params.metadata as object) : undefined,
      correlationId: params.correlationId ?? null,
    },
  });
}
