import { prisma } from "@/lib/db/prisma";
import {
  mapActivityLogToTimelineEvent,
  mapApprovalToCard,
  mapExecutionToCard,
  type ActivityLogWithUser,
} from "@/lib/workflows/mappers";
import { generateWorkflowIntelligence } from "@/lib/workflows/ai-insights";
import type {
  ApprovalTab,
  OperationsDashboardData,
  WorkflowTimelineEvent,
} from "@/lib/workflows/types";

const approvalInclude = {
  requester: {
    select: { id: true, email: true, firstName: true, lastName: true, displayName: true },
  },
  execution: {
    include: { workflow: true },
  },
  steps: {
    orderBy: { sequence: "asc" as const },
    include: {
      assignee: {
        select: { id: true, email: true, firstName: true, lastName: true, displayName: true },
      },
    },
  },
};

export async function resolveOrganizationId(slug: string): Promise<string | null> {
  const org = await prisma.organization.findFirst({
    where: { slug, deletedAt: null },
    select: { id: true },
  });
  return org?.id ?? null;
}

export async function getOperationsDashboard(
  organizationId: string,
): Promise<OperationsDashboardData> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [
    pendingApprovals,
    rejectedApprovals,
    completedApprovals,
    executions,
    activeCount,
    pendingCount,
    completedTodayCount,
    failedCount,
    waitingApprovalCount,
    recentAudits,
    recentNotifications,
    invoiceAgg,
    paymentCount,
  ] = await Promise.all([
    prisma.approval.findMany({
      where: { organizationId, status: "PENDING" },
      include: approvalInclude,
      orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }],
      take: 50,
    }),
    prisma.approval.findMany({
      where: { organizationId, status: "REJECTED" },
      include: approvalInclude,
      orderBy: { updatedAt: "desc" },
      take: 30,
    }),
    prisma.approval.findMany({
      where: {
        organizationId,
        status: { in: ["APPROVED", "ESCALATED"] },
      },
      include: approvalInclude,
      orderBy: { completedAt: "desc" },
      take: 30,
    }),
    prisma.workflowExecution.findMany({
      where: { organizationId },
      include: {
        workflow: true,
        approvals: { include: approvalInclude },
      },
      orderBy: { updatedAt: "desc" },
      take: 20,
    }),
    prisma.workflowExecution.count({
      where: { organizationId, status: { in: ["RUNNING", "WAITING_APPROVAL"] } },
    }),
    prisma.workflowExecution.count({
      where: { organizationId, status: "PENDING" },
    }),
    prisma.workflowExecution.count({
      where: {
        organizationId,
        status: "COMPLETED",
        completedAt: { gte: startOfDay },
      },
    }),
    prisma.workflowExecution.count({
      where: { organizationId, status: "FAILED" },
    }),
    prisma.workflowExecution.count({
      where: { organizationId, status: "WAITING_APPROVAL" },
    }),
    prisma.auditLog.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.notification.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.invoice.aggregate({
      where: { organizationId, status: { in: ["ISSUED", "SENT", "OVERDUE", "PARTIALLY_PAID"] } },
      _sum: { totalAmount: true },
    }),
    prisma.payment.count({
      where: { organizationId, status: "PENDING" },
    }),
  ]);

  const allApprovalRows = [
    ...pendingApprovals,
    ...rejectedApprovals,
    ...completedApprovals,
    ...executions.flatMap((execution) => execution.approvals),
  ];
  const timelineMap = await getWorkflowTimelineMap({
    organizationId,
    approvalIds: allApprovalRows.map((approval) => approval.id),
    executionIds: executions
      .map((execution) => execution.id)
      .concat(allApprovalRows.map((approval) => approval.executionId).filter(Boolean) as string[]),
  });

  const pending = pendingApprovals.map((approval) =>
    mapApprovalToCard(approval, timelineForApproval(timelineMap, approval)),
  );
  const rejected = rejectedApprovals.map((approval) =>
    mapApprovalToCard(approval, timelineForApproval(timelineMap, approval)),
  );
  const completed = completedApprovals.map((approval) =>
    mapApprovalToCard(approval, timelineForApproval(timelineMap, approval)),
  );
  const executionCards = executions.map((execution) =>
    mapExecutionToCard(execution, timelineForExecution(timelineMap, execution)),
  );

  const paidInvoices = await prisma.invoice.aggregate({
    where: {
      organizationId,
      status: "PAID",
      issueDate: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
    },
    _sum: { totalAmount: true },
  });

  const expenses = await prisma.expense.aggregate({
    where: {
      organizationId,
      deletedAt: null,
      expenseDate: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
    },
    _sum: { amount: true },
  });

  const financeSummary = {
    revenueMtd: Number(paidInvoices._sum.totalAmount ?? 0),
    expensesMtd: Number(expenses._sum.amount ?? 0),
    outstandingInvoices: Number(invoiceAgg._sum.totalAmount ?? 0),
    pendingPayments: paymentCount,
  };
  const intelligence = generateWorkflowIntelligence({
    pending,
    rejected,
    completed,
    executions: executionCards,
    auditLogs: recentAudits.map((audit) => ({
      id: audit.id,
      action: audit.action,
      severity: audit.severity,
      resourceId: audit.resourceId,
      createdAt: audit.createdAt,
      metadata: audit.metadata,
      before: audit.before,
      after: audit.after,
    })),
    financeSummary,
  });

  return {
    stats: {
      active: activeCount,
      pending: pendingCount,
      completedToday: completedTodayCount,
      failed: failedCount,
      waitingApproval: waitingApprovalCount,
      avgCompletionMins: 18,
    },
    approvals: { pending, rejected, completed },
    executions: executionCards,
    aiInsights: intelligence.insights,
    intelligence,
    financeSummary,
    auditAlerts: recentAudits.slice(0, 5).map((a) => ({
      id: a.id,
      severity: a.severity.toLowerCase(),
      message: `${a.action} on ${a.resource}`,
      time: formatRelative(a.createdAt),
    })),
    notifications: recentNotifications.map((n) => ({
      id: n.id,
      title: n.title,
      body: n.body ?? "",
      time: formatRelative(n.createdAt),
      unread: n.status !== "READ",
    })),
  };
}

export async function listApprovalsByTab(
  organizationId: string,
  tab: ApprovalTab,
) {
  const statusMap = {
    pending: ["PENDING"] as const,
    rejected: ["REJECTED"] as const,
    completed: ["APPROVED", "ESCALATED"] as const,
  };

  const rows = await prisma.approval.findMany({
    where: {
      organizationId,
      status: { in: [...statusMap[tab]] },
    },
    include: approvalInclude,
    orderBy: tab === "pending" ? [{ dueAt: "asc" }, { createdAt: "desc" }] : { updatedAt: "desc" },
    take: 50,
  });

  const timelineMap = await getWorkflowTimelineMap({
    organizationId,
    approvalIds: rows.map((approval) => approval.id),
    executionIds: rows.map((approval) => approval.executionId).filter(Boolean) as string[],
  });

  return rows.map((approval) =>
    mapApprovalToCard(approval, timelineForApproval(timelineMap, approval)),
  );
}

async function getWorkflowTimelineMap(params: {
  organizationId: string;
  approvalIds: string[];
  executionIds: string[];
}): Promise<Map<string, WorkflowTimelineEvent[]>> {
  const approvalIds = unique(params.approvalIds);
  const executionIds = unique(params.executionIds);
  const entityFilters = [
    ...(approvalIds.length > 0
      ? [{ entityType: "approval", entityId: { in: approvalIds } }]
      : []),
    ...(executionIds.length > 0
      ? [{ entityType: "workflow_execution", entityId: { in: executionIds } }]
      : []),
  ];

  if (entityFilters.length === 0) {
    return new Map();
  }

  const logs = await prisma.activityLog.findMany({
    where: {
      organizationId: params.organizationId,
      OR: entityFilters,
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          displayName: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 300,
  });

  const timelineMap = new Map<string, WorkflowTimelineEvent[]>();
  for (const log of logs as ActivityLogWithUser[]) {
    if (!log.entityType || !log.entityId) continue;
    const key = timelineKey(log.entityType, log.entityId);
    const timeline = timelineMap.get(key) ?? [];
    timeline.push(mapActivityLogToTimelineEvent(log));
    timelineMap.set(key, timeline);
  }

  return timelineMap;
}

function timelineForApproval(
  timelineMap: Map<string, WorkflowTimelineEvent[]>,
  approval: { id: string; executionId: string | null },
): WorkflowTimelineEvent[] {
  return mergeTimelines(
    timelineMap.get(timelineKey("approval", approval.id)),
    approval.executionId
      ? timelineMap.get(timelineKey("workflow_execution", approval.executionId))
      : undefined,
  );
}

function timelineForExecution(
  timelineMap: Map<string, WorkflowTimelineEvent[]>,
  execution: { id: string; approvals: { id: string }[] },
): WorkflowTimelineEvent[] {
  return mergeTimelines(
    timelineMap.get(timelineKey("workflow_execution", execution.id)),
    ...execution.approvals.map((approval) =>
      timelineMap.get(timelineKey("approval", approval.id)),
    ),
  );
}

function mergeTimelines(
  ...timelines: Array<WorkflowTimelineEvent[] | undefined>
): WorkflowTimelineEvent[] {
  return timelines
    .flatMap((timeline) => timeline ?? [])
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 8);
}

function timelineKey(entityType: string, entityId: string): string {
  return `${entityType}:${entityId}`;
}

function unique(values: Array<string | null | undefined>): string[] {
  return [...new Set(values.filter((value): value is string => Boolean(value)))];
}

function formatRelative(date: Date): string {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
