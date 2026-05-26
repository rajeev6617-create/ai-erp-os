import type { OperationModuleCode } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import type {
  OperationFinanceSummary,
  OperationModuleDashboardData,
  OperationModuleNavItem,
  OperationModuleSlug,
  OperationRiskAlert,
} from "@/lib/operations/types";

const MODULES: Array<{
  slug: OperationModuleSlug;
  code: OperationModuleCode;
  label: string;
}> = [
  { slug: "p2p", code: "P2P", label: "P2P" },
  { slug: "otc", code: "OTC", label: "OTC" },
  { slug: "r2r", code: "R2R", label: "R2R" },
  { slug: "users", code: "USER_OPERATIONS", label: "Users" },
];

export const operationModuleNav: OperationModuleNavItem[] = MODULES.map((item) => ({
  slug: item.slug,
  label: item.label,
  href: `/dashboard/operations/${item.slug}`,
}));

export function operationCodeForSlug(
  slug: OperationModuleSlug,
): OperationModuleCode {
  return MODULES.find((item) => item.slug === slug)?.code ?? "P2P";
}

export async function getOperationModuleDashboard(
  organizationId: string,
  slug: OperationModuleSlug,
): Promise<OperationModuleDashboardData | null> {
  const code = operationCodeForSlug(slug);
  const operationModule = await prisma.operationModule.findFirst({
    where: { organizationId, code, deletedAt: null },
    include: {
      stages: {
        orderBy: { sequence: "asc" },
      },
      records: {
        include: {
          stage: {
            select: { stageKey: true, name: true },
          },
        },
        orderBy: [{ dueAt: "asc" }, { updatedAt: "desc" }],
        take: 50,
      },
      approvalFlows: {
        where: { isActive: true },
        orderBy: { sequence: "asc" },
      },
      riskAlerts: {
        where: { status: "OPEN" },
        include: {
          record: {
            select: { reference: true },
          },
        },
        orderBy: { detectedAt: "desc" },
        take: 20,
      },
      financeImpacts: {
        include: {
          record: {
            select: { reference: true },
          },
        },
        orderBy: { recognizedAt: "desc" },
        take: 50,
      },
      auditEvents: {
        include: {
          record: {
            select: { reference: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 12,
      },
    },
  });

  if (!operationModule) return null;

  const records = operationModule.records.map((record) => ({
    id: record.id,
    reference: record.reference,
    title: record.title,
    description: record.description,
    status: record.status,
    amount: decimalToNumberOrNull(record.amount),
    currency: record.currency,
    counterparty: record.counterparty,
    ownerRole: record.ownerRole,
    dueAt: record.dueAt?.toISOString() ?? null,
    completedAt: record.completedAt?.toISOString() ?? null,
    riskScore: record.riskScore,
    stageName: record.stage?.name ?? null,
    stageKey: record.stage?.stageKey ?? null,
  }));
  const riskAlerts = operationModule.riskAlerts
    .map((alert): OperationRiskAlert => ({
      id: alert.id,
      title: alert.title,
      description: alert.description,
      severity: alert.severity,
      status: alert.status,
      signalType: alert.signalType,
      confidence: decimalToNumberOrNull(alert.confidence),
      detectedAt: alert.detectedAt.toISOString(),
      recordReference: alert.record?.reference ?? null,
    }))
    .sort((a, b) => severityRank(b.severity) - severityRank(a.severity));
  const financeImpacts = operationModule.financeImpacts.map((impact) => ({
    id: impact.id,
    impactType: impact.impactType,
    title: impact.title,
    amount: decimalToNumber(impact.amount),
    currency: impact.currency,
    direction: impact.direction,
    period: impact.period,
    recognizedAt: impact.recognizedAt.toISOString(),
    recordReference: impact.record?.reference ?? null,
  }));
  const financeSummary = summarizeFinanceImpacts(financeImpacts);
  const completedStages = operationModule.stages.filter(
    (stage) => stage.status === "COMPLETED",
  ).length;
  const openRecords = records.filter((record) =>
    ["OPEN", "BLOCKED", "EXCEPTION"].includes(record.status),
  ).length;
  const waitingApprovals = records.filter(
    (record) => record.status === "WAITING_APPROVAL",
  ).length;
  const highRiskAlerts = riskAlerts.filter((alert) =>
    ["HIGH", "CRITICAL"].includes(alert.severity),
  ).length;

  return {
    nav: operationModuleNav,
    activeSlug: slug,
    module: {
      id: operationModule.id,
      code: operationModule.code,
      name: operationModule.name,
      description: operationModule.description,
      ownerRole: operationModule.ownerRole,
      financeCategory: operationModule.financeCategory,
    },
    kpis: {
      totalRecords: records.length,
      openRecords,
      waitingApprovals,
      exceptionRecords: records.filter((record) => record.status === "EXCEPTION").length,
      stageCompletionPercent:
        operationModule.stages.length > 0
          ? Math.round((completedStages / operationModule.stages.length) * 100)
          : 0,
      activeRiskAlerts: riskAlerts.length,
      highRiskAlerts,
      financeExposure:
        financeSummary.outflow + financeSummary.inflow + financeSummary.neutralExposure,
    },
    stages: operationModule.stages.map((stage) => ({
      id: stage.id,
      key: stage.stageKey,
      name: stage.name,
      description: stage.description,
      sequence: stage.sequence,
      status: stage.status,
      slaHours: stage.slaHours,
      automationLevel: stage.automationLevel,
    })),
    records,
    approvalFlows: operationModule.approvalFlows.map((flow) => ({
      id: flow.id,
      name: flow.name,
      description: flow.description,
      trigger: flow.trigger,
      sequence: flow.sequence,
      approverRole: flow.approverRole,
      approvalType: flow.approvalType,
      thresholdAmount: decimalToNumberOrNull(flow.thresholdAmount),
      isActive: flow.isActive,
    })),
    riskAlerts,
    financeSummary,
    financeImpacts,
    auditEvents: operationModule.auditEvents.map((event) => ({
      id: event.id,
      action: event.action,
      actor: event.actor,
      severity: event.severity,
      createdAt: event.createdAt.toISOString(),
      recordReference: event.record?.reference ?? null,
      details: isRecord(event.details) ? event.details : null,
    })),
  };
}

function summarizeFinanceImpacts(
  impacts: OperationModuleDashboardData["financeImpacts"],
): OperationFinanceSummary {
  const byType = new Map<string, { amount: number; direction: string }>();
  let inflow = 0;
  let outflow = 0;
  let neutralExposure = 0;

  for (const impact of impacts) {
    if (impact.direction === "INFLOW") inflow += impact.amount;
    if (impact.direction === "OUTFLOW") outflow += impact.amount;
    if (impact.direction === "NEUTRAL") neutralExposure += Math.abs(impact.amount);

    const current = byType.get(impact.impactType) ?? {
      amount: 0,
      direction: impact.direction,
    };
    current.amount += impact.amount;
    byType.set(impact.impactType, current);
  }

  return {
    inflow,
    outflow,
    neutralExposure,
    netImpact: inflow - outflow,
    byType: [...byType.entries()].map(([impactType, value]) => ({
      impactType,
      amount: value.amount,
      direction: value.direction,
    })),
  };
}

function severityRank(severity: OperationRiskAlert["severity"]): number {
  return {
    LOW: 1,
    MEDIUM: 2,
    HIGH: 3,
    CRITICAL: 4,
  }[severity];
}

function decimalToNumber(value: unknown): number {
  return decimalToNumberOrNull(value) ?? 0;
}

function decimalToNumberOrNull(value: unknown): number | null {
  if (value == null) return null;
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value) || 0;
  if (typeof value === "object" && "toString" in value) {
    const parsed = Number(value.toString());
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
