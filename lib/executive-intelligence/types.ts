export type ExecutiveAudienceSlug = "ceo" | "cfo" | "board";
export type ExecutiveAudience = "CEO" | "CFO" | "BOARD";
export type ExecutiveSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface ExecutiveNavItem {
  slug: ExecutiveAudienceSlug;
  label: string;
  href: string;
}

export interface ExecutiveKpiView {
  id: string;
  code: string;
  name: string;
  value: number | null;
  valueText: string | null;
  unit: string | null;
  target: number | null;
  trend: "up" | "down" | "neutral";
  variancePercent: number | null;
  status: string;
  period: string;
  ownerRole: string | null;
  sortOrder: number;
}

export interface ExecutiveForecastView {
  id: string;
  forecastNumber: string;
  title: string;
  metric: string;
  horizon: string;
  baselineValue: number;
  predictedValue: number;
  deltaPercent: number;
  confidence: number | null;
  scenario: string;
  driverSummary: string;
  riskLevel: ExecutiveSeverity;
}

export interface ExecutiveAnomalyView {
  id: string;
  source: string;
  title: string;
  description: string;
  severity: ExecutiveSeverity;
  metric: string;
  actualValue: number | null;
  expectedValue: number | null;
  variancePercent: number | null;
  detectedAt: string;
  status: string;
  recommendedAction: string | null;
}

export interface ExecutiveCopilotView {
  id: string;
  slug: string;
  name: string;
  role: string;
  prompt: string;
  summary: string;
  recommendedActions: string[];
  status: string;
  confidence: number | null;
  lastRunAt: string | null;
}

export interface StrategicInsightView {
  id: string;
  title: string;
  narrative: string;
  impactArea: string;
  priority: ExecutiveSeverity;
  confidence: number | null;
  decisionWindow: string | null;
  recommendedAction: string | null;
  status: string;
}

export interface BoardMisSnapshotView {
  id: string;
  packNumber: string;
  period: string;
  title: string;
  status: string;
  revenue: number;
  ebitda: number;
  cashRunwayMonths: number | null;
  riskIndex: number;
  governanceSummary: string;
  createdByRole: string | null;
  approvedAt: string | null;
  kpiSummary: Record<string, unknown> | null;
}

export interface ExecutiveAuditView {
  id: string;
  action: string;
  resource: string;
  severity: string;
  createdAt: string;
}

export interface ExecutiveSummary {
  kpiCount: number;
  forecastCount: number;
  anomalyCount: number;
  highRiskCount: number;
  copilotCount: number;
  strategicInsightCount: number;
}

export interface ExecutiveDashboardData {
  nav: ExecutiveNavItem[];
  activeSlug: ExecutiveAudienceSlug;
  audience: ExecutiveAudience;
  title: string;
  eyebrow: string;
  description: string;
  summary: ExecutiveSummary;
  kpis: ExecutiveKpiView[];
  forecasts: ExecutiveForecastView[];
  anomalies: ExecutiveAnomalyView[];
  copilots: ExecutiveCopilotView[];
  strategicInsights: StrategicInsightView[];
  boardPacks: BoardMisSnapshotView[];
  auditLogs: ExecutiveAuditView[];
}
