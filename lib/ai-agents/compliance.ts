import { prisma } from "@/lib/db/prisma";
import {
  auditAiInsightGeneration,
  buildAgentMetadata,
  daysUntil,
  decimalToNumber,
  formatInr,
  insight,
} from "@/lib/ai-agents/shared";
import type {
  AiAgentInsight,
  AiAgentRequestContext,
  ComplianceAiAgentResult,
} from "@/lib/ai-agents/types";

export async function generateComplianceAiAgentInsights(
  context: AiAgentRequestContext,
): Promise<ComplianceAiAgentResult> {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const nextThirtyDays = new Date(now);
  nextThirtyDays.setDate(now.getDate() + 30);

  const [invoiceTaxAgg, expenseTaxAgg, activeTaxConfigs, expiringTaxConfigs, assessments] =
    await Promise.all([
      prisma.invoice.aggregate({
        where: { organizationId: context.organizationId, issueDate: { gte: monthStart } },
        _sum: {
          cgstAmount: true,
          sgstAmount: true,
          igstAmount: true,
          cessAmount: true,
          tdsAmount: true,
        },
      }),
      prisma.expense.aggregate({
        where: {
          organizationId: context.organizationId,
          deletedAt: null,
          expenseDate: { gte: monthStart },
        },
        _sum: { gstAmount: true, tdsAmount: true },
      }),
      prisma.taxConfiguration.count({
        where: {
          organizationId: context.organizationId,
          isActive: true,
          effectiveFrom: { lte: now },
          OR: [{ effectiveTo: null }, { effectiveTo: { gte: now } }],
        },
      }),
      prisma.taxConfiguration.findMany({
        where: {
          organizationId: context.organizationId,
          isActive: true,
          effectiveTo: { gte: now, lte: nextThirtyDays },
        },
        orderBy: { effectiveTo: "asc" },
        take: 8,
      }),
      prisma.complianceAssessment.findMany({
        where: {
          organizationId: context.organizationId,
          status: { in: ["NOT_STARTED", "IN_PROGRESS", "NON_COMPLIANT"] },
        },
        include: {
          framework: { select: { code: true, name: true } },
          requirement: { select: { code: true, title: true, dueDay: true, frequency: true } },
          evidence: { select: { id: true } },
        },
        orderBy: { periodEnd: "asc" },
        take: 12,
      }),
    ]);

  const gstLiability =
    decimalToNumber(invoiceTaxAgg._sum.cgstAmount) +
    decimalToNumber(invoiceTaxAgg._sum.sgstAmount) +
    decimalToNumber(invoiceTaxAgg._sum.igstAmount) +
    decimalToNumber(invoiceTaxAgg._sum.cessAmount) -
    decimalToNumber(invoiceTaxAgg._sum.tdsAmount) -
    decimalToNumber(expenseTaxAgg._sum.gstAmount);
  const tdsPayable =
    decimalToNumber(invoiceTaxAgg._sum.tdsAmount) +
    decimalToNumber(expenseTaxAgg._sum.tdsAmount);

  const result: ComplianceAiAgentResult = {
    metadata: buildAgentMetadata("compliance"),
    gstTdsReminderInsights: buildGstTdsReminderInsights({
      gstLiability,
      tdsPayable,
      activeTaxConfigs,
    }),
    filingRiskAlerts: buildFilingRiskAlerts({
      gstLiability,
      tdsPayable,
      activeTaxConfigs,
      assessments,
    }),
    statutoryDeadlineWarnings: buildStatutoryDeadlineWarnings({
      gstLiability,
      tdsPayable,
      assessments,
      expiringTaxConfigs,
    }),
  };

  const insights = flattenComplianceInsights(result);
  await auditAiInsightGeneration({
    context,
    agent: "compliance",
    insights,
    categories: {
      gstTdsReminderInsights: result.gstTdsReminderInsights.length,
      filingRiskAlerts: result.filingRiskAlerts.length,
      statutoryDeadlineWarnings: result.statutoryDeadlineWarnings.length,
    },
  });

  return result;
}

function buildGstTdsReminderInsights(params: {
  gstLiability: number;
  tdsPayable: number;
  activeTaxConfigs: number;
}): AiAgentInsight[] {
  const gstDue = nextMonthlyDueDate(20);
  const tdsDue = nextMonthlyDueDate(7);

  return [
    insight({
      id: "compliance-gst-reminder",
      title: "GST filing reminder",
      description:
        params.gstLiability > 0
          ? `Estimated net GST payable is ${formatInr(params.gstLiability)} for the current month.`
          : "Current-month GST input and output tax do not show a payable position.",
      severity: params.gstLiability > 1_000_000 ? "high" : params.gstLiability > 0 ? "medium" : "low",
      confidence: 82,
      evidence: [
        `Next GST due date ${formatDate(gstDue)}`,
        `${params.activeTaxConfigs} active tax configuration(s)`,
      ],
      recommendation: "Prepare GSTR-1 and GSTR-3B review packs before the due date.",
    }),
    insight({
      id: "compliance-tds-reminder",
      title: "TDS deposit reminder",
      description:
        params.tdsPayable > 0
          ? `Estimated TDS payable is ${formatInr(params.tdsPayable)} for the current month.`
          : "No TDS payable amount is visible in current-month invoice and expense data.",
      severity: params.tdsPayable > 500_000 ? "high" : params.tdsPayable > 0 ? "medium" : "low",
      confidence: 80,
      evidence: [`Next TDS due date ${formatDate(tdsDue)}`],
      recommendation: "Reconcile TDS payable with ledger balances before deposit.",
    }),
  ];
}

function buildFilingRiskAlerts(params: {
  gstLiability: number;
  tdsPayable: number;
  activeTaxConfigs: number;
  assessments: AssessmentRow[];
}): AiAgentInsight[] {
  const alerts: AiAgentInsight[] = [];
  const nonCompliant = params.assessments.filter((assessment) => assessment.status === "NON_COMPLIANT");
  const noEvidence = params.assessments.filter((assessment) => assessment.evidence.length === 0);

  if (params.activeTaxConfigs === 0) {
    alerts.push(
      insight({
        id: "compliance-no-active-tax-config",
        title: "No active tax configuration",
        description: "GST/TDS reminders may be incomplete because no active tax configuration was found.",
        severity: "critical",
        confidence: 88,
        evidence: ["0 active tax configurations"],
        recommendation: "Configure active GST/TDS tax rules before filing preparation.",
      }),
    );
  }

  if (params.gstLiability > 1_000_000 || params.tdsPayable > 500_000) {
    alerts.push(
      insight({
        id: "compliance-high-statutory-payable",
        title: "High statutory payable exposure",
        description: "Current statutory payable exposure is high enough to require CFO and compliance review.",
        severity: "high",
        confidence: 83,
        evidence: [
          `GST ${formatInr(params.gstLiability)}`,
          `TDS ${formatInr(params.tdsPayable)}`,
        ],
        recommendation: "Confirm liability calculations and payment approvals before deadline week.",
      }),
    );
  }

  if (nonCompliant.length > 0 || noEvidence.length > 0) {
    alerts.push(
      insight({
        id: "compliance-assessment-filing-risk",
        title: "Compliance assessment filing risk",
        description: `${nonCompliant.length} non-compliant assessment(s) and ${noEvidence.length} assessment(s) without evidence may affect filing readiness.`,
        severity: nonCompliant.length > 0 ? "high" : "medium",
        confidence: 81,
        evidence: params.assessments
          .slice(0, 3)
          .map((item) => `${item.framework.code}: ${item.requirement?.title ?? item.framework.name}`),
        recommendation: "Close evidence gaps before the filing period is marked ready.",
      }),
    );
  }

  return alerts.length > 0
    ? alerts
    : [
        insight({
          id: "compliance-filing-risk-clear",
          title: "No immediate filing risk detected",
          description: "Statutory payable, assessment, and evidence signals are within normal monitoring range.",
          severity: "low",
          confidence: 75,
          evidence: ["No high exposure or missing evidence filing alert"],
          recommendation: "Keep the monthly compliance calendar active.",
        }),
      ];
}

function buildStatutoryDeadlineWarnings(params: {
  gstLiability: number;
  tdsPayable: number;
  assessments: AssessmentRow[];
  expiringTaxConfigs: Array<{ name: string; taxType: string; effectiveTo: Date | null }>;
}): AiAgentInsight[] {
  const gstDue = nextMonthlyDueDate(20);
  const tdsDue = nextMonthlyDueDate(7);
  const warnings: AiAgentInsight[] = [
    deadlineInsight({
      id: "compliance-gst-deadline",
      title: "GST statutory deadline",
      dueDate: gstDue,
      amount: params.gstLiability,
      recommendation: "Assign owner for GST return review and payment approval.",
    }),
    deadlineInsight({
      id: "compliance-tds-deadline",
      title: "TDS statutory deadline",
      dueDate: tdsDue,
      amount: params.tdsPayable,
      recommendation: "Validate challan readiness and ledger reconciliation.",
    }),
  ];

  const upcomingAssessments = params.assessments.filter((assessment) => daysUntil(assessment.periodEnd) <= 15);
  if (upcomingAssessments.length > 0) {
    warnings.push(
      insight({
        id: "compliance-assessment-deadlines",
        title: "Compliance assessment deadline warning",
        description: `${upcomingAssessments.length} open assessment(s) end within 15 days.`,
        severity: upcomingAssessments.some((assessment) => daysUntil(assessment.periodEnd) < 0)
          ? "high"
          : "medium",
        confidence: 79,
        evidence: upcomingAssessments
          .slice(0, 3)
          .map((item) => `${item.framework.code} ends ${formatDate(item.periodEnd)}`),
        recommendation: "Attach evidence and complete assessment review before period close.",
      }),
    );
  }

  if (params.expiringTaxConfigs.length > 0) {
    warnings.push(
      insight({
        id: "compliance-tax-config-expiry",
        title: "Tax configuration expiry warning",
        description: `${params.expiringTaxConfigs.length} active tax configuration(s) expire within 30 days.`,
        severity: "medium",
        confidence: 77,
        evidence: params.expiringTaxConfigs
          .slice(0, 3)
          .map((config) => `${config.taxType}: ${config.name}`),
        recommendation: "Review and extend expiring tax configurations before transaction posting is affected.",
      }),
    );
  }

  return warnings;
}

function deadlineInsight(params: {
  id: string;
  title: string;
  dueDate: Date;
  amount: number;
  recommendation: string;
}): AiAgentInsight {
  const days = daysUntil(params.dueDate);
  return insight({
    id: params.id,
    title: params.title,
    description: `${params.title} is due on ${formatDate(params.dueDate)} (${days} day(s) remaining).`,
    severity: days <= 3 && params.amount > 0 ? "high" : days <= 10 && params.amount > 0 ? "medium" : "low",
    confidence: 78,
    evidence: [`Amount watched ${formatInr(params.amount)}`, `${days} day(s) to due date`],
    recommendation: params.recommendation,
  });
}

function nextMonthlyDueDate(day: number): Date {
  const now = new Date();
  const due = new Date(now.getFullYear(), now.getMonth(), day);
  if (due < now) {
    return new Date(now.getFullYear(), now.getMonth() + 1, day);
  }
  return due;
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(date);
}

type AssessmentRow = {
  status: string;
  periodEnd: Date;
  framework: { code: string; name: string };
  requirement: { code: string; title: string; dueDay: number | null; frequency: string | null } | null;
  evidence: Array<{ id: string }>;
};

function flattenComplianceInsights(result: ComplianceAiAgentResult): AiAgentInsight[] {
  return [
    ...result.gstTdsReminderInsights,
    ...result.filingRiskAlerts,
    ...result.statutoryDeadlineWarnings,
  ];
}
