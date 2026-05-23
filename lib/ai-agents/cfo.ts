import type { FinanceDashboardData } from "@/lib/dashboard/finance";
import { getFinanceDashboard } from "@/lib/dashboard/finance";
import type { OperationsDashboardData } from "@/lib/workflows/types";
import { getOperationsDashboard } from "@/lib/workflows/queries";
import {
  auditAiInsightGeneration,
  buildAgentMetadata,
  formatInr,
  insight,
  severityFromScore,
} from "@/lib/ai-agents/shared";
import type {
  AiAgentInsight,
  AiAgentRequestContext,
  CfoAiAgentResult,
} from "@/lib/ai-agents/types";

export async function generateCfoAiAgentInsights(
  context: AiAgentRequestContext & {
    financeData?: FinanceDashboardData;
    operationsData?: OperationsDashboardData;
  },
): Promise<CfoAiAgentResult> {
  const [finance, operations] = await Promise.all([
    context.financeData ?? getFinanceDashboard(context.organizationId),
    context.operationsData ?? getOperationsDashboard(context.organizationId),
  ]);

  const result: CfoAiAgentResult = {
    metadata: buildAgentMetadata("cfo"),
    cashFlowInsights: buildCashFlowInsights(finance),
    budgetVarianceAlerts: buildBudgetVarianceAlerts(finance),
    financeRiskSummary: buildFinanceRiskSummary(finance, operations),
    approvalRecommendations: buildApprovalRecommendations(operations),
  };

  const insights = flattenCfoInsights(result);
  await auditAiInsightGeneration({
    context,
    agent: "cfo",
    insights,
    categories: {
      cashFlowInsights: result.cashFlowInsights.length,
      budgetVarianceAlerts: result.budgetVarianceAlerts.length,
      financeRiskSummary: result.financeRiskSummary.length,
      approvalRecommendations: result.approvalRecommendations.length,
    },
  });

  return result;
}

function buildCashFlowInsights(finance: FinanceDashboardData): AiAgentInsight[] {
  const liquidityScore = scoreCashFlow(finance);
  const netPosition = finance.kpis.netPositionMtd;

  return [
    insight({
      id: "cfo-cash-flow-position",
      title: netPosition >= 0 ? "Positive month-to-date cash posture" : "Cash flow pressure detected",
      description:
        netPosition >= 0
          ? `Revenue is ahead of expenses by ${formatInr(netPosition)} this month.`
          : `Expenses exceed paid revenue by ${formatInr(Math.abs(netPosition))} this month.`,
      severity: severityFromScore(100 - liquidityScore),
      confidence: 86,
      evidence: [
        `Revenue MTD ${formatInr(finance.kpis.revenueMtd)}`,
        `Expenses MTD ${formatInr(finance.kpis.expensesMtd)}`,
        `Outstanding invoices ${formatInr(finance.kpis.outstandingInvoices)}`,
      ],
      recommendation:
        netPosition >= 0
          ? "Keep collections cadence steady and review large pending payments before release."
          : "Prioritize receivables collection and hold non-critical discretionary spend.",
    }),
    insight({
      id: "cfo-collections-exposure",
      title: "Collections exposure watch",
      description: `${finance.kpis.overdueInvoices} overdue invoice(s) and ${finance.kpis.pendingPayments} pending payment(s) affect short-term cash visibility.`,
      severity:
        finance.kpis.overdueInvoices > 5 || finance.kpis.pendingPayments > 5
          ? "high"
          : finance.kpis.overdueInvoices > 0 || finance.kpis.pendingPayments > 0
            ? "medium"
            : "low",
      confidence: 82,
      evidence: [
        `${finance.kpis.overdueInvoices} overdue invoice(s)`,
        `${finance.kpis.pendingPayments} pending payment(s)`,
      ],
      recommendation: "Escalate overdue receivables and approve only payments with clean audit context.",
    }),
  ];
}

function buildBudgetVarianceAlerts(finance: FinanceDashboardData): AiAgentInsight[] {
  const watchedBudgets = finance.budgetTracking.budgets
    .filter((budget) => budget.utilization >= 80 || budget.remaining < 0)
    .slice(0, 4);

  if (watchedBudgets.length === 0) {
    return [
      insight({
        id: "cfo-budget-variance-clear",
        title: "Budget variance within guardrails",
        description: "No active budget has crossed the configured 80% utilization watch threshold.",
        severity: "low",
        confidence: 78,
        evidence: [`Overall utilization ${finance.budgetTracking.utilization}%`],
        recommendation: "Continue weekly budget review for fast-moving cost centers.",
      }),
    ];
  }

  return watchedBudgets.map((budget) =>
    insight({
      id: `cfo-budget-${budget.id}`,
      title: `${budget.name} budget variance`,
      description: `${budget.departmentName} has consumed ${budget.utilization}% of the ${budget.category} budget.`,
      severity: budget.remaining < 0 ? "critical" : budget.utilization >= 95 ? "high" : "medium",
      confidence: 84,
      evidence: [
        `Allocated ${formatInr(budget.allocated)}`,
        `Consumed ${formatInr(budget.consumed)}`,
        `Remaining ${formatInr(budget.remaining)}`,
      ],
      recommendation:
        budget.remaining < 0
          ? "Freeze further spend until a variance note and revised approval are attached."
          : "Route upcoming spends through CFO review before approval.",
    }),
  );
}

function buildFinanceRiskSummary(
  finance: FinanceDashboardData,
  operations: OperationsDashboardData,
): AiAgentInsight[] {
  const riskScore = Math.min(
    100,
    finance.kpis.overdueInvoices * 8 +
      finance.kpis.pendingPayments * 6 +
      finance.budgetTracking.overBudgetCount * 12 +
      operations.intelligence.summary.highRiskApprovals * 10 +
      operations.intelligence.financeAnomalies.length * 8,
  );

  return [
    insight({
      id: "cfo-finance-risk-summary",
      title: "Finance risk summary",
      description: `Composite finance risk score is ${riskScore}/100 across cash, budget, approval, and anomaly signals.`,
      severity: severityFromScore(riskScore),
      confidence: 88,
      evidence: [
        `${operations.intelligence.summary.highRiskApprovals} high-risk approval(s)`,
        `${operations.intelligence.financeAnomalies.length} finance anomaly signal(s)`,
        `${finance.budgetTracking.overBudgetCount} over-budget control(s)`,
      ],
      recommendation: "Review the highest-value pending approvals before releasing cash-impacting workflows.",
    }),
  ];
}

function buildApprovalRecommendations(
  operations: OperationsDashboardData,
): AiAgentInsight[] {
  const pendingById = new Map(
    operations.approvals.pending.map((item) => [item.approvalId ?? item.id, item]),
  );
  const financeRecommendations = operations.intelligence.approvalRecommendations
    .filter((item) => {
      const approval = pendingById.get(item.approvalId);
      return approval
        ? ["invoice", "expense", "payment", "procurement"].includes(approval.entityType)
        : true;
    })
    .slice(0, 4);

  if (financeRecommendations.length === 0) {
    return [
      insight({
        id: "cfo-approval-recommendation-clear",
        title: "No urgent finance approval recommendation",
        description: "The current pending approval queue has no finance-specific item requiring CFO override.",
        severity: "low",
        confidence: 72,
        evidence: [`${operations.approvals.pending.length} pending approval(s) reviewed`],
        recommendation: "Let standard approval routing continue and monitor SLA predictions.",
      }),
    ];
  }

  return financeRecommendations.map((item) =>
    insight({
      id: `cfo-approval-${item.approvalId}`,
      title: item.title,
      description: item.rationale,
      severity: severityFromScore(item.riskScore),
      confidence: item.confidence,
      evidence: [
        `Risk score ${item.riskScore}/100`,
        `Priority score ${item.priorityScore}/100`,
        ...item.auditSignals.slice(0, 2),
      ],
      recommendation: `Recommended action: ${item.recommendedAction.replace(/_/g, " ")}.`,
    }),
  );
}

function scoreCashFlow(finance: FinanceDashboardData): number {
  const base = finance.kpis.netPositionMtd >= 0 ? 70 : 35;
  const collectionPenalty = Math.min(25, finance.kpis.overdueInvoices * 4);
  const budgetPenalty = finance.kpis.budgetUtilization > 90 ? 15 : 0;
  return Math.max(0, Math.min(100, base - collectionPenalty - budgetPenalty));
}

function flattenCfoInsights(result: CfoAiAgentResult): AiAgentInsight[] {
  return [
    ...result.cashFlowInsights,
    ...result.budgetVarianceAlerts,
    ...result.financeRiskSummary,
    ...result.approvalRecommendations,
  ];
}
