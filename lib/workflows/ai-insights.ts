import { priorityFromScore } from "@/lib/workflows/mappers";
import type {
  AiApprovalRecommendation,
  AiInsight,
  AiInsightSeverity,
  AuditAwareSuggestion,
  FinanceAnomalyAlert,
  PriorityPrediction,
  SlaBreachPrediction,
  WorkflowCardData,
  WorkflowBottleneckInsight,
  WorkflowIntelligenceData,
  WorkflowIntelligenceWidget,
} from "@/lib/workflows/types";

type AuditSignalInput = {
  id: string;
  action: string;
  severity: string;
  resourceId: string | null;
  createdAt: Date;
  metadata?: unknown;
  before?: unknown;
  after?: unknown;
};

type FinanceSummaryInput = {
  revenueMtd: number;
  expensesMtd: number;
  outstandingInvoices: number;
  pendingPayments: number;
};

type WorkflowIntelligenceInput = {
  pending: WorkflowCardData[];
  rejected: WorkflowCardData[];
  completed: WorkflowCardData[];
  executions: WorkflowCardData[];
  auditLogs: AuditSignalInput[];
  financeSummary: FinanceSummaryInput;
  now?: Date;
};

type ApprovalRiskModel = {
  item: WorkflowCardData;
  riskScore: number;
  predictedPriorityScore: number;
  confidence: number;
  evidence: string[];
  auditSignals: string[];
  amountInr: number | null;
  minutesToDue: number | null;
};

const ENGINE_VERSION = "workflow-intelligence-rules-v1";

export function generateWorkflowIntelligence(
  input: WorkflowIntelligenceInput,
): WorkflowIntelligenceData {
  const now = input.now ?? new Date();
  const auditByApprovalId = groupAuditByApprovalId(input.auditLogs);
  const pendingModels = input.pending.map((item) =>
    scoreApprovalRisk(item, auditByApprovalId.get(item.approvalId ?? item.id) ?? [], now),
  );

  const approvalRecommendations = pendingModels
    .map(buildApprovalRecommendation)
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 8);
  const slaPredictions = pendingModels
    .map(buildSlaPrediction)
    .filter((prediction): prediction is SlaBreachPrediction => Boolean(prediction))
    .sort((a, b) => b.probability - a.probability)
    .slice(0, 8);
  const priorityPredictions = pendingModels
    .map(buildPriorityPrediction)
    .filter((prediction): prediction is PriorityPrediction => Boolean(prediction))
    .sort((a, b) => b.predictedScore - a.predictedScore)
    .slice(0, 8);
  const financeAnomalies = buildFinanceAnomalies({
    pendingModels,
    rejected: input.rejected,
    financeSummary: input.financeSummary,
  });
  const bottleneckInsights = buildBottleneckInsights({
    pendingModels,
    executions: input.executions,
    now,
  });
  const auditAwareSuggestions = buildAuditAwareSuggestions({
    pendingModels,
    auditLogs: input.auditLogs,
  });
  const insights = buildInsights({
    pendingModels,
    rejected: input.rejected,
    executions: input.executions,
    approvalRecommendations,
    slaPredictions,
    priorityPredictions,
    financeAnomalies,
    bottleneckInsights,
    auditAwareSuggestions,
  });

  const summary = {
    maxRiskScore: pendingModels.length
      ? Math.max(...pendingModels.map((model) => model.riskScore))
      : 0,
    averageRiskScore: pendingModels.length
      ? Math.round(
          pendingModels.reduce((sum, model) => sum + model.riskScore, 0) /
            pendingModels.length,
        )
      : 0,
    highRiskApprovals: pendingModels.filter((model) => model.riskScore >= 70).length,
    predictedSlaBreaches: slaPredictions.filter((prediction) => prediction.probability >= 70)
      .length,
    financeAnomalies: financeAnomalies.length,
    bottleneckInsights: bottleneckInsights.length,
    priorityRecommendations: priorityPredictions.length,
    auditAwareSuggestions: auditAwareSuggestions.length,
  };

  return {
    generatedAt: now.toISOString(),
    engineVersion: ENGINE_VERSION,
    modelStatus: "rules_engine",
    summary,
    widgets: buildWidgets(summary),
    approvalRecommendations,
    insights,
    slaPredictions,
    priorityPredictions,
    financeAnomalies,
    bottleneckInsights,
    auditAwareSuggestions,
  };
}

export function generateAiInsights(
  pending: WorkflowCardData[],
  rejected: WorkflowCardData[],
): AiInsight[] {
  return generateWorkflowIntelligence({
    pending,
    rejected,
    completed: [],
    executions: [],
    auditLogs: [],
    financeSummary: {
      revenueMtd: 0,
      expensesMtd: 0,
      outstandingInvoices: 0,
      pendingPayments: 0,
    },
  }).insights;
}

function scoreApprovalRisk(
  item: WorkflowCardData,
  audits: AuditSignalInput[],
  now: Date,
): ApprovalRiskModel {
  const amountInr = numberFromMetadata(item.metadata, "amountInr");
  const minutesToDue = item.dueAt
    ? Math.round((new Date(item.dueAt).getTime() - now.getTime()) / 60000)
    : null;
  const evidence: string[] = [`Priority score ${item.priorityScore}`];
  const auditSignals = collectAuditSignals(item, audits);
  let score = clamp(item.priorityScore, 0, 100);

  if (amountInr != null) {
    if (amountInr >= 1_000_000) {
      score += 15;
      evidence.push(`High value exposure ${formatInr(amountInr)}`);
    } else if (amountInr >= 500_000) {
      score += 8;
      evidence.push(`Material value exposure ${formatInr(amountInr)}`);
    }
  }

  if (minutesToDue != null) {
    if (minutesToDue < 0) {
      score += 25;
      evidence.push("SLA already breached");
    } else if (minutesToDue <= 120) {
      score += 18;
      evidence.push("Due within 2 hours");
    } else if (minutesToDue <= 480) {
      score += 10;
      evidence.push("Due within 8 hours");
    }
  }

  if (["payment", "invoice", "payroll", "procurement"].includes(item.entityType)) {
    score += 6;
    evidence.push(`${formatLabel(item.entityType)} workflow`);
  }

  if (auditSignals.length > 0) {
    score += Math.min(20, auditSignals.length * 6);
    evidence.push(`${auditSignals.length} audit signal(s) found`);
  }

  const timelineEscalations =
    item.timeline?.filter((event) =>
      ["escalate", "reject", "REJECT"].some((term) =>
        JSON.stringify(event.metadata ?? {})
          .toLowerCase()
          .includes(term.toLowerCase()),
      ),
    ).length ?? 0;
  if (timelineEscalations > 0) {
    score += Math.min(12, timelineEscalations * 6);
    evidence.push(`${timelineEscalations} prior timeline exception(s)`);
  }

  const riskScore = clamp(Math.round(score), 0, 100);
  const predictedPriorityScore = clamp(
    riskScore + (minutesToDue != null && minutesToDue < 240 ? 5 : 0),
    0,
    100,
  );

  return {
    item,
    riskScore,
    predictedPriorityScore,
    confidence: confidenceFromEvidence(evidence.length, auditSignals.length),
    evidence,
    auditSignals,
    amountInr,
    minutesToDue,
  };
}

function collectAuditSignals(item: WorkflowCardData, audits: AuditSignalInput[]): string[] {
  const signals = audits.flatMap((audit) => {
    const action = audit.action.toLowerCase();
    const severity = audit.severity.toLowerCase();
    if (severity === "critical" || severity === "warning") {
      return [`${audit.action} (${audit.severity.toLowerCase()})`];
    }
    if (action.includes("reject") || action.includes("escalate")) {
      return [audit.action];
    }
    return [];
  });

  const timelineSignals =
    item.timeline
      ?.filter((event) => event.ipAddress || event.comment || event.device)
      .map((event) => event.label)
      .slice(0, 3) ?? [];

  return unique([...signals, ...timelineSignals]).slice(0, 5);
}

function buildApprovalRecommendation(model: ApprovalRiskModel): AiApprovalRecommendation {
  const recommendedAction =
    model.riskScore >= 88
      ? "request_evidence"
      : model.minutesToDue != null && model.minutesToDue < 90
        ? "escalate"
        : model.riskScore >= 66
          ? "review"
          : "approve";

  return {
    id: `approval-rec-${model.item.approvalId ?? model.item.id}`,
    approvalId: model.item.approvalId ?? model.item.id,
    title: model.item.title,
    recommendedAction,
    riskScore: model.riskScore,
    priorityScore: model.predictedPriorityScore,
    confidence: model.confidence,
    rationale: recommendationRationale(recommendedAction, model),
    auditSignals:
      model.auditSignals.length > 0 ? model.auditSignals : ["No adverse audit trail detected"],
    safeguards: recommendationSafeguards(recommendedAction, model),
    generatedAt: new Date().toISOString(),
  };
}

function buildSlaPrediction(model: ApprovalRiskModel): SlaBreachPrediction | null {
  if (model.minutesToDue == null) return null;

  const probability = clamp(
    Math.round(
      (model.minutesToDue < 0
        ? 95
        : model.minutesToDue <= 120
          ? 75
          : model.minutesToDue <= 480
            ? 45
            : 20) + model.riskScore / 5,
    ),
    0,
    99,
  );

  if (probability < 45) return null;

  return {
    id: `sla-${model.item.approvalId ?? model.item.id}`,
    approvalId: model.item.approvalId ?? model.item.id,
    title: model.item.title,
    probability,
    minutesToDue: model.minutesToDue,
    dueAt: model.item.dueAt,
    severity: severityFromScore(probability),
    reason:
      model.minutesToDue < 0
        ? "Due time has passed and workflow remains pending."
        : `Due in ${formatDuration(model.minutesToDue)} with risk score ${model.riskScore}.`,
  };
}

function buildPriorityPrediction(model: ApprovalRiskModel): PriorityPrediction | null {
  const predictedPriority = priorityFromScore(model.predictedPriorityScore);
  if (
    predictedPriority === model.item.priority &&
    Math.abs(model.predictedPriorityScore - model.item.priorityScore) < 10
  ) {
    return null;
  }

  return {
    id: `priority-${model.item.approvalId ?? model.item.id}`,
    approvalId: model.item.approvalId ?? model.item.id,
    title: model.item.title,
    currentPriority: model.item.priority,
    predictedPriority,
    predictedScore: model.predictedPriorityScore,
    confidence: model.confidence,
    reason: model.evidence.slice(0, 3).join(" | "),
  };
}

function buildFinanceAnomalies(params: {
  pendingModels: ApprovalRiskModel[];
  rejected: WorkflowCardData[];
  financeSummary: FinanceSummaryInput;
}): FinanceAnomalyAlert[] {
  const alerts: FinanceAnomalyAlert[] = [];
  const amountModels = params.pendingModels.filter((model) => model.amountInr != null);
  const averageAmount = amountModels.length
    ? amountModels.reduce((sum, model) => sum + (model.amountInr ?? 0), 0) /
      amountModels.length
    : 0;

  for (const model of amountModels) {
    const amount = model.amountInr ?? 0;
    if (amount >= Math.max(1_000_000, averageAmount * 1.8)) {
      alerts.push({
        id: `finance-amount-${model.item.approvalId ?? model.item.id}`,
        title: "High-value finance approval",
        description: `${model.item.title} is above the current queue baseline.`,
        severity: model.riskScore >= 85 ? "critical" : "high",
        amountInr: amount,
        entityType: model.item.entityType,
        entityId: model.item.executionId,
        relatedApprovalId: model.item.approvalId,
        evidence: [
          `Amount ${formatInr(amount)}`,
          averageAmount > 0 ? `Queue average ${formatInr(averageAmount)}` : "No queue average",
          `Risk score ${model.riskScore}`,
        ],
        source: "rules_engine",
      });
    }
  }

  const pendingPaymentCount = params.pendingModels.filter((model) =>
    ["payment", "procurement"].includes(model.item.entityType),
  ).length;
  if (pendingPaymentCount >= 2 || params.financeSummary.pendingPayments > 5) {
    alerts.push({
      id: "finance-payment-concentration",
      title: "Payment concentration risk",
      description:
        "Multiple payment and procurement approvals are queued together, increasing cash-control review risk.",
      severity: pendingPaymentCount >= 3 ? "high" : "medium",
      amountInr: null,
      entityType: "payment",
      entityId: null,
      evidence: [
        `${pendingPaymentCount} payment/procurement approval(s) pending`,
        `${params.financeSummary.pendingPayments} pending payment record(s)`,
      ],
      source: "rules_engine",
    });
  }

  const rejectedExpense = params.rejected.find((item) => item.entityType === "expense");
  if (rejectedExpense) {
    alerts.push({
      id: `finance-rejected-expense-${rejectedExpense.approvalId ?? rejectedExpense.id}`,
      title: "Rejected expense pattern",
      description:
        "Rejected expense history indicates supporting-document anomaly risk before resubmission.",
      severity: "medium",
      amountInr: numberFromMetadata(rejectedExpense.metadata, "amountInr"),
      entityType: rejectedExpense.entityType,
      entityId: rejectedExpense.executionId,
      relatedApprovalId: rejectedExpense.approvalId,
      evidence: ["Prior rejection in expense workflow", rejectedExpense.statusLabel],
      source: "rules_engine",
    });
  }

  return dedupeById(alerts).slice(0, 8);
}

function buildBottleneckInsights(params: {
  pendingModels: ApprovalRiskModel[];
  executions: WorkflowCardData[];
  now: Date;
}): WorkflowBottleneckInsight[] {
  const insights: WorkflowBottleneckInsight[] = [];
  const byAssignee = new Map<string, ApprovalRiskModel[]>();
  const byWorkflow = new Map<string, ApprovalRiskModel[]>();

  for (const model of params.pendingModels) {
    const assigneeKey = model.item.assignee.id ?? model.item.assignee.name;
    const assigneeModels = byAssignee.get(assigneeKey) ?? [];
    assigneeModels.push(model);
    byAssignee.set(assigneeKey, assigneeModels);

    const workflowModels = byWorkflow.get(model.item.workflowName) ?? [];
    workflowModels.push(model);
    byWorkflow.set(model.item.workflowName, workflowModels);
  }

  for (const [assigneeKey, models] of byAssignee) {
    if (models.length < 2) continue;
    const label = models[0]?.item.assignee.name ?? assigneeKey;
    const averageRisk = average(models.map((model) => model.riskScore));
    const avgAgeHours = averageAgeHours(models.map((model) => model.item.createdAt), params.now);
    const score = clamp(Math.round(averageRisk + models.length * 4 + avgAgeHours / 12), 0, 100);

    insights.push({
      id: `bottleneck-assignee-${slugify(assigneeKey)}`,
      title: `${label} approval queue`,
      description: `${models.length} pending approvals are assigned to the same owner.`,
      severity: severityFromScore(score),
      scope: "assignee",
      count: models.length,
      averageAgeHours: avgAgeHours,
      confidence: confidenceFromEvidence(models.length + 1, countAuditSignals(models)),
      relatedApprovalIds: approvalIdsForModels(models),
      evidence: [
        `Average risk score ${Math.round(averageRisk)}`,
        `Average age ${formatAgeHours(avgAgeHours)}`,
        ...models.slice(0, 3).map((model) => model.item.title),
      ],
      source: models.some((model) => model.auditSignals.length > 0)
        ? "audit_history"
        : "rules_engine",
    });
  }

  for (const [workflowName, models] of byWorkflow) {
    if (models.length < 2) continue;
    const averageRisk = average(models.map((model) => model.riskScore));
    const avgAgeHours = averageAgeHours(models.map((model) => model.item.createdAt), params.now);
    const score = clamp(Math.round(averageRisk + models.length * 5), 0, 100);

    insights.push({
      id: `bottleneck-workflow-${slugify(workflowName)}`,
      title: `${workflowName} queue pressure`,
      description: `${models.length} approvals are waiting inside the same workflow.`,
      severity: severityFromScore(score),
      scope: "workflow",
      count: models.length,
      averageAgeHours: avgAgeHours,
      confidence: confidenceFromEvidence(models.length, countAuditSignals(models)),
      relatedApprovalIds: approvalIdsForModels(models),
      evidence: [
        `Average risk score ${Math.round(averageRisk)}`,
        ...models.slice(0, 3).map((model) => `${model.item.title} (${model.item.priority})`),
      ],
      source: "rules_engine",
    });
  }

  const financeQueue = params.pendingModels.filter((model) =>
    ["payment", "procurement", "invoice"].includes(model.item.entityType),
  );
  if (financeQueue.length >= 2) {
    const averageRisk = average(financeQueue.map((model) => model.riskScore));
    const totalExposure = financeQueue.reduce(
      (sum, model) => sum + (model.amountInr ?? 0),
      0,
    );

    insights.push({
      id: "bottleneck-finance-approvals",
      title: "Finance approval concentration",
      description: `${financeQueue.length} finance-sensitive approvals are pending together.`,
      severity: severityFromScore(Math.round(averageRisk + financeQueue.length * 6)),
      scope: "entity_type",
      count: financeQueue.length,
      averageAgeHours: averageAgeHours(
        financeQueue.map((model) => model.item.createdAt),
        params.now,
      ),
      confidence: confidenceFromEvidence(financeQueue.length + 1, countAuditSignals(financeQueue)),
      relatedApprovalIds: approvalIdsForModels(financeQueue),
      evidence: [
        `Queued exposure ${formatInr(totalExposure)}`,
        `Average risk score ${Math.round(averageRisk)}`,
        ...unique(financeQueue.map((model) => formatLabel(model.item.entityType))).slice(0, 3),
      ],
      source: "rules_engine",
    });
  }

  const waitingExecutions = params.executions.filter(
    (execution) => execution.status === "WAITING_APPROVAL",
  );
  if (waitingExecutions.length >= 2) {
    const averageAge = averageAgeHours(
      waitingExecutions.map((execution) => execution.updatedAt),
      params.now,
    );

    insights.push({
      id: "bottleneck-waiting-executions",
      title: "Executions waiting on approval",
      description: `${waitingExecutions.length} workflow executions are paused at approval gates.`,
      severity: severityFromScore(Math.min(95, waitingExecutions.length * 18 + averageAge)),
      scope: "execution_state",
      count: waitingExecutions.length,
      averageAgeHours: averageAge,
      confidence: clamp(64 + waitingExecutions.length * 4, 60, 90),
      relatedApprovalIds: unique(
        waitingExecutions
          .map((execution) => execution.approvalId)
          .filter((value): value is string => Boolean(value)),
      ),
      evidence: waitingExecutions
        .slice(0, 3)
        .map((execution) => `${execution.workflowName}: ${execution.statusLabel}`),
      source: "rules_engine",
    });
  }

  const failedExecutions = params.executions.filter((execution) => execution.status === "FAILED");
  if (failedExecutions.length > 0) {
    insights.push({
      id: "bottleneck-failed-executions",
      title: "Failed execution follow-up",
      description: `${failedExecutions.length} failed execution needs workflow owner review.`,
      severity: failedExecutions.length > 2 ? "high" : "medium",
      scope: "execution_state",
      count: failedExecutions.length,
      averageAgeHours: averageAgeHours(
        failedExecutions.map((execution) => execution.updatedAt),
        params.now,
      ),
      confidence: clamp(68 + failedExecutions.length * 5, 68, 92),
      relatedApprovalIds: unique(
        failedExecutions
          .map((execution) => execution.approvalId)
          .filter((value): value is string => Boolean(value)),
      ),
      evidence: failedExecutions.slice(0, 3).map((execution) => execution.title),
      source: "rules_engine",
    });
  }

  return dedupeById(insights)
    .sort((a, b) => severityWeight(b.severity) - severityWeight(a.severity) || b.count - a.count)
    .slice(0, 8);
}

function buildAuditAwareSuggestions(params: {
  pendingModels: ApprovalRiskModel[];
  auditLogs: AuditSignalInput[];
}): AuditAwareSuggestion[] {
  const suggestions: AuditAwareSuggestion[] = [];
  const warningLogs = params.auditLogs.filter((audit) =>
    ["WARNING", "CRITICAL"].includes(audit.severity.toUpperCase()),
  );

  for (const model of params.pendingModels.filter((entry) => entry.auditSignals.length > 0)) {
    suggestions.push({
      id: `audit-aware-${model.item.approvalId ?? model.item.id}`,
      title: "Audit-aware approval review",
      description: `${model.item.title} has audit trail context that should be reviewed before action.`,
      severity: model.riskScore >= 80 ? "high" : "medium",
      relatedApprovalId: model.item.approvalId,
      auditSignalCount: model.auditSignals.length,
      evidence: model.auditSignals,
    });
  }

  if (warningLogs.length > 0 && suggestions.length === 0) {
    suggestions.push({
      id: "audit-aware-global",
      title: "Recent warning audit activity",
      description:
        "Recent warning-level audit events exist in this tenant; review before bulk approval.",
      severity: "medium",
      auditSignalCount: warningLogs.length,
      evidence: warningLogs.slice(0, 3).map((audit) => audit.action),
    });
  }

  return suggestions.slice(0, 6);
}

function buildInsights(params: {
  pendingModels: ApprovalRiskModel[];
  rejected: WorkflowCardData[];
  executions: WorkflowCardData[];
  approvalRecommendations: AiApprovalRecommendation[];
  slaPredictions: SlaBreachPrediction[];
  priorityPredictions: PriorityPrediction[];
  financeAnomalies: FinanceAnomalyAlert[];
  bottleneckInsights: WorkflowBottleneckInsight[];
  auditAwareSuggestions: AuditAwareSuggestion[];
}): AiInsight[] {
  const insights: AiInsight[] = [];
  const highRisk = params.pendingModels.filter((model) => model.riskScore >= 70);
  const failedExecutions = params.executions.filter((execution) => execution.status === "FAILED");

  if (highRisk.length > 0) {
    const top = highRisk.sort((a, b) => b.riskScore - a.riskScore)[0];
    insights.push({
      id: "risk-high-pending",
      type: "risk",
      title: `${highRisk.length} high-risk approval(s) pending`,
      description:
        "Risk scoring combines value exposure, SLA timing, audit signals, and workflow priority.",
      severity: severityFromScore(top.riskScore),
      relatedApprovalId: top.item.approvalId,
      relatedExecutionId: top.item.executionId,
      score: top.riskScore,
      confidence: top.confidence,
      evidence: top.evidence,
      actionLabel: "Review now",
      source: "rules_engine",
      auditAware: top.auditSignals.length > 0,
    });
  }

  for (const prediction of params.slaPredictions.slice(0, 2)) {
    insights.push({
      id: `insight-${prediction.id}`,
      type: "sla",
      title: `SLA breach prediction: ${prediction.title}`,
      description: prediction.reason,
      severity: prediction.severity,
      relatedApprovalId: prediction.approvalId,
      score: prediction.probability,
      confidence: 78,
      evidence: [
        prediction.dueAt ? `Due ${formatDateTime(prediction.dueAt)}` : "No due date",
        `${prediction.probability}% breach probability`,
      ],
      actionLabel: "Escalate if needed",
      source: "rules_engine",
    });
  }

  for (const prediction of params.priorityPredictions.slice(0, 2)) {
    insights.push({
      id: `insight-${prediction.id}`,
      type: "priority",
      title: `Priority predicted as ${prediction.predictedPriority}`,
      description: `${prediction.title}: ${prediction.reason}`,
      severity: severityFromScore(prediction.predictedScore),
      relatedApprovalId: prediction.approvalId,
      score: prediction.predictedScore,
      confidence: prediction.confidence,
      evidence: [prediction.reason],
      actionLabel: "Re-prioritize queue",
      source: "rules_engine",
    });
  }

  for (const alert of params.financeAnomalies.slice(0, 3)) {
    insights.push({
      id: `insight-${alert.id}`,
      type: "finance",
      title: alert.title,
      description: alert.description,
      severity: alert.severity,
      relatedApprovalId: alert.relatedApprovalId,
      score: alert.amountInr ? scoreFromAmount(alert.amountInr) : undefined,
      confidence: alert.source === "placeholder" ? 52 : 74,
      evidence: alert.evidence,
      actionLabel: "Review finance context",
      source: alert.source,
    });
  }

  for (const bottleneck of params.bottleneckInsights.slice(0, 3)) {
    insights.push({
      id: `insight-${bottleneck.id}`,
      type: "anomaly",
      title: bottleneck.title,
      description: bottleneck.description,
      severity: bottleneck.severity,
      relatedApprovalId: bottleneck.relatedApprovalIds[0],
      score: Math.min(100, bottleneck.count * 20 + bottleneck.averageAgeHours),
      confidence: bottleneck.confidence,
      evidence: bottleneck.evidence,
      actionLabel: "Clear bottleneck",
      source: bottleneck.source,
      auditAware: bottleneck.source === "audit_history",
    });
  }

  if (params.rejected.length > 0) {
    insights.push({
      id: "rec-rejected-review",
      type: "recommendation",
      title: "Review rejected workflows",
      description:
        "Rejected items often lack supporting documents. Require attachment checks before resubmission.",
      severity: "low",
      relatedApprovalId: params.rejected[0]?.approvalId,
      evidence: [`${params.rejected.length} rejected workflow(s)`],
      actionLabel: "Review policy",
      source: "rules_engine",
      auditAware: true,
    });
  }

  if (params.approvalRecommendations.length > 0) {
    const top = params.approvalRecommendations[0];
    insights.push({
      id: "rec-next-best-approval-action",
      type: "recommendation",
      title: `Next best action: ${formatLabel(top.recommendedAction)}`,
      description: `${top.title}: ${top.rationale}`,
      severity: severityFromScore(top.riskScore),
      relatedApprovalId: top.approvalId,
      score: top.riskScore,
      confidence: top.confidence,
      evidence: top.auditSignals,
      actionLabel: "Open approval",
      source: "rules_engine",
      auditAware: top.auditSignals.some((signal) => signal !== "No adverse audit trail detected"),
    });
  }

  for (const suggestion of params.auditAwareSuggestions.slice(0, 2)) {
    insights.push({
      id: `insight-${suggestion.id}`,
      type: "recommendation",
      title: suggestion.title,
      description: suggestion.description,
      severity: suggestion.severity,
      relatedApprovalId: suggestion.relatedApprovalId,
      confidence: 70,
      evidence: suggestion.evidence,
      actionLabel: "Review audit trail",
      source: "audit_history",
      auditAware: true,
    });
  }

  if (failedExecutions.length > 0) {
    insights.push({
      id: "anomaly-failed-executions",
      type: "anomaly",
      title: `${failedExecutions.length} failed workflow execution(s)`,
      description:
        "Failed workflow executions are included in bottleneck scoring for owner follow-up.",
      severity: "medium",
      relatedExecutionId: failedExecutions[0]?.executionId,
      evidence: failedExecutions.slice(0, 3).map((execution) => execution.title),
      actionLabel: "Inspect failures",
      source: "rules_engine",
    });
  }

  return dedupeById(insights).slice(0, 12);
}

function buildWidgets(summary: WorkflowIntelligenceData["summary"]): WorkflowIntelligenceWidget[] {
  return [
    {
      id: "risk-score",
      label: "Max risk score",
      value: String(summary.maxRiskScore),
      detail: `${summary.highRiskApprovals} high-risk approval(s)`,
      severity: severityFromScore(summary.maxRiskScore),
      trend: summary.highRiskApprovals > 0 ? "up" : "neutral",
    },
    {
      id: "sla-prediction",
      label: "SLA breach prediction",
      value: String(summary.predictedSlaBreaches),
      detail: "Predicted breach count",
      severity: summary.predictedSlaBreaches > 0 ? "high" : "low",
      trend: summary.predictedSlaBreaches > 0 ? "up" : "neutral",
    },
    {
      id: "finance-anomalies",
      label: "Finance anomalies",
      value: String(summary.financeAnomalies),
      detail: "Rules-based detections",
      severity: summary.financeAnomalies > 0 ? "medium" : "low",
      trend: summary.financeAnomalies > 0 ? "up" : "neutral",
    },
    {
      id: "bottlenecks",
      label: "Bottlenecks",
      value: String(summary.bottleneckInsights),
      detail: "Queue concentration signals",
      severity: summary.bottleneckInsights > 0 ? "medium" : "low",
      trend: summary.bottleneckInsights > 0 ? "up" : "neutral",
    },
    {
      id: "priority-recs",
      label: "Priority recommendations",
      value: String(summary.priorityRecommendations),
      detail: "Predicted re-prioritizations",
      severity: summary.priorityRecommendations > 0 ? "medium" : "low",
      trend: summary.priorityRecommendations > 0 ? "up" : "neutral",
    },
    {
      id: "audit-aware-ai",
      label: "Audit-aware suggestions",
      value: String(summary.auditAwareSuggestions),
      detail: "Using approval audit history",
      severity: summary.auditAwareSuggestions > 0 ? "medium" : "low",
      trend: "neutral",
    },
  ];
}

function recommendationRationale(
  action: AiApprovalRecommendation["recommendedAction"],
  model: ApprovalRiskModel,
): string {
  switch (action) {
    case "approve":
      return "Low risk score and no blocking audit signals detected.";
    case "review":
      return `Manual review recommended because risk score is ${model.riskScore}.`;
    case "escalate":
      return "SLA window is tight; route to senior approver to avoid breach.";
    case "request_evidence":
      return "Risk score is high enough to require supporting evidence before action.";
  }
}

function recommendationSafeguards(
  action: AiApprovalRecommendation["recommendedAction"],
  model: ApprovalRiskModel,
): string[] {
  if (action === "approve") {
    return ["Verify requester and amount", "Keep audit trail attached"];
  }
  if (action === "escalate") {
    return ["Notify senior approver", "Preserve original assignment history"];
  }
  if (action === "request_evidence") {
    return ["Require invoice/receipt attachment", "Verify vendor and GST details"];
  }
  return model.auditSignals.length > 0
    ? ["Review audit trail", "Check approval comments"]
    : ["Validate business justification", "Confirm budget availability"];
}

function groupAuditByApprovalId(
  auditLogs: AuditSignalInput[],
): Map<string, AuditSignalInput[]> {
  const map = new Map<string, AuditSignalInput[]>();
  for (const log of auditLogs) {
    const approvalId = log.resourceId ?? stringFromRecord(log.metadata, "approvalId");
    if (!approvalId) continue;
    const list = map.get(approvalId) ?? [];
    list.push(log);
    map.set(approvalId, list);
  }
  return map;
}

function numberFromMetadata(
  metadata: Record<string, unknown> | undefined,
  key: string,
): number | null {
  const value = metadata?.[key];
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim().length > 0) {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : null;
  }
  return null;
}

function stringFromRecord(value: unknown, key: string): string | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const field = (value as Record<string, unknown>)[key];
  return typeof field === "string" && field.length > 0 ? field : null;
}

function severityFromScore(score: number): AiInsightSeverity {
  if (score >= 88) return "critical";
  if (score >= 70) return "high";
  if (score >= 45) return "medium";
  return "low";
}

function confidenceFromEvidence(evidenceCount: number, auditSignalCount: number): number {
  return clamp(58 + evidenceCount * 5 + auditSignalCount * 4, 55, 92);
}

function scoreFromAmount(amountInr: number): number {
  if (amountInr >= 5_000_000) return 95;
  if (amountInr >= 1_000_000) return 82;
  if (amountInr >= 500_000) return 68;
  return 45;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function averageAgeHours(isoDates: string[], now: Date): number {
  if (isoDates.length === 0) return 0;
  const hours = isoDates.map((iso) =>
    Math.max(0, (now.getTime() - new Date(iso).getTime()) / 3_600_000),
  );
  return Math.round(average(hours) * 10) / 10;
}

function formatAgeHours(hours: number): string {
  if (hours < 1) return "<1h";
  if (hours < 24) return `${Math.round(hours)}h`;
  return `${Math.round(hours / 24)}d`;
}

function countAuditSignals(models: ApprovalRiskModel[]): number {
  return models.reduce((sum, model) => sum + model.auditSignals.length, 0);
}

function approvalIdsForModels(models: ApprovalRiskModel[]): string[] {
  return unique(
    models
      .map((model) => model.item.approvalId)
      .filter((value): value is string => Boolean(value)),
  );
}

function severityWeight(severity: AiInsightSeverity): number {
  switch (severity) {
    case "critical":
      return 4;
    case "high":
      return 3;
    case "medium":
      return 2;
    case "low":
      return 1;
  }
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function dedupeById<T extends { id: string }>(items: T[]): T[] {
  const map = new Map<string, T>();
  for (const item of items) {
    if (!map.has(item.id)) {
      map.set(item.id, item);
    }
  }
  return [...map.values()];
}

function formatLabel(value: string): string {
  return value
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

function formatInr(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}
