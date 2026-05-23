import { prisma } from "@/lib/db/prisma";
import { scheduleWorkflowReminder } from "@/lib/notifications/service";
import { writeAuditLog } from "@/lib/auth/audit";

export type ReminderScope = "workflows" | "finance" | "all";

export interface ReminderResult {
  approvalsMatched: number;
  recipientCount: number;
  inAppCount: number;
  emailCount: number;
  scheduledReminderCount: number;
  whatsappPlaceholderCount: number;
}

export async function sendApprovalReminder(params: {
  organizationId: string;
  actorUserId: string;
  actorName: string;
  scope: ReminderScope;
  approvalId?: string;
  ipAddress?: string | null;
  userAgent?: string | null;
}): Promise<ReminderResult> {
  const approvals = await prisma.approval.findMany({
    where: {
      organizationId: params.organizationId,
      status: "PENDING",
      ...(params.approvalId ? { id: params.approvalId } : {}),
      ...(params.scope === "finance"
        ? { entityType: { in: ["payment", "invoice", "expense", "procurement"] } }
        : {}),
    },
    include: {
      requester: { select: { id: true, email: true, phone: true } },
      steps: {
        where: { status: "PENDING" },
        orderBy: { sequence: "asc" },
        take: 1,
        include: {
          assignee: { select: { id: true, email: true, phone: true } },
        },
      },
    },
    orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }],
    take: 20,
  });

  let inAppCount = 0;
  let emailCount = 0;
  let scheduledReminderCount = 0;
  let whatsappPlaceholderCount = 0;
  const recipientIds = new Set<string>();

  for (const approval of approvals) {
    const recipients = [
      approval.steps[0]?.assignee
        ? {
            userId: approval.steps[0].assignee.id,
            email: approval.steps[0].assignee.email,
            phone: approval.steps[0].assignee.phone,
          }
        : null,
      {
        userId: approval.requester.id,
        email: approval.requester.email,
        phone: approval.requester.phone,
      },
    ].filter((recipient): recipient is { userId: string; email: string; phone: string | null } =>
      Boolean(recipient),
    );

    for (const recipient of recipients) {
      recipientIds.add(recipient.userId);
    }

    const result = await scheduleWorkflowReminder({
      organizationId: params.organizationId,
      actorUserId: params.actorUserId,
      recipients,
      eventType: "approval.reminder",
      title: `Reminder: ${approval.title}`,
      body: reminderBody(approval.title, params.actorName, approval.dueAt),
      actionUrl: `/dashboard/approvals?approval=${approval.id}`,
      entityType: "approval",
      entityId: approval.id,
      payload: {
        approvalId: approval.id,
        entityType: approval.entityType,
        dueAt: approval.dueAt?.toISOString() ?? null,
        scope: params.scope,
      },
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      correlationId: approval.executionId ?? approval.id,
    });

    inAppCount += result.inAppCount;
    emailCount += result.emailCount;
    scheduledReminderCount += result.scheduledReminderCount;
    whatsappPlaceholderCount += result.whatsappPlaceholderCount;
  }

  await writeAuditLog({
    organizationId: params.organizationId,
    userId: params.actorUserId,
    action: "notification.approval_reminder.requested",
    resource: "approval",
    resourceId: params.approvalId ?? null,
    severity: "INFO",
    ipAddress: params.ipAddress,
    userAgent: params.userAgent,
    after: {
      scope: params.scope,
      approvalsMatched: approvals.length,
      recipientCount: recipientIds.size,
      inAppCount,
      emailCount,
      scheduledReminderCount,
      whatsappPlaceholderCount,
    },
    metadata: {
      routeAction: "send_reminder",
      reminderTarget: params.approvalId ? "single_approval" : "pending_approvals",
    },
    correlationId: params.approvalId ?? `approval-reminder:${params.scope}`,
  });

  return {
    approvalsMatched: approvals.length,
    recipientCount: recipientIds.size,
    inAppCount,
    emailCount,
    scheduledReminderCount,
    whatsappPlaceholderCount,
  };
}

function reminderBody(title: string, actorName: string, dueAt: Date | null): string {
  const dueText = dueAt
    ? ` It is due ${new Intl.DateTimeFormat("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(dueAt)}.`
    : "";
  return `${actorName} sent a reminder for ${title}.${dueText}`;
}
