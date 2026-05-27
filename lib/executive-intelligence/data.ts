import type { ExecutiveAudience as PrismaExecutiveAudience } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import type {
  BoardMisSnapshotView,
  ExecutiveAnomalyView,
  ExecutiveAuditView,
  ExecutiveAudienceSlug,
  ExecutiveCopilotView,
  ExecutiveDashboardData,
  ExecutiveForecastView,
  ExecutiveKpiView,
  ExecutiveNavItem,
  StrategicInsightView,
} from "@/lib/executive-intelligence/types";

export const executiveNav: ExecutiveNavItem[] = [
  { slug: "ceo", label: "CEO", href: "/dashboard/executive/ceo" },
  { slug: "cfo", label: "CFO", href: "/dashboard/executive/cfo" },
  { slug: "board", label: "Board MIS", href: "/dashboard/executive/board" },
];

export async function getExecutiveDashboard(
  organizationId: string,
  slug: ExecutiveAudienceSlug,
): Promise<ExecutiveDashboardData> {
  const audience = audienceForSlug(slug);
  const [
    kpis,
    forecasts,
    anomalies,
    copilots,
    strategicInsights,
    boardPacks,
    auditLogs,
  ] = await Promise.all([
    prisma.executiveKpi.findMany({
      where: { organizationId, audience },
      orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }],
      take: 12,
    }),
    prisma.executiveForecast.findMany({
      where: { organizationId, audience },
      orderBy: [{ riskLevel: "desc" }, { updatedAt: "desc" }],
      take: 8,
    }),
    prisma.executiveAnomaly.findMany({
      where: { organizationId, audience, status: { in: ["OPEN", "ACKNOWLEDGED"] } },
      orderBy: [{ severity: "desc" }, { detectedAt: "desc" }],
      take: 8,
    }),
    prisma.executiveCopilot.findMany({
      where: { organizationId, audience, status: { in: ["OPEN", "ACKNOWLEDGED"] } },
      orderBy: [{ lastRunAt: "desc" }, { updatedAt: "desc" }],
      take: 4,
    }),
    prisma.executiveStrategicInsight.findMany({
      where: { organizationId, audience, status: { in: ["OPEN", "ACKNOWLEDGED"] } },
      orderBy: [{ priority: "desc" }, { updatedAt: "desc" }],
      take: 8,
    }),
    prisma.boardMisSnapshot.findMany({
      where: { organizationId },
      orderBy: [{ period: "desc" }, { updatedAt: "desc" }],
      take: slug === "board" ? 4 : 1,
    }),
    prisma.auditLog.findMany({
      where: {
        organizationId,
        resource: {
          in: [
            "executive",
            "forecast",
            "anomaly",
            "copilot",
            "strategic_insight",
            "board_mis",
          ],
        },
      },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
  ]);

  const mappedAnomalies = anomalies.map(mapAnomaly);
  const mappedForecasts = forecasts.map(mapForecast);
  const mappedInsights = strategicInsights.map(mapStrategicInsight);
  const highRiskCount =
    mappedAnomalies.filter((item) => isEscalated(item.severity)).length +
    mappedForecasts.filter((item) => isEscalated(item.riskLevel)).length +
    mappedInsights.filter((item) => isEscalated(item.priority)).length;

  return {
    nav: executiveNav,
    activeSlug: slug,
    audience,
    ...copyForSlug(slug),
    summary: {
      kpiCount: kpis.length,
      forecastCount: mappedForecasts.length,
      anomalyCount: mappedAnomalies.length,
      highRiskCount,
      copilotCount: copilots.length,
      strategicInsightCount: mappedInsights.length,
    },
    kpis: kpis.map(mapKpi),
    forecasts: mappedForecasts,
    anomalies: mappedAnomalies,
    copilots: copilots.map(mapCopilot),
    strategicInsights: mappedInsights,
    boardPacks: boardPacks.map(mapBoardPack),
    auditLogs: auditLogs.map(mapAuditLog),
  };
}

function audienceForSlug(slug: ExecutiveAudienceSlug): PrismaExecutiveAudience {
  if (slug === "cfo") return "CFO";
  if (slug === "board") return "BOARD";
  return "CEO";
}

function copyForSlug(slug: ExecutiveAudienceSlug): {
  title: string;
  eyebrow: string;
  description: string;
} {
  if (slug === "cfo") {
    return {
      eyebrow: "Executive intelligence",
      title: "CFO dashboard",
      description:
        "Cash, finance forecasting, anomaly exposure, strategic controls, and CFO copilot actions.",
    };
  }
  if (slug === "board") {
    return {
      eyebrow: "Executive intelligence",
      title: "Board MIS",
      description:
        "Board-ready MIS, enterprise KPIs, predictive risk outlook, governance alerts, and strategic insight.",
    };
  }
  return {
    eyebrow: "Executive intelligence",
    title: "CEO dashboard",
    description:
      "Enterprise KPIs, AI forecasting, anomaly detection, predictive analytics, copilots, and strategic priorities.",
  };
}

function mapKpi(kpi: {
  id: string;
  code: string;
  name: string;
  value: unknown;
  valueText: string | null;
  unit: string | null;
  target: unknown;
  trend: string;
  variancePercent: unknown;
  status: string;
  period: string;
  ownerRole: string | null;
  sortOrder: number;
}): ExecutiveKpiView {
  return {
    id: kpi.id,
    code: kpi.code,
    name: kpi.name,
    value: decimalToNumberOrNull(kpi.value),
    valueText: kpi.valueText,
    unit: kpi.unit,
    target: decimalToNumberOrNull(kpi.target),
    trend: kpi.trend === "up" || kpi.trend === "down" ? kpi.trend : "neutral",
    variancePercent: decimalToNumberOrNull(kpi.variancePercent),
    status: kpi.status,
    period: kpi.period,
    ownerRole: kpi.ownerRole,
    sortOrder: kpi.sortOrder,
  };
}

function mapForecast(forecast: {
  id: string;
  forecastNumber: string;
  title: string;
  metric: string;
  horizon: string;
  baselineValue: unknown;
  predictedValue: unknown;
  confidence: unknown;
  scenario: string;
  driverSummary: string;
  riskLevel: ExecutiveForecastView["riskLevel"];
}): ExecutiveForecastView {
  const baselineValue = decimalToNumber(forecast.baselineValue);
  const predictedValue = decimalToNumber(forecast.predictedValue);
  return {
    id: forecast.id,
    forecastNumber: forecast.forecastNumber,
    title: forecast.title,
    metric: forecast.metric,
    horizon: forecast.horizon,
    baselineValue,
    predictedValue,
    deltaPercent:
      baselineValue !== 0 ? Math.round(((predictedValue - baselineValue) / baselineValue) * 1000) / 10 : 0,
    confidence: decimalToNumberOrNull(forecast.confidence),
    scenario: forecast.scenario,
    driverSummary: forecast.driverSummary,
    riskLevel: forecast.riskLevel,
  };
}

function mapAnomaly(anomaly: {
  id: string;
  source: string;
  title: string;
  description: string;
  severity: ExecutiveAnomalyView["severity"];
  metric: string;
  actualValue: unknown;
  expectedValue: unknown;
  variancePercent: unknown;
  detectedAt: Date;
  status: string;
  recommendedAction: string | null;
}): ExecutiveAnomalyView {
  return {
    id: anomaly.id,
    source: anomaly.source,
    title: anomaly.title,
    description: anomaly.description,
    severity: anomaly.severity,
    metric: anomaly.metric,
    actualValue: decimalToNumberOrNull(anomaly.actualValue),
    expectedValue: decimalToNumberOrNull(anomaly.expectedValue),
    variancePercent: decimalToNumberOrNull(anomaly.variancePercent),
    detectedAt: anomaly.detectedAt.toISOString(),
    status: anomaly.status,
    recommendedAction: anomaly.recommendedAction,
  };
}

function mapCopilot(copilot: {
  id: string;
  slug: string;
  name: string;
  role: string;
  prompt: string;
  summary: string;
  recommendedActions: unknown;
  status: string;
  confidence: unknown;
  lastRunAt: Date | null;
}): ExecutiveCopilotView {
  return {
    id: copilot.id,
    slug: copilot.slug,
    name: copilot.name,
    role: copilot.role,
    prompt: copilot.prompt,
    summary: copilot.summary,
    recommendedActions: stringArray(copilot.recommendedActions),
    status: copilot.status,
    confidence: decimalToNumberOrNull(copilot.confidence),
    lastRunAt: copilot.lastRunAt?.toISOString() ?? null,
  };
}

function mapStrategicInsight(insight: {
  id: string;
  title: string;
  narrative: string;
  impactArea: string;
  priority: StrategicInsightView["priority"];
  confidence: unknown;
  decisionWindow: string | null;
  recommendedAction: string | null;
  status: string;
}): StrategicInsightView {
  return {
    id: insight.id,
    title: insight.title,
    narrative: insight.narrative,
    impactArea: insight.impactArea,
    priority: insight.priority,
    confidence: decimalToNumberOrNull(insight.confidence),
    decisionWindow: insight.decisionWindow,
    recommendedAction: insight.recommendedAction,
    status: insight.status,
  };
}

function mapBoardPack(pack: {
  id: string;
  packNumber: string;
  period: string;
  title: string;
  status: string;
  revenue: unknown;
  ebitda: unknown;
  cashRunwayMonths: unknown;
  riskIndex: number;
  governanceSummary: string;
  createdByRole: string | null;
  approvedAt: Date | null;
  kpiSummary: unknown;
}): BoardMisSnapshotView {
  return {
    id: pack.id,
    packNumber: pack.packNumber,
    period: pack.period,
    title: pack.title,
    status: pack.status,
    revenue: decimalToNumber(pack.revenue),
    ebitda: decimalToNumber(pack.ebitda),
    cashRunwayMonths: decimalToNumberOrNull(pack.cashRunwayMonths),
    riskIndex: pack.riskIndex,
    governanceSummary: pack.governanceSummary,
    createdByRole: pack.createdByRole,
    approvedAt: pack.approvedAt?.toISOString() ?? null,
    kpiSummary: isRecord(pack.kpiSummary) ? pack.kpiSummary : null,
  };
}

function mapAuditLog(log: {
  id: string;
  action: string;
  resource: string;
  severity: string;
  createdAt: Date;
}): ExecutiveAuditView {
  return {
    id: log.id,
    action: log.action,
    resource: log.resource,
    severity: log.severity,
    createdAt: log.createdAt.toISOString(),
  };
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

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function isEscalated(severity: string): boolean {
  return severity === "HIGH" || severity === "CRITICAL";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
