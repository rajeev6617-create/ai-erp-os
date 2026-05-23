import type { AuditLog, Prisma, User } from "@/app/generated/prisma/client";
import {
  ROLE_AUDITOR,
  ROLE_CFO,
  ROLE_FINANCE_MANAGER,
  ROLE_MANAGER,
  ROLE_ORG_ADMIN,
  type SystemRoleSlug,
} from "@/lib/auth/constants";
import type { AuthContext } from "@/lib/auth/types";
import { hasAnyRole, hasPermission } from "@/lib/auth/rbac";
import { ForbiddenError, NotFoundError } from "@/lib/api/errors";
import { prisma } from "@/lib/db/prisma";
import {
  deviceLabelFromUserAgent,
  mapActivityLogToTimelineEvent,
  type ActivityLogWithUser,
} from "@/lib/workflows/mappers";
import type {
  ApprovalAiRecommendation,
  ApprovalAuditEntry,
  ApprovalAuditHistory,
  ApprovalAuditSummaryEntry,
} from "@/lib/workflows/types";

const auditViewerRoles = [
  ROLE_ORG_ADMIN,
  ROLE_MANAGER,
  ROLE_CFO,
  ROLE_FINANCE_MANAGER,
  ROLE_AUDITOR,
] satisfies SystemRoleSlug[];

const actorSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  displayName: true,
} as const;

type AuditLogWithUser = AuditLog & {
  user: Pick<User, "id" | "email" | "firstName" | "lastName" | "displayName"> | null;
};

export async function getApprovalAuditHistory(params: {
  approvalId: string;
  organizationId: string;
  auth: AuthContext;
}): Promise<ApprovalAuditHistory> {
  assertCanViewApprovalAudit(params.auth);

  const approval = await prisma.approval.findFirst({
    where: {
      id: params.approvalId,
      organizationId: params.organizationId,
    },
    select: {
      id: true,
      status: true,
      executionId: true,
      requesterId: true,
      title: true,
    },
  });

  if (!approval) {
    throw new NotFoundError("Approval not found", "APPROVAL_NOT_FOUND");
  }

  const [activityLogs, auditLogs, notifications] = await Promise.all([
    prisma.activityLog.findMany({
      where: {
        organizationId: params.organizationId,
        OR: [
          { entityType: "approval", entityId: approval.id },
          ...(approval.executionId
            ? [{ entityType: "workflow_execution", entityId: approval.executionId }]
            : []),
        ],
      },
      include: { user: { select: actorSelect } },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.auditLog.findMany({
      where: {
        organizationId: params.organizationId,
        resource: "approval",
        resourceId: approval.id,
      },
      include: { user: { select: actorSelect } },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.notification.findMany({
      where: {
        organizationId: params.organizationId,
        entityType: "approval",
        entityId: approval.id,
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  const timeline = (activityLogs as ActivityLogWithUser[]).map(mapActivityLogToTimelineEvent);
  const auditTrail = (auditLogs as AuditLogWithUser[]).map(mapAuditLogToEntry);

  return {
    approvalId: approval.id,
    workflowState: approval.status,
    generatedAt: new Date().toISOString(),
    timeline,
    auditTrail,
    notifications: notifications.map((notification) => ({
      id: notification.id,
      title: notification.title,
      body: notification.body,
      status: notification.status,
      userId: notification.userId,
      createdAt: notification.createdAt.toISOString(),
    })),
    aiRecommendations: buildAiRecommendationPlaceholders({
      approvalTitle: approval.title,
      workflowState: approval.status,
      auditTrail,
      timelineCount: timeline.length,
    }),
  };
}

export async function listApprovalAuditHistory(params: {
  organizationId: string;
  auth: AuthContext;
  limit?: number;
  approvalId?: string | null;
}): Promise<{ items: ApprovalAuditSummaryEntry[] }> {
  assertCanViewApprovalAudit(params.auth);

  const where: Prisma.AuditLogWhereInput = {
    organizationId: params.organizationId,
    resource: "approval",
    ...(params.approvalId ? { resourceId: params.approvalId } : {}),
  };

  const logs = await prisma.auditLog.findMany({
    where,
    include: { user: { select: actorSelect } },
    orderBy: { createdAt: "desc" },
    take: Math.min(Math.max(params.limit ?? 50, 1), 100),
  });

  const approvalIds = logs
    .map((log) => log.resourceId)
    .filter((resourceId): resourceId is string => Boolean(resourceId));
  const approvals = await prisma.approval.findMany({
    where: {
      organizationId: params.organizationId,
      id: { in: approvalIds },
    },
    select: { id: true, title: true },
  });
  const titleById = new Map(approvals.map((approval) => [approval.id, approval.title]));

  return {
    items: (logs as AuditLogWithUser[]).map((log) => ({
      ...mapAuditLogToEntry(log),
      approvalTitle: log.resourceId ? titleById.get(log.resourceId) ?? null : null,
    })),
  };
}

export function assertCanViewApprovalAudit(auth: AuthContext): void {
  if (auth.isSuperAdmin) return;
  if (hasPermission(auth.permissions, "audit", "read")) return;
  if (hasPermission(auth.permissions, "workflow", "read")) return;
  if (hasPermission(auth.permissions, "workflow", "manage")) return;
  if (hasAnyRole(auth.roles, auditViewerRoles)) return;

  throw new ForbiddenError("You are not allowed to view approval audit history", "AUDIT_FORBIDDEN");
}

function mapAuditLogToEntry(log: AuditLogWithUser): ApprovalAuditEntry {
  const metadata = asRecord(log.metadata);
  const after = asRecord(log.after);

  return {
    id: log.id,
    action: log.action,
    severity: log.severity,
    userId: log.userId,
    userName: log.user ? userDisplayName(log.user) : "System",
    resourceId: log.resourceId,
    createdAt: log.createdAt.toISOString(),
    workflowState: stringOrNull(after.status ?? metadata.workflowState ?? metadata.status),
    comment: stringOrNull(after.comment ?? metadata.comment ?? metadata.rejectionReason),
    ipAddress: log.ipAddress,
    device: deviceLabelFromUserAgent(log.userAgent),
    before: objectOrUndefined(log.before),
    after: objectOrUndefined(log.after),
    metadata: objectOrUndefined(log.metadata),
  };
}

function buildAiRecommendationPlaceholders(params: {
  approvalTitle: string;
  workflowState: string;
  auditTrail: ApprovalAuditEntry[];
  timelineCount: number;
}): ApprovalAiRecommendation[] {
  const latestAction = params.auditTrail[0]?.action ?? "No action recorded";

  return [
    {
      id: "approval-risk-placeholder",
      title: "AI risk summary pending",
      description: `Ready to summarize ${params.approvalTitle} once an AI policy engine is connected.`,
      severity: params.workflowState === "REJECTED" ? "high" : "medium",
      status: "placeholder",
    },
    {
      id: "approval-next-step-placeholder",
      title: "Recommended next step placeholder",
      description: `Latest audit event: ${latestAction}. Timeline contains ${params.timelineCount} tracked event(s).`,
      severity: "low",
      status: "placeholder",
    },
  ];
}

function userDisplayName(user: Pick<User, "email" | "firstName" | "lastName" | "displayName">) {
  return (
    user.displayName ??
    [user.firstName, user.lastName].filter(Boolean).join(" ").trim() ??
    user.email
  ) || user.email;
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return { ...(value as Record<string, unknown>) };
}

function objectOrUndefined(value: unknown): Record<string, unknown> | undefined {
  const record = asRecord(value);
  return Object.keys(record).length > 0 ? record : undefined;
}

function stringOrNull(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}
