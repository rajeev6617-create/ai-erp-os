import type {
  ActivityLog,
  Approval,
  ApprovalStep,
  User,
  Workflow,
  WorkflowExecution,
} from "@/app/generated/prisma/client";
import type {
  AssigneeInfo,
  WorkflowCardData,
  WorkflowTimelineEvent,
} from "@/lib/workflows/types";

type UserIdentity = Pick<User, "id" | "email" | "firstName" | "lastName" | "displayName">;

type ApprovalWithRelations = Approval & {
  requester: UserIdentity;
  execution: (WorkflowExecution & { workflow: Workflow }) | null;
  steps: (ApprovalStep & {
    assignee: UserIdentity | null;
  })[];
};

export type ActivityLogWithUser = ActivityLog & {
  user: UserIdentity | null;
};

export function toAssignee(
  user: UserIdentity | null,
  fallback = "Unassigned",
): AssigneeInfo {
  if (!user) {
    return { id: null, name: fallback, email: null, initials: "NA" };
  }
  const name =
    user.displayName ??
    ([user.firstName, user.lastName].filter(Boolean).join(" ") || user.email);
  const parts = name.split(" ").filter(Boolean);
  const initials =
    parts.length >= 2
      ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
      : name.slice(0, 2).toUpperCase();
  return { id: user.id, name, email: user.email, initials };
}

export function priorityFromScore(score: number): WorkflowCardData["priority"] {
  if (score >= 80) return "critical";
  if (score >= 60) return "high";
  if (score >= 35) return "medium";
  return "low";
}

export function mapApprovalToCard(
  approval: ApprovalWithRelations,
  timeline: WorkflowTimelineEvent[] = [],
): WorkflowCardData {
  const meta = asRecord(approval.metadata);
  const priorityScore = Number(meta.priorityScore ?? approval.execution?.priority ?? 50);
  const pendingStep = approval.steps.find((s) => s.status === "PENDING");
  const assigneeFallback = pendingStep?.assigneeRole
    ? formatRoleLabel(pendingStep.assigneeRole)
    : "Unassigned";

  return {
    id: approval.executionId ?? approval.id,
    approvalId: approval.id,
    title: approval.title,
    description: approval.description,
    workflowName: approval.execution?.workflow.name ?? "Manual approval",
    executionId: approval.executionId,
    status: approval.status,
    statusLabel: formatStatus(approval.status),
    priority: priorityFromScore(priorityScore),
    priorityScore,
    assignee: toAssignee(pendingStep?.assignee ?? null, assigneeFallback),
    requester: toAssignee(approval.requester),
    entityType: approval.entityType,
    dueAt: approval.dueAt?.toISOString() ?? null,
    createdAt: approval.createdAt.toISOString(),
    updatedAt: approval.updatedAt.toISOString(),
    metadata: meta,
    timeline,
  };
}

export function mapExecutionToCard(
  execution: WorkflowExecution & {
    workflow: Workflow;
    approvals: ApprovalWithRelations[];
  },
  timeline: WorkflowTimelineEvent[] = [],
): WorkflowCardData {
  const meta = asRecord(execution.context);
  const priorityScore = execution.priority || 50;
  const linkedApproval = execution.approvals[0];

  return {
    id: execution.id,
    approvalId: linkedApproval?.id,
    title: linkedApproval?.title ?? execution.workflow.name,
    description: linkedApproval?.description ?? execution.workflow.description,
    workflowName: execution.workflow.name,
    executionId: execution.id,
    status: execution.status,
    statusLabel: formatStatus(execution.status),
    priority: priorityFromScore(priorityScore),
    priorityScore,
    assignee: linkedApproval
      ? toAssignee(
          linkedApproval.steps.find((s) => s.status === "PENDING")?.assignee ?? null,
          formatExecutionAssigneeFallback(linkedApproval),
        )
      : { id: null, name: "System", email: null, initials: "SY" },
    requester: linkedApproval
      ? toAssignee(linkedApproval.requester)
      : { id: null, name: "Automated", email: null, initials: "AU" },
    entityType: linkedApproval?.entityType ?? "workflow_execution",
    dueAt: linkedApproval?.dueAt?.toISOString() ?? null,
    createdAt: execution.createdAt.toISOString(),
    updatedAt: execution.updatedAt.toISOString(),
    metadata: meta,
    timeline,
  };
}

export function mapActivityLogToTimelineEvent(
  log: ActivityLogWithUser,
): WorkflowTimelineEvent {
  const metadata = asRecord(log.metadata);
  const action =
    typeof metadata.action === "string" ? metadata.action : log.activityType.toLowerCase();

  return {
    id: log.id,
    activityType: log.activityType,
    label: formatTimelineLabel(action, log.activityType),
    description: log.description,
    actorId: log.userId,
    actorName: log.user ? toAssignee(log.user).name : "System",
    createdAt: log.createdAt.toISOString(),
    workflowState: stringOrNull(metadata.workflowState ?? metadata.status),
    comment: stringOrNull(metadata.comment ?? metadata.rejectionReason ?? metadata.escalationReason),
    ipAddress: stringOrNull(metadata.ipAddress),
    device: deviceLabelFromUserAgent(stringOrNull(metadata.userAgent)),
    metadata,
  };
}

export function deviceLabelFromUserAgent(userAgent: string | null): string | null {
  if (!userAgent) return null;

  const browser =
    userAgent.includes("Edg/")
      ? "Edge"
      : userAgent.includes("Chrome/")
        ? "Chrome"
        : userAgent.includes("Firefox/")
          ? "Firefox"
          : userAgent.includes("Safari/")
            ? "Safari"
            : "Browser";
  const platform =
    userAgent.includes("Windows")
      ? "Windows"
      : userAgent.includes("Mac OS X")
        ? "macOS"
        : userAgent.includes("Android")
          ? "Android"
          : /iPhone|iPad/.test(userAgent)
            ? "iOS"
            : userAgent.includes("Linux")
              ? "Linux"
              : "Device";

  return `${browser} on ${platform}`;
}

function formatTimelineLabel(action: string, activityType: string): string {
  switch (action) {
    case "approve":
      return "Approved";
    case "reject":
      return "Rejected";
    case "escalate":
      return "Escalated";
    case "request_clarification":
      return "Clarification requested";
    default:
      return formatStatus(activityType);
  }
}

function formatStatus(status: string): string {
  return status
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function formatExecutionAssigneeFallback(approval: ApprovalWithRelations): string {
  const pendingStep = approval.steps.find((s) => s.status === "PENDING");
  return pendingStep?.assigneeRole ? formatRoleLabel(pendingStep.assigneeRole) : "Unassigned";
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

function stringOrNull(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}
