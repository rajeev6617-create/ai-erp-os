import { prisma } from "@/lib/db/prisma";
import {
  auditAiInsightGeneration,
  buildAgentMetadata,
  decimalToNumber,
  formatInr,
  insight,
} from "@/lib/ai-agents/shared";
import type {
  AiAgentInsight,
  AiAgentRequestContext,
  AuditorAiAgentResult,
} from "@/lib/ai-agents/types";

export async function generateAuditorAiAgentInsights(
  context: AiAgentRequestContext,
): Promise<AuditorAiAgentResult> {
  const since = new Date();
  since.setDate(since.getDate() - 14);

  const [auditLogs, approvals, expensesMissingReceipts, taxInvoicesMissingIrn, assessments] =
    await Promise.all([
      prisma.auditLog.findMany({
        where: { organizationId: context.organizationId, createdAt: { gte: since } },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      prisma.approval.findMany({
        where: {
          organizationId: context.organizationId,
          status: { in: ["PENDING", "REJECTED", "ESCALATED"] },
        },
        include: {
          requester: { select: { id: true, email: true, firstName: true, lastName: true } },
          steps: { include: { assignee: { select: { id: true, email: true } } } },
        },
        orderBy: { updatedAt: "desc" },
        take: 80,
      }),
      prisma.expense.findMany({
        where: {
          organizationId: context.organizationId,
          deletedAt: null,
          receiptDocId: null,
          status: { not: "DRAFT" },
        },
        orderBy: { expenseDate: "desc" },
        take: 10,
      }),
      prisma.invoice.findMany({
        where: {
          organizationId: context.organizationId,
          invoiceType: "TAX_INVOICE",
          status: { in: ["ISSUED", "SENT", "PARTIALLY_PAID", "PAID"] },
          OR: [{ irn: null }, { ackNumber: null }],
        },
        orderBy: { issueDate: "desc" },
        take: 10,
      }),
      prisma.complianceAssessment.findMany({
        where: {
          organizationId: context.organizationId,
          status: { in: ["NOT_STARTED", "IN_PROGRESS", "NON_COMPLIANT"] },
        },
        include: {
          framework: { select: { code: true, name: true } },
          requirement: { select: { code: true, title: true } },
          evidence: { select: { id: true } },
        },
        orderBy: { periodEnd: "asc" },
        take: 12,
      }),
    ]);

  const result: AuditorAiAgentResult = {
    metadata: buildAgentMetadata("auditor"),
    auditTrailReview: buildAuditTrailReview(auditLogs),
    unusualApprovalActivity: buildUnusualApprovalActivity(approvals, auditLogs),
    complianceRiskSignals: buildComplianceRiskSignals(assessments, auditLogs),
    missingDocumentationAlerts: buildMissingDocumentationAlerts(
      expensesMissingReceipts,
      taxInvoicesMissingIrn,
      assessments,
    ),
  };

  const insights = flattenAuditorInsights(result);
  await auditAiInsightGeneration({
    context,
    agent: "auditor",
    insights,
    categories: {
      auditTrailReview: result.auditTrailReview.length,
      unusualApprovalActivity: result.unusualApprovalActivity.length,
      complianceRiskSignals: result.complianceRiskSignals.length,
      missingDocumentationAlerts: result.missingDocumentationAlerts.length,
    },
  });

  return result;
}

function buildAuditTrailReview(
  auditLogs: Array<{ action: string; severity: string; resource: string; createdAt: Date }>,
): AiAgentInsight[] {
  const warningLogs = auditLogs.filter((log) => ["WARNING", "CRITICAL"].includes(log.severity));
  const approvalAuditCount = auditLogs.filter((log) => log.resource === "approval").length;

  return [
    insight({
      id: "auditor-trail-review",
      title:
        warningLogs.length > 0
          ? "Warning audit events require review"
          : "Audit trail coverage is stable",
      description: `${auditLogs.length} audit event(s) reviewed across the last 14 days, including ${approvalAuditCount} approval event(s).`,
      severity: warningLogs.some((log) => log.severity === "CRITICAL")
        ? "critical"
        : warningLogs.length > 0
          ? "medium"
          : "low",
      confidence: 84,
      evidence:
        warningLogs.length > 0
          ? warningLogs.slice(0, 3).map((log) => `${log.action} on ${log.resource}`)
          : ["No warning or critical audit event in reviewed window"],
      recommendation:
        warningLogs.length > 0
          ? "Review warning audit entries before approving bulk workflow actions."
          : "Keep current audit retention and approval evidence controls active.",
    }),
  ];
}

function buildUnusualApprovalActivity(
  approvals: Array<{
    id: string;
    title: string;
    status: string;
    requesterId: string;
    requester: { email: string; firstName: string | null; lastName: string | null };
    steps: Array<{ assigneeId: string | null }>;
  }>,
  auditLogs: Array<{ action: string; severity: string; resourceId: string | null }>,
): AiAgentInsight[] {
  const rejectedOrEscalated = approvals.filter((approval) =>
    ["REJECTED", "ESCALATED"].includes(approval.status),
  );
  const requesterMap = new Map<string, number>();
  for (const approval of approvals.filter((item) => item.status === "PENDING")) {
    requesterMap.set(approval.requesterId, (requesterMap.get(approval.requesterId) ?? 0) + 1);
  }
  const repeatedRequester = [...requesterMap.entries()].find(([, count]) => count >= 3);
  const adverseAuditCount = auditLogs.filter((log) =>
    /reject|escalat|clarification|forbidden|failed/i.test(log.action),
  ).length;

  if (rejectedOrEscalated.length === 0 && !repeatedRequester && adverseAuditCount === 0) {
    return [
      insight({
        id: "auditor-approval-activity-clear",
        title: "Approval activity within expected range",
        description: "No repeated requester concentration, escalation cluster, or adverse approval audit signal was detected.",
        severity: "low",
        confidence: 76,
        evidence: [`${approvals.length} active or recently adverse approval(s) reviewed`],
        recommendation: "Continue monitoring requester concentration and escalation clusters.",
      }),
    ];
  }

  const items: AiAgentInsight[] = [];
  if (rejectedOrEscalated.length > 0) {
    items.push(
      insight({
        id: "auditor-rejected-escalated-cluster",
        title: "Rejected or escalated approval cluster",
        description: `${rejectedOrEscalated.length} approval(s) are rejected or escalated and should be reviewed for process exceptions.`,
        severity: rejectedOrEscalated.length > 3 ? "high" : "medium",
        confidence: 82,
        evidence: rejectedOrEscalated.slice(0, 3).map((approval) => approval.title),
        recommendation: "Sample the latest rejected or escalated approvals and validate approval comments.",
      }),
    );
  }
  if (repeatedRequester) {
    items.push(
      insight({
        id: "auditor-requester-concentration",
        title: "Requester concentration detected",
        description: `One requester has ${repeatedRequester[1]} pending approval(s), increasing segregation-of-duties review priority.`,
        severity: "medium",
        confidence: 79,
        evidence: [`Requester ${repeatedRequester[0]} has repeated pending approvals`],
        recommendation: "Check requester and approver independence before final approval.",
      }),
    );
  }
  if (adverseAuditCount > 0) {
    items.push(
      insight({
        id: "auditor-adverse-approval-audit",
        title: "Adverse approval audit signals",
        description: `${adverseAuditCount} approval-related adverse audit signal(s) were found in the reviewed window.`,
        severity: adverseAuditCount > 4 ? "high" : "medium",
        confidence: 81,
        evidence: [`${adverseAuditCount} adverse audit event(s)`],
        recommendation: "Review adverse approval events before closing the audit period.",
      }),
    );
  }

  return items;
}

function buildComplianceRiskSignals(
  assessments: Array<{
    status: string;
    periodEnd: Date;
    framework: { code: string; name: string };
    requirement: { code: string; title: string } | null;
  }>,
  auditLogs: Array<{ action: string; resource: string; severity: string }>,
): AiAgentInsight[] {
  const nonCompliant = assessments.filter((assessment) => assessment.status === "NON_COMPLIANT");
  const warningComplianceAudits = auditLogs.filter(
    (log) => log.resource === "compliance" && ["WARNING", "CRITICAL"].includes(log.severity),
  );

  if (nonCompliant.length === 0 && warningComplianceAudits.length === 0) {
    return [
      insight({
        id: "auditor-compliance-risk-clear",
        title: "No high-risk compliance audit signal",
        description: "Compliance assessments and audit events do not show a high-risk exception cluster.",
        severity: "low",
        confidence: 74,
        evidence: [`${assessments.length} open assessment(s) reviewed`],
        recommendation: "Keep evidence collection on schedule for in-progress controls.",
      }),
    ];
  }

  return [
    insight({
      id: "auditor-compliance-risk-signal",
      title: "Compliance risk signal requires audit review",
      description: `${nonCompliant.length} non-compliant assessment(s) and ${warningComplianceAudits.length} warning audit event(s) were detected.`,
      severity: nonCompliant.length > 0 ? "high" : "medium",
      confidence: 83,
      evidence: [
        ...nonCompliant.slice(0, 2).map((item) => `${item.framework.code}: ${item.requirement?.title ?? item.framework.name}`),
        ...warningComplianceAudits.slice(0, 2).map((item) => item.action),
      ],
      recommendation: "Open an audit review for the affected compliance framework before period close.",
    }),
  ];
}

function buildMissingDocumentationAlerts(
  expenses: Array<{ expenseNumber: string; amount: unknown; category: string }>,
  invoices: Array<{ invoiceNumber: string; totalAmount: unknown; irn: string | null; ackNumber: string | null }>,
  assessments: Array<{
    framework: { code: string; name: string };
    requirement: { code: string; title: string } | null;
    evidence: Array<{ id: string }>;
  }>,
): AiAgentInsight[] {
  const missingAssessmentEvidence = assessments.filter((assessment) => assessment.evidence.length === 0);
  const alerts: AiAgentInsight[] = [];

  if (expenses.length > 0) {
    alerts.push(
      insight({
        id: "auditor-missing-expense-receipts",
        title: "Expense receipts missing",
        description: `${expenses.length} non-draft expense(s) are missing receipt documentation.`,
        severity: expenses.length > 5 ? "high" : "medium",
        confidence: 86,
        evidence: expenses
          .slice(0, 3)
          .map((expense) => `${expense.expenseNumber} ${formatInr(decimalToNumber(expense.amount))}`),
        recommendation: "Request receipt uploads before expense reimbursement or audit closure.",
      }),
    );
  }

  if (invoices.length > 0) {
    alerts.push(
      insight({
        id: "auditor-missing-invoice-statutory-docs",
        title: "Tax invoice statutory fields missing",
        description: `${invoices.length} posted tax invoice(s) are missing IRN or acknowledgement details.`,
        severity: invoices.length > 3 ? "high" : "medium",
        confidence: 84,
        evidence: invoices.slice(0, 3).map((invoice) => invoice.invoiceNumber),
        recommendation: "Attach e-invoice acknowledgement details or document the statutory exception.",
      }),
    );
  }

  if (missingAssessmentEvidence.length > 0) {
    alerts.push(
      insight({
        id: "auditor-missing-compliance-evidence",
        title: "Compliance evidence missing",
        description: `${missingAssessmentEvidence.length} active compliance assessment(s) have no evidence attached.`,
        severity: "medium",
        confidence: 80,
        evidence: missingAssessmentEvidence
          .slice(0, 3)
          .map((item) => `${item.framework.code}: ${item.requirement?.title ?? item.framework.name}`),
        recommendation: "Collect evidence before marking assessments compliant.",
      }),
    );
  }

  return alerts.length > 0
    ? alerts
    : [
        insight({
          id: "auditor-documentation-clear",
          title: "Required documentation appears complete",
          description: "No missing receipt, statutory invoice, or compliance evidence alert was detected.",
          severity: "low",
          confidence: 73,
          evidence: ["Documentation checks returned no active exception"],
          recommendation: "Continue evidence sampling on the normal audit cadence.",
        }),
      ];
}

function flattenAuditorInsights(result: AuditorAiAgentResult): AiAgentInsight[] {
  return [
    ...result.auditTrailReview,
    ...result.unusualApprovalActivity,
    ...result.complianceRiskSignals,
    ...result.missingDocumentationAlerts,
  ];
}
