import { Prisma } from "@/app/generated/prisma/client";
import type {
  ActivityLog,
  ActivityType,
  ApprovalStatus,
  ExecutionStatus,
  User,
} from "@/app/generated/prisma/client";
import {
  ROLE_CFO,
  ROLE_FINANCE_MANAGER,
  ROLE_MANAGER,
  ROLE_ORG_ADMIN,
  type SystemRoleSlug,
} from "@/lib/auth/constants";
import { writeAuditLog } from "@/lib/auth/audit";
import { hasAnyRole, hasPermission } from "@/lib/auth/rbac";
import { ConflictError, ForbiddenError, NotFoundError } from "@/lib/api/errors";
import { prisma } from "@/lib/db/prisma";
import { mapActivityLogToTimelineEvent, toAssignee } from "@/lib/workflows/mappers";
import { dispatchWorkflowNotifications } from "@/lib/notifications/service";
import type { ApprovalActionResult, ApprovalActionType } from "@/lib/workflows/types";

const actionToStatus: Record<
  Exclude<ApprovalActionType, "request_clarification" | "escalate">,
  ApprovalStatus
> = {
  approve: "APPROVED",
  reject: "REJECTED",
};

const actionToActivityType: Record<ApprovalActionType, ActivityType> = {
  approve: "APPROVE",
  reject: "REJECT",
  escalate: "OTHER",
  request_clarification: "OTHER",
};

const workflowActionRoles = [
  ROLE_ORG_ADMIN,
  ROLE_MANAGER,
  ROLE_CFO,
  ROLE_FINANCE_MANAGER,
] satisfies SystemRoleSlug[];

const escalationRoles = [
  ROLE_CFO,
  ROLE_MANAGER,
  ROLE_ORG_ADMIN,
] satisfies SystemRoleSlug[];

const actorSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  displayName: true,
} as const;

type TimelineActivity = ActivityLog & {
  user: Pick<User, "id" | "email" | "firstName" | "lastName" | "displayName"> | null;
};

type EscalationTarget = {
  user: Pick<User, "id" | "email" | "firstName" | "lastName" | "displayName"> | null;
  userId: string | null;
  roleSlug: SystemRoleSlug;
};

export async function performApprovalAction(params: {
  approvalId: string;
  organizationId: string;
  userId: string;
  roles: SystemRoleSlug[];
  permissions: string[];
  isSuperAdmin: boolean;
  userDisplayName: string;
  action: ApprovalActionType;
  comment?: string;
  ipAddress?: string | null;
  userAgent?: string | null;
}): Promise<ApprovalActionResult> {
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      return await performApprovalActionOnce(params);
    } catch (error) {
      if (attempt === 3 || !isRetryableTransactionConflict(error)) {
        throw error;
      }
    }
  }

  throw new ConflictError("Unable to complete workflow action", "WORKFLOW_ACTION_CONFLICT");
}

async function performApprovalActionOnce(params: {
  approvalId: string;
  organizationId: string;
  userId: string;
  roles: SystemRoleSlug[];
  permissions: string[];
  isSuperAdmin: boolean;
  userDisplayName: string;
  action: ApprovalActionType;
  comment?: string;
  ipAddress?: string | null;
  userAgent?: string | null;
}): Promise<ApprovalActionResult> {
  return prisma.$transaction(
    async (tx) => {
      const approval = await tx.approval.findFirst({
        where: {
          id: params.approvalId,
          organizationId: params.organizationId,
        },
        include: {
          requester: { select: actorSelect },
          steps: { orderBy: { sequence: "asc" } },
          execution: true,
        },
      });

      if (!approval) {
        throw new NotFoundError("Approval not found", "APPROVAL_NOT_FOUND");
      }

      if (approval.status !== "PENDING") {
        throw new ConflictError("Approval is not pending", "APPROVAL_NOT_PENDING");
      }

      const step = approval.steps.find((s) => s.status === "PENDING");
      if (!step) {
        throw new ConflictError("Approval has no pending step", "APPROVAL_STEP_NOT_PENDING");
      }

      assertCanActOnApproval({
        action: params.action,
        userId: params.userId,
        roles: params.roles,
        permissions: params.permissions,
        isSuperAdmin: params.isSuperAdmin,
        assigneeId: step.assigneeId,
        assigneeRole: step.assigneeRole,
      });

      const now = new Date();
      const nowIso = now.toISOString();
      const approvalMetadata = asRecord(approval.metadata);
      const stepMetadata = asRecord(step.metadata);
      const escalationTarget =
        params.action === "escalate"
          ? await resolveEscalationTarget({
              tx,
              organizationId: params.organizationId,
              actorUserId: params.userId,
              currentAssigneeRole: step.assigneeRole,
              now,
            })
          : null;
      const actionStatus: ApprovalStatus =
        params.action === "request_clarification"
          ? "PENDING"
          : params.action === "escalate"
          ? "PENDING"
          : actionToStatus[params.action];
      const remainingPendingSteps = approval.steps.filter(
        (candidate) => candidate.id !== step.id && candidate.status === "PENDING",
      );
      const approvalStatus: ApprovalStatus =
        params.action === "escalate"
          ? "PENDING"
          : params.action === "approve" && remainingPendingSteps.length > 0
          ? "PENDING"
          : actionStatus;
      const executionStatus = resolveExecutionStatus(
        params.action,
        approvalStatus,
        approval.execution?.status ?? null,
      );

      const stepUpdate = await tx.approvalStep.updateMany({
        where: { id: step.id, status: "PENDING" },
        data:
          params.action === "request_clarification"
            ? {
                comment: params.comment ?? "Clarification requested",
                metadata: {
                  ...stepMetadata,
                  clarificationRequested: true,
                  clarificationRequestedAt: nowIso,
                  clarificationRequestedBy: params.userId,
                  clarificationComment: params.comment ?? null,
                },
              }
            : params.action === "escalate"
              ? {
                  assigneeId: escalationTarget?.userId ?? null,
                  assigneeRole: escalationTarget?.roleSlug ?? ROLE_ORG_ADMIN,
                  delegatedTo:
                    escalationTarget?.userId ??
                    escalationTarget?.roleSlug ??
                    ROLE_ORG_ADMIN,
                  comment: params.comment ?? "Escalated to senior approver",
                  metadata: {
                    ...stepMetadata,
                    action: params.action,
                    escalatedAt: nowIso,
                    escalatedBy: params.userId,
                    escalatedFromUserId: step.assigneeId,
                    escalatedFromRole: step.assigneeRole,
                    escalatedToUserId: escalationTarget?.userId ?? null,
                    escalatedToRole: escalationTarget?.roleSlug ?? ROLE_ORG_ADMIN,
                    escalationReason: params.comment ?? null,
                  },
                }
            : {
                status: actionStatus,
                assigneeId: step.assigneeId ?? params.userId,
                actedAt: now,
                comment:
                  params.action === "reject"
                    ? params.comment ?? "Approval rejected"
                    : params.comment ?? null,
                metadata: {
                  ...stepMetadata,
                  action: params.action,
                  actedAt: nowIso,
                  actedBy: params.userId,
                },
              },
      });

      if (stepUpdate.count !== 1) {
        throw new ConflictError("Approval step was already updated", "APPROVAL_STEP_CONFLICT");
      }

      const approvalUpdate = await tx.approval.updateMany({
        where: {
          id: approval.id,
          organizationId: params.organizationId,
          status: "PENDING",
        },
        data: {
          status: approvalStatus,
          completedAt: approvalStatus === "PENDING" ? null : now,
          metadata: {
            ...approvalMetadata,
            lastAction: params.action,
            lastActionAt: nowIso,
            lastActorId: params.userId,
            lastComment:
              params.action === "reject"
                ? params.comment ?? "Approval rejected"
                : params.comment ?? null,
            ...(params.action === "reject"
              ? { rejectionReason: params.comment ?? "Approval rejected" }
              : {}),
            ...(params.action === "escalate"
              ? {
                  escalatedToUserId: escalationTarget?.userId ?? null,
                  escalatedToRole: escalationTarget?.roleSlug ?? ROLE_ORG_ADMIN,
                  escalationReason: params.comment ?? null,
                }
              : {}),
            previousStatus: approval.status,
          },
        },
      });

      if (approvalUpdate.count !== 1) {
        throw new ConflictError("Approval was already updated", "APPROVAL_CONFLICT");
      }

      if (approval.executionId && executionStatus) {
        await tx.workflowExecution.update({
          where: { id: approval.executionId },
          data: {
            status: executionStatus,
            ...(params.action === "reject"
              ? {
                  error: {
                    reason: params.comment ?? "Approval rejected",
                    rejectedApprovalId: approval.id,
                  },
                  completedAt: now,
                }
              : {}),
            ...(params.action !== "reject" ? { completedAt: null } : {}),
          },
        });
      }

      const activityMetadata = {
        action: params.action,
        comment:
          params.action === "reject"
            ? params.comment ?? "Approval rejected"
            : params.comment ?? null,
        ipAddress: params.ipAddress ?? null,
        userAgent: params.userAgent ?? null,
        approvalId: approval.id,
        approvalTitle: approval.title,
        entityType: approval.entityType,
        entityId: approval.entityId,
        executionId: approval.executionId,
        workflowState: approvalStatus,
        status: approvalStatus,
        executionStatus,
        stepId: step.id,
        rejectionReason:
          params.action === "reject" ? params.comment ?? "Approval rejected" : null,
        escalatedToUserId: escalationTarget?.userId ?? null,
        escalatedToRole: escalationTarget?.roleSlug ?? null,
      };

      const timelineActivity = await tx.activityLog.create({
        data: {
          organizationId: params.organizationId,
          userId: params.userId,
          activityType: actionToActivityType[params.action],
          entityType: "approval",
          entityId: approval.id,
          description: describeTimelineAction(params.action, approval.title),
          metadata: activityMetadata,
        },
        include: { user: { select: actorSelect } },
      });

      if (approval.executionId) {
        await tx.activityLog.create({
          data: {
            organizationId: params.organizationId,
            userId: params.userId,
            activityType:
              params.action === "approve" && executionStatus === "RUNNING"
                ? "WORKFLOW_START"
                : actionToActivityType[params.action],
            entityType: "workflow_execution",
            entityId: approval.executionId,
            description: describeExecutionAction(params.action, executionStatus),
            metadata: activityMetadata,
          },
        });
      }

      await writeAuditLog(
        {
          organizationId: params.organizationId,
          userId: params.userId,
          action: `approval.${params.action}`,
          resource: "approval",
          resourceId: approval.id,
          severity:
            params.action === "reject" || params.action === "escalate"
              ? "WARNING"
              : "INFO",
          ipAddress: params.ipAddress,
          userAgent: params.userAgent,
          before: {
            status: approval.status,
            stepId: step.id,
            stepStatus: step.status,
            executionStatus: approval.execution?.status ?? null,
          },
          after: {
            status: approvalStatus,
            stepStatus: params.action === "request_clarification" ? "PENDING" : actionStatus,
            executionStatus,
            comment:
              params.action === "reject"
                ? params.comment ?? "Approval rejected"
                : params.comment ?? null,
            assignedApprover:
              escalationTarget?.userId ?? escalationTarget?.roleSlug ?? null,
          },
          metadata: activityMetadata,
          correlationId: approval.execution?.correlationId ?? approval.executionId ?? approval.id,
        },
        tx,
      );

      const recipientIds = await resolveNotificationRecipients({
        tx,
        organizationId: params.organizationId,
        actorUserId: params.userId,
        requesterId: approval.requesterId,
        action: params.action,
        now,
      });
      const notificationRecipients =
        recipientIds.length > 0
          ? await tx.user.findMany({
              where: { id: { in: recipientIds } },
              select: { id: true, email: true, phone: true },
            })
          : [];
      const notificationResult = await dispatchWorkflowNotifications(
        {
          organizationId: params.organizationId,
          actorUserId: params.userId,
          recipients: notificationRecipients.map((recipient) => ({
            userId: recipient.id,
            email: recipient.email,
            phone: recipient.phone,
          })),
          eventType: `approval.${params.action}`,
          title: notificationTitle(params.action, approval.title),
          body: notificationBody(params.action, params.userDisplayName, params.comment),
          actionUrl: `/dashboard/approvals?approval=${approval.id}`,
          entityType: "approval",
          entityId: approval.id,
          payload: {
            action: params.action,
            approvalId: approval.id,
            executionId: approval.executionId,
            actorUserId: params.userId,
          },
          ipAddress: params.ipAddress,
          userAgent: params.userAgent,
          correlationId: approval.execution?.correlationId ?? approval.executionId ?? approval.id,
        },
        tx,
      );

      const eventPayload = {
        ...activityMetadata,
        actorUserId: params.userId,
        actorName: params.userDisplayName,
        notificationRecipientIds: recipientIds,
        notificationResult: {
          inAppCount: notificationResult.inAppCount,
          emailCount: notificationResult.emailCount,
          whatsappPlaceholderCount: notificationResult.whatsappPlaceholderCount,
          scheduledReminderCount: notificationResult.scheduledReminderCount,
        },
        occurredAt: nowIso,
      };

      await tx.domainEvent.create({
        data: {
          organizationId: params.organizationId,
          aggregateType: "approval",
          aggregateId: approval.id,
          eventType: `approval.${params.action}`,
          payload: eventPayload,
          correlationId: approval.execution?.correlationId ?? approval.executionId ?? approval.id,
          causationId: params.userId,
        },
      });

      return {
        approvalId: approval.id,
        executionId: approval.executionId,
        action: params.action,
        status: approvalStatus,
        executionStatus,
        assignedApprover: escalationTarget
          ? toAssignee(
              escalationTarget.user,
              formatRoleLabel(escalationTarget.roleSlug),
            )
          : undefined,
        notificationCount: notificationResult.inAppCount,
        message: actionSuccessMessage(params.action),
        timelineEvent: mapActivityLogToTimelineEvent(timelineActivity as TimelineActivity),
      };
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
}

function assertCanActOnApproval(params: {
  action: ApprovalActionType;
  userId: string;
  roles: SystemRoleSlug[];
  permissions: string[];
  isSuperAdmin: boolean;
  assigneeId: string | null;
  assigneeRole: string | null;
}): void {
  if (params.isSuperAdmin) return;

  const assignedUser = params.assigneeId === params.userId;
  const assignedRole =
    params.assigneeRole !== null &&
    params.roles.includes(params.assigneeRole as SystemRoleSlug);
  const privilegedRole = hasAnyRole(params.roles, workflowActionRoles);
  const workflowApprover = hasPermission(params.permissions, "workflow", "approve");
  const workflowManager = hasPermission(params.permissions, "workflow", "manage");

  if (assignedUser || assignedRole || privilegedRole || workflowApprover || workflowManager) {
    return;
  }

  throw new ForbiddenError(
    `You are not allowed to ${params.action.replace("_", " ")} this approval`,
    "APPROVAL_ACTION_FORBIDDEN",
  );
}

function resolveExecutionStatus(
  action: ApprovalActionType,
  approvalStatus: ApprovalStatus,
  currentStatus: ExecutionStatus | null,
): ExecutionStatus | null {
  if (!currentStatus) return null;
  if (action === "reject") return "FAILED";
  if (action === "approve") {
    return approvalStatus === "APPROVED" ? "RUNNING" : "WAITING_APPROVAL";
  }
  return "WAITING_APPROVAL";
}

async function resolveEscalationTarget(params: {
  tx: Prisma.TransactionClient;
  organizationId: string;
  actorUserId: string;
  currentAssigneeRole: string | null;
  now: Date;
}): Promise<EscalationTarget> {
  const preferredRoles = escalationRoles.filter(
    (role) => role !== params.currentAssigneeRole,
  );
  const fallbackRole = preferredRoles[0] ?? ROLE_ORG_ADMIN;
  const assignments = await params.tx.userRole.findMany({
    where: {
      organizationId: params.organizationId,
      deletedAt: null,
      OR: [{ expiresAt: null }, { expiresAt: { gt: params.now } }],
      role: { slug: { in: preferredRoles.length ? preferredRoles : escalationRoles } },
    },
    include: {
      role: { select: { slug: true } },
      user: { select: actorSelect },
    },
    take: 100,
  });

  const orderedAssignments = [...assignments].sort(
    (a, b) =>
      escalationPriority(a.role.slug) - escalationPriority(b.role.slug),
  );
  const nonActorAssignment = orderedAssignments.find(
    (assignment) => assignment.userId !== params.actorUserId,
  );

  if (nonActorAssignment) {
    return {
      user: nonActorAssignment.user,
      userId: nonActorAssignment.userId,
      roleSlug: nonActorAssignment.role.slug as SystemRoleSlug,
    };
  }

  const sameActorAssignment = orderedAssignments[0];
  return {
    user: null,
    userId: null,
    roleSlug: sameActorAssignment
      ? (sameActorAssignment.role.slug as SystemRoleSlug)
      : fallbackRole,
  };
}

function escalationPriority(role: string): number {
  const index = (escalationRoles as readonly string[]).indexOf(role);
  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
}

async function resolveNotificationRecipients(params: {
  tx: Prisma.TransactionClient;
  organizationId: string;
  actorUserId: string;
  requesterId: string;
  action: ApprovalActionType;
  now: Date;
}): Promise<string[]> {
  const recipients = new Set<string>();

  if (params.requesterId !== params.actorUserId) {
    recipients.add(params.requesterId);
  }

  if (params.action === "escalate") {
    const escalatedTo = await params.tx.userRole.findMany({
      where: {
        organizationId: params.organizationId,
        deletedAt: null,
        OR: [{ expiresAt: null }, { expiresAt: { gt: params.now } }],
        role: { slug: { in: escalationRoles } },
      },
      select: { userId: true },
      take: 50,
    });

    for (const assignment of escalatedTo) {
      if (assignment.userId !== params.actorUserId) {
        recipients.add(assignment.userId);
      }
    }
  }

  return [...recipients];
}

function describeTimelineAction(action: ApprovalActionType, title: string): string {
  switch (action) {
    case "approve":
      return `Approved ${title}`;
    case "reject":
      return `Rejected ${title}`;
    case "escalate":
      return `Escalated ${title}`;
    case "request_clarification":
      return `Requested clarification for ${title}`;
  }
}

function describeExecutionAction(
  action: ApprovalActionType,
  executionStatus: ExecutionStatus | null,
): string {
  switch (action) {
    case "approve":
      return executionStatus === "RUNNING"
        ? "Workflow resumed after approval"
        : "Workflow approval step completed";
    case "reject":
      return "Workflow stopped after rejection";
    case "escalate":
      return "Workflow approval escalated";
    case "request_clarification":
      return "Workflow is waiting for clarification";
  }
}

function notificationTitle(action: ApprovalActionType, title: string): string {
  switch (action) {
    case "approve":
      return `Approved: ${title}`;
    case "reject":
      return `Rejected: ${title}`;
    case "escalate":
      return `Escalated: ${title}`;
    case "request_clarification":
      return `Clarification requested: ${title}`;
  }
}

function notificationBody(
  action: ApprovalActionType,
  actorName: string,
  comment?: string,
): string {
  const actionLabel = action.replace("_", " ");
  return [actorName, actionLabel, "this approval.", comment].filter(Boolean).join(" ");
}

function actionSuccessMessage(action: ApprovalActionType): string {
  switch (action) {
    case "approve":
      return "Approval approved";
    case "reject":
      return "Approval rejected";
    case "escalate":
      return "Approval escalated";
    case "request_clarification":
      return "Clarification requested";
  }
}

function formatRoleLabel(role: string): string {
  return role
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return { ...(value as Record<string, unknown>) };
}

function isRetryableTransactionConflict(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "P2034"
  );
}
