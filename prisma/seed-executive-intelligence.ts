import { Prisma, type PrismaClient } from "../app/generated/prisma/client";

type Audience = "CEO" | "CFO" | "BOARD";
type Severity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

const PERIOD = "May 2026";

const KPI_SEEDS: Array<{
  audience: Audience;
  code: string;
  name: string;
  value: number;
  valueText?: string | null;
  unit: string;
  target: number;
  trend: "up" | "down" | "neutral";
  variancePercent: number;
  status: string;
  ownerRole: string;
  sortOrder: number;
}> = [
  kpi("CEO", "enterprise-growth", "Enterprise growth", 18.4, "%", 16, "up", 2.4, "AHEAD", "ceo", 1),
  kpi("CEO", "operating-margin", "Operating margin", 21.6, "%", 20, "up", 1.6, "AHEAD", "cfo", 2),
  kpi("CEO", "automation-roi", "AI automation ROI", 31.8, "%", 28, "up", 3.8, "AHEAD", "ai-agent", 3),
  kpi("CEO", "enterprise-risk", "Enterprise risk index", 42, "score", 45, "down", -3, "WATCH", "auditor", 4),
  kpi("CFO", "cash-runway", "Cash runway", 8.7, "months", 8, "up", 0.7, "ON_TRACK", "cfo", 1),
  kpi("CFO", "working-capital", "Working capital", 12400000, "INR", 11500000, "up", 7.8, "AHEAD", "finance-manager", 2),
  kpi("CFO", "budget-utilization", "Budget utilization", 72, "%", 75, "neutral", -3, "ON_TRACK", "finance-manager", 3),
  kpi("CFO", "anomaly-exposure", "Anomaly exposure", 3150000, "INR", 2500000, "down", 26, "WATCH", "auditor", 4),
  kpi("BOARD", "governance-readiness", "Governance readiness", 92, "%", 90, "up", 2, "AHEAD", "auditor", 1),
  kpi("BOARD", "strategy-execution", "Strategy execution", 68, "%", 70, "neutral", -2, "WATCH", "ceo", 2),
  kpi("BOARD", "control-health", "Control health", 84, "%", 85, "neutral", -1, "ON_TRACK", "auditor", 3),
  kpi("BOARD", "board-risk-index", "Board risk index", 42, "score", 45, "down", -3, "ON_TRACK", "auditor", 4),
];

const FORECAST_SEEDS = [
  forecast("CEO", "FC-CEO-2605-01", "Revenue forecast", "revenue", "Next quarter", 18400000, 21200000, 86.4, "Base growth", "Pipeline conversion and dispatch recovery lift forecast revenue.", "MEDIUM"),
  forecast("CEO", "FC-CEO-2605-02", "Automation leverage", "automation_roi", "Next 2 quarters", 31.8, 39.5, 82.1, "Productivity upside", "Approval automation and AI exception handling reduce manual cycle time.", "LOW"),
  forecast("CFO", "FC-CFO-2605-01", "Cash runway forecast", "cash_runway_months", "90 days", 8.7, 8.1, 79.8, "Conservative cash", "AP payment timing and overdue collections are the primary drivers.", "MEDIUM"),
  forecast("CFO", "FC-CFO-2605-02", "Collections forecast", "receivable_collection", "30 days", 940000, 710000, 76.3, "Collections recovery", "Customer dispute resolution should reduce overdue exposure.", "HIGH"),
  forecast("BOARD", "FC-BRD-2605-01", "Enterprise risk trajectory", "risk_index", "Board quarter", 42, 38, 81.7, "Risk downtrend", "Quality holds and dispatch exceptions normalize if corrective actions close.", "MEDIUM"),
];

const ANOMALY_SEEDS = [
  anomaly("CEO", "exec:ceo:dispatch-delay", "Supply chain", "Dispatch SLA drift", "Priority dispatch delay could suppress quarterly revenue conversion.", "HIGH", "dispatch_delay_hours", 14, 0, 100, "Escalate carrier assignment and align customer communication."),
  anomaly("CEO", "exec:ceo:quality-yield", "Production", "Quality yield variance", "Sensor rejects are trending above BOM scrap allowance.", "MEDIUM", "scrap_variance_percent", 2.5, 1.2, 108.3, "Review supplier lot and update production promise dates."),
  anomaly("CFO", "exec:cfo:ap-exposure", "Finance", "AP cash concentration", "Weekly vendor payment run concentrates cash outflow into one approval window.", "HIGH", "payment_batch_inr", 2750000, 1900000, 44.7, "Split treasury release and route critical vendors first."),
  anomaly("CFO", "exec:cfo:reconciliation-break", "R2R", "Reconciliation break above materiality", "Unmatched bank statement lines exceed close tolerance.", "CRITICAL", "unreconciled_cash_inr", 315000, 250000, 26, "Block close sign-off until matching evidence is attached."),
  anomaly("BOARD", "exec:board:control-exception", "Controls", "Control exceptions clustered", "Critical exceptions exist across R2R, user access, and inventory quality.", "HIGH", "critical_exception_count", 3, 1, 200, "Request management action plan and closure dates."),
];

const COPILOT_SEEDS = [
  copilot("CEO", "strategy-copilot", "CEO Strategy Copilot", "Enterprise strategy partner", "Summarize strategic risks, growth levers, and CEO decisions for the next executive review.", "Growth is ahead of plan, but dispatch and QC risks should be closed before committing the upside scenario.", ["Approve dispatch recovery plan", "Review automation ROI expansion", "Ask CFO for downside cash scenario"], 88.2),
  copilot("CFO", "finance-copilot", "CFO Finance Copilot", "Finance and cash command partner", "Prioritize cash, anomaly, collections, and close-readiness decisions.", "Cash runway remains acceptable, but AP concentration and reconciliation breaks need immediate control action.", ["Stage payment release", "Escalate overdue receivable dispute", "Block close until reconciliation evidence is complete"], 91.5),
  copilot("BOARD", "board-copilot", "Board MIS Copilot", "Board pack synthesis agent", "Prepare board-level MIS commentary across strategy, finance, risk, and governance.", "The board pack is ready with risk trending down, subject to management closure of three active exceptions.", ["Request risk closure owners", "Approve board pack after CFO sign-off", "Track quality yield remediation"], 86.9),
];

const INSIGHT_SEEDS = [
  insight("CEO", "exec:insight:market-expansion", "Prioritize enterprise renewal motion", "Renewal pipeline and customer portal activity show strongest upside in enterprise accounts.", "Growth", "HIGH", 84.6, "30 days", "Move sales capacity to enterprise renewal opportunities."),
  insight("CEO", "exec:insight:automation-operating-model", "Scale AI exception handling", "AI controls are already surfacing procurement, finance, and quality exceptions before downstream impact.", "Operating model", "MEDIUM", 81.4, "This quarter", "Fund automation backlog for exception closure workflows."),
  insight("CFO", "exec:insight:cash-discipline", "Preserve cash optionality", "Forecast runway is stable, but AP concentration can create unnecessary short-term liquidity pressure.", "Cash", "HIGH", 89.1, "7 days", "Approve staged payment release policy."),
  insight("CFO", "exec:insight:close-risk", "Tighten close evidence controls", "R2R anomalies and reconciliation breaks are above threshold for a low-touch close.", "Controls", "HIGH", 87.7, "Current close", "Require evidence completion before close sign-off."),
  insight("BOARD", "exec:insight:board-risk", "Management action plan required", "Risk is improving but control exceptions remain concentrated in finance, access, and quality.", "Governance", "HIGH", 86.3, "Next board review", "Request closure owners, dates, and residual risk acceptance."),
  insight("BOARD", "exec:insight:strategic-capacity", "Capacity is the gating constraint", "Bengaluru assembly utilization and QC failure risk may constrain revenue upside.", "Operations", "MEDIUM", 78.8, "45 days", "Approve capacity balancing and quality recovery plan."),
];

const BOARD_PACKS = [
  {
    packNumber: "BOARD-MIS-2026-05",
    period: PERIOD,
    title: "Board MIS - May 2026",
    status: "READY" as const,
    revenue: 18400000,
    ebitda: 3970000,
    cashRunwayMonths: 8.7,
    riskIndex: 42,
    governanceSummary:
      "Board pack is ready with growth ahead of plan, finance controls under watch, and supply-chain remediation in progress.",
    createdByRole: "cfo",
    approvedAt: null,
    kpiSummary: {
      revenueGrowth: "18.4%",
      operatingMargin: "21.6%",
      governanceReadiness: "92%",
      activeExceptions: 5,
    },
  },
];

export async function seedExecutiveIntelligence(
  prisma: PrismaClient,
  organizationId: string,
  actorUserId: string,
) {
  for (const item of KPI_SEEDS) {
    await prisma.executiveKpi.upsert({
      where: {
        organizationId_audience_code_period: {
          organizationId,
          audience: item.audience,
          code: item.code,
          period: PERIOD,
        },
      },
      create: { ...item, organizationId, period: PERIOD, metadata: seedMeta() },
      update: { ...item, metadata: seedMeta() },
    });
  }

  for (const item of FORECAST_SEEDS) {
    await prisma.executiveForecast.upsert({
      where: { organizationId_forecastNumber: { organizationId, forecastNumber: item.forecastNumber } },
      create: { ...item, organizationId, metadata: seedMeta() },
      update: { ...item, metadata: seedMeta() },
    });
  }

  for (const item of ANOMALY_SEEDS) {
    await prisma.executiveAnomaly.upsert({
      where: { organizationId_sourceKey: { organizationId, sourceKey: item.sourceKey } },
      create: { ...item, organizationId, status: "OPEN", detectedAt: hoursFromNow(-6), metadata: seedMeta() },
      update: { ...item, status: "OPEN", detectedAt: hoursFromNow(-6), metadata: seedMeta() },
    });
  }

  for (const item of COPILOT_SEEDS) {
    await prisma.executiveCopilot.upsert({
      where: {
        organizationId_audience_slug: {
          organizationId,
          audience: item.audience,
          slug: item.slug,
        },
      },
      create: {
        ...item,
        organizationId,
        status: "OPEN",
        lastRunAt: hoursFromNow(-1),
        recommendedActions: asJson(item.recommendedActions),
        metadata: seedMeta(),
      },
      update: {
        ...item,
        status: "OPEN",
        lastRunAt: hoursFromNow(-1),
        recommendedActions: asJson(item.recommendedActions),
        metadata: seedMeta(),
      },
    });
  }

  for (const item of INSIGHT_SEEDS) {
    await prisma.executiveStrategicInsight.upsert({
      where: { organizationId_sourceKey: { organizationId, sourceKey: item.sourceKey } },
      create: { ...item, organizationId, status: "OPEN", metadata: seedMeta() },
      update: { ...item, status: "OPEN", metadata: seedMeta() },
    });
  }

  for (const item of BOARD_PACKS) {
    await prisma.boardMisSnapshot.upsert({
      where: { organizationId_packNumber: { organizationId, packNumber: item.packNumber } },
      create: { ...item, organizationId, kpiSummary: asJson(item.kpiSummary), metadata: seedMeta() },
      update: { ...item, kpiSummary: asJson(item.kpiSummary), metadata: seedMeta() },
    });
  }

  await seedExecutiveAudit(prisma, organizationId, actorUserId);
  console.log("  Executive Intelligence: seeded CEO, CFO, Board MIS, forecasts, anomalies, copilots, and strategic insights");
}

function kpi(
  audience: Audience,
  code: string,
  name: string,
  value: number,
  unit: string,
  target: number,
  trend: "up" | "down" | "neutral",
  variancePercent: number,
  status: string,
  ownerRole: string,
  sortOrder: number,
) {
  return {
    audience,
    code,
    name,
    value,
    valueText: unit === "INR" ? null : `${value}${unit === "%" ? "%" : ` ${unit}`}`,
    unit,
    target,
    trend,
    variancePercent,
    status,
    ownerRole,
    sortOrder,
  };
}

function forecast(
  audience: Audience,
  forecastNumber: string,
  title: string,
  metric: string,
  horizon: string,
  baselineValue: number,
  predictedValue: number,
  confidence: number,
  scenario: string,
  driverSummary: string,
  riskLevel: Severity,
) {
  return {
    audience,
    forecastNumber,
    title,
    metric,
    horizon,
    baselineValue,
    predictedValue,
    confidence,
    scenario,
    driverSummary,
    riskLevel,
  };
}

function anomaly(
  audience: Audience,
  sourceKey: string,
  source: string,
  title: string,
  description: string,
  severity: Severity,
  metric: string,
  actualValue: number,
  expectedValue: number,
  variancePercent: number,
  recommendedAction: string,
) {
  return {
    audience,
    sourceKey,
    source,
    title,
    description,
    severity,
    metric,
    actualValue,
    expectedValue,
    variancePercent,
    recommendedAction,
  };
}

function copilot(
  audience: Audience,
  slug: string,
  name: string,
  role: string,
  prompt: string,
  summary: string,
  recommendedActions: string[],
  confidence: number,
) {
  return { audience, slug, name, role, prompt, summary, recommendedActions, confidence };
}

function insight(
  audience: Audience,
  sourceKey: string,
  title: string,
  narrative: string,
  impactArea: string,
  priority: Severity,
  confidence: number,
  decisionWindow: string,
  recommendedAction: string,
) {
  return {
    audience,
    sourceKey,
    title,
    narrative,
    impactArea,
    priority,
    confidence,
    decisionWindow,
    recommendedAction,
  };
}

async function seedExecutiveAudit(
  prisma: PrismaClient,
  organizationId: string,
  actorUserId: string,
) {
  const logs = [
    audit("exec:kpi:refreshed", "executive.kpis.refreshed", "executive", "INFO", { period: PERIOD }),
    audit("exec:forecast:generated", "executive.forecast.generated", "forecast", "INFO", { horizon: "Next quarter" }),
    audit("exec:anomaly:detected", "executive.anomaly.detected", "anomaly", "WARNING", { anomalyCount: ANOMALY_SEEDS.length }),
    audit("exec:copilot:prepared", "executive.copilot.prepared", "copilot", "INFO", { copilots: COPILOT_SEEDS.length }),
    audit("exec:board:mis-ready", "board.mis.ready", "board_mis", "INFO", { packNumber: "BOARD-MIS-2026-05" }),
  ];

  for (const item of logs) {
    const existing = await prisma.auditLog.findFirst({
      where: {
        organizationId,
        resource: item.resource,
        action: item.action,
        correlationId: item.correlationId,
      },
      select: { id: true },
    });
    if (existing) continue;

    await prisma.auditLog.create({
      data: {
        organizationId,
        userId: actorUserId,
        action: item.action,
        resource: item.resource,
        severity: item.severity,
        after: asJson(item.details),
        metadata: seedMeta(),
        correlationId: item.correlationId,
      },
    });
  }
}

function audit(
  correlationId: string,
  action: string,
  resource: string,
  severity: "INFO" | "WARNING",
  details: Record<string, unknown>,
) {
  return { correlationId, action, resource, severity, details };
}

function seedMeta(): Prisma.InputJsonValue {
  return asJson({ seedProfile: "executive-intelligence" });
}

function asJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value ?? {})) as Prisma.InputJsonValue;
}

function hoursFromNow(hours: number): Date {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}
