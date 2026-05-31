import { getFinanceDashboard } from "@/lib/dashboard/finance";
import { formatInr } from "@/lib/dashboard/mock-data";
import { getOperationsDashboard } from "@/lib/workflows/queries";
import type { WorkflowCardData } from "@/lib/workflows/types";

export interface HomeDashboardSnapshot {
  workflowStats: {
    active: number;
    pending: number;
    completedToday: number;
    failed: number;
    avgCompletionMins: number;
  };
  financeSummary: {
    revenueMtd: number;
    expensesMtd: number;
    outstandingInvoices: number;
    pendingPayments: number;
    gstLiability: number;
    budgetUtilization: number;
  };
  approvals: Array<{
    id: string;
    title: string;
    type: string;
    amount: number;
    requester: string;
    priority: "low" | "medium" | "high";
    dueIn: string;
  }>;
  auditAlerts: Array<{
    id: string;
    severity: "critical" | "warning" | "info";
    message: string;
    time: string;
  }>;
}

export async function getHomeDashboardSnapshot(
  organizationId: string,
): Promise<HomeDashboardSnapshot> {
  const [operations, finance] = await Promise.all([
    getOperationsDashboard(organizationId),
    getFinanceDashboard(organizationId),
  ]);

  return {
    workflowStats: operations.stats,
    financeSummary: {
      revenueMtd: finance.kpis.revenueMtd,
      expensesMtd: finance.kpis.expensesMtd,
      outstandingInvoices: finance.kpis.outstandingInvoices,
      pendingPayments: finance.kpis.pendingPayments,
      gstLiability: finance.gstSummary.netLiability,
      budgetUtilization: finance.kpis.budgetUtilization,
    },
    approvals: operations.approvals.pending.slice(0, 4).map(mapApprovalForHome),
    auditAlerts: operations.auditAlerts.map((alert) => ({
      id: alert.id,
      severity: normalizeSeverity(alert.severity),
      message: alert.message,
      time: alert.time,
    })),
  };
}

function mapApprovalForHome(card: WorkflowCardData): HomeDashboardSnapshot["approvals"][number] {
  const meta = card.metadata ?? {};
  const amount = Number(meta.amountInr ?? 0);
  const priority =
    card.priority === "critical" ? "high" : card.priority === "high" ? "high" : card.priority;

  return {
    id: card.approvalId ?? card.id,
    title: card.title,
    type: formatEntityType(card.entityType),
    amount,
    requester: card.requester.name,
    priority: priority === "high" ? "high" : priority === "medium" ? "medium" : "low",
    dueIn: formatDueIn(card.dueAt),
  };
}

function formatEntityType(entityType: string): string {
  if (!entityType) return "Approval";
  return entityType
    .split(/[_-]/g)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDueIn(dueAt: string | null): string {
  if (!dueAt) return "No due date";
  const due = new Date(dueAt);
  const diffMs = due.getTime() - Date.now();
  const diffHours = Math.round(diffMs / (60 * 60 * 1000));
  if (diffHours < 0) return "Overdue";
  if (diffHours < 24) return `${Math.max(1, diffHours)}h`;
  const diffDays = Math.round(diffHours / 24);
  return `${diffDays}d`;
}

function normalizeSeverity(value: string): "critical" | "warning" | "info" {
  const normalized = value.toLowerCase();
  if (normalized === "critical" || normalized === "error") return "critical";
  if (normalized === "warning") return "warning";
  return "info";
}

export { formatInr };
