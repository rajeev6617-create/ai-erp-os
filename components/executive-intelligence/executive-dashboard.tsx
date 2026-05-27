import Link from "next/link";
import {
  AlertTriangle,
  Bot,
  BrainCircuit,
  CheckCircle2,
  ClipboardList,
  LineChart,
  ShieldCheck,
  Sparkles,
  Target,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatCard } from "@/components/ui/stat-card";
import { cn } from "@/lib/utils/cn";
import type {
  BoardMisSnapshotView,
  ExecutiveAnomalyView,
  ExecutiveCopilotView,
  ExecutiveDashboardData,
  ExecutiveForecastView,
  ExecutiveKpiView,
  StrategicInsightView,
} from "@/lib/executive-intelligence/types";

export function ExecutiveDashboard({ data }: { data: ExecutiveDashboardData }) {
  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{data.eyebrow}</p>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{data.title}</h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{data.description}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {data.nav.map((item) => (
              <Link
                key={item.slug}
                href={item.href}
                className={cn(
                  "rounded-md border border-border px-3 py-1.5 text-sm font-medium transition-colors",
                  item.slug === data.activeSlug
                    ? "bg-primary text-primary-foreground"
                    : "bg-card hover:bg-muted",
                )}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
        <Badge variant={data.summary.highRiskCount > 0 ? "warning" : "success"}>
          {data.summary.highRiskCount} escalated signals
        </Badge>
      </header>

      <SummaryCards data={data} />
      <EnterpriseKpis kpis={data.kpis} />

      <section className="grid gap-4 xl:grid-cols-12">
        <div className="xl:col-span-7">
          <ForecastsCard forecasts={data.forecasts} />
        </div>
        <div className="xl:col-span-5">
          <AnomaliesCard anomalies={data.anomalies} />
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-12">
        <div className="xl:col-span-5">
          <CopilotsCard copilots={data.copilots} />
        </div>
        <div className="xl:col-span-7">
          <StrategicInsightsCard insights={data.strategicInsights} />
        </div>
      </section>

      <BoardMisCard packs={data.boardPacks} />
      <AuditCard logs={data.auditLogs} />
    </div>
  );
}

function SummaryCards({ data }: { data: ExecutiveDashboardData }) {
  const cards: Array<{
    label: string;
    value: string;
    change: string;
    trend: "up" | "down" | "neutral";
    icon: LucideIcon;
  }> = [
    {
      label: "Enterprise KPIs",
      value: String(data.summary.kpiCount),
      change: `${data.kpis.filter((item) => item.status === "AHEAD").length} ahead`,
      trend: "up",
      icon: Target,
    },
    {
      label: "AI forecasting",
      value: String(data.summary.forecastCount),
      change: `${data.forecasts.filter((item) => item.confidence != null && item.confidence >= 80).length} high confidence`,
      trend: "neutral",
      icon: LineChart,
    },
    {
      label: "Anomaly detection",
      value: String(data.summary.anomalyCount),
      change: `${data.anomalies.filter((item) => isEscalated(item.severity)).length} high risk`,
      trend: data.summary.anomalyCount > 0 ? "down" : "up",
      icon: AlertTriangle,
    },
    {
      label: "AI copilots",
      value: String(data.summary.copilotCount),
      change: `${data.summary.strategicInsightCount} strategic insights`,
      trend: "up",
      icon: Bot,
    },
  ];

  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <StatCard key={card.label} {...card} />
      ))}
    </section>
  );
}

function EnterpriseKpis({ kpis }: { kpis: ExecutiveKpiView[] }) {
  return (
    <section>
      <div className="mb-3">
        <h2 className="text-sm font-semibold">Enterprise KPIs</h2>
        <p className="text-xs text-muted-foreground">
          Board-level performance, control, cash, growth, and automation indicators.
        </p>
      </div>
      {kpis.length === 0 ? (
        <EmptyState
          icon={Target}
          title="No executive KPIs"
          description="Executive KPI records will appear here when seeded or synced."
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {kpis.map((kpi) => (
            <div key={kpi.id} className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">{kpi.period}</p>
                  <p className="mt-1 text-sm font-semibold">{kpi.name}</p>
                </div>
                <Badge variant={kpiVariant(kpi.status)}>{formatStatus(kpi.status)}</Badge>
              </div>
              <p className="mt-3 text-2xl font-semibold tracking-tight">
                {formatKpiValue(kpi)}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Target {formatKpiTarget(kpi)} | {formatRole(kpi.ownerRole)}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function ForecastsCard({ forecasts }: { forecasts: ExecutiveForecastView[] }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LineChart className="h-4 w-4 text-primary" />
          AI forecasting
        </CardTitle>
        <CardDescription>Scenario outlooks with confidence, risk, and primary drivers</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {forecasts.length === 0 ? (
          <EmptyState icon={LineChart} title="No forecasts" description="AI forecast signals will appear here." />
        ) : (
          forecasts.map((forecast) => (
            <div key={forecast.id} className="grid gap-3 rounded-lg border border-border p-3 md:grid-cols-[1fr_auto]">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold">{forecast.title}</p>
                  <Badge variant={severityVariant(forecast.riskLevel)}>
                    {forecast.riskLevel.toLowerCase()}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {forecast.forecastNumber} | {forecast.horizon} | {forecast.scenario}
                </p>
                <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
                  {forecast.driverSummary}
                </p>
              </div>
              <div className="text-sm md:min-w-36 md:text-right">
                <p className="font-semibold">{formatForecastValue(forecast.predictedValue, forecast.metric)}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {forecast.deltaPercent > 0 ? "+" : ""}{forecast.deltaPercent}% vs base
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {forecast.confidence == null ? "No confidence" : `${Math.round(forecast.confidence)}% confidence`}
                </p>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function AnomaliesCard({ anomalies }: { anomalies: ExecutiveAnomalyView[] }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-primary" />
          Anomaly detection
        </CardTitle>
        <CardDescription>Executive-level exceptions across finance, operations, and controls</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {anomalies.length === 0 ? (
          <EmptyState icon={AlertTriangle} title="No active anomalies" description="Executive anomaly signals will appear here." />
        ) : (
          anomalies.map((anomaly) => (
            <div key={anomaly.id} className="rounded-lg border border-border p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{anomaly.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {anomaly.source} | {formatStatus(anomaly.metric)}
                  </p>
                </div>
                <Badge variant={severityVariant(anomaly.severity)}>
                  {anomaly.severity.toLowerCase()}
                </Badge>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{anomaly.description}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                {anomaly.variancePercent == null
                  ? "Variance unavailable"
                  : `${anomaly.variancePercent}% variance`}
              </p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function CopilotsCard({ copilots }: { copilots: ExecutiveCopilotView[] }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BrainCircuit className="h-4 w-4 text-primary" />
          AI copilots
        </CardTitle>
        <CardDescription>Role-specific executive copilots and recommended actions</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {copilots.length === 0 ? (
          <EmptyState icon={Bot} title="No copilots" description="Executive copilot summaries will appear here." />
        ) : (
          copilots.map((copilot) => (
            <div key={copilot.id} className="rounded-lg border border-border p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">{copilot.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{copilot.role}</p>
                </div>
                <Badge variant="info">
                  {copilot.confidence == null ? "AI" : `${Math.round(copilot.confidence)}%`}
                </Badge>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">{copilot.summary}</p>
              <div className="mt-3 space-y-1">
                {copilot.recommendedActions.slice(0, 3).map((action) => (
                  <p key={action} className="text-xs font-medium">
                    {action}
                  </p>
                ))}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function StrategicInsightsCard({ insights }: { insights: StrategicInsightView[] }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          Strategic insights
        </CardTitle>
        <CardDescription>Predictive analytics translated into executive decisions</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {insights.length === 0 ? (
          <EmptyState icon={Sparkles} title="No strategic insights" description="Strategic recommendations will appear here." />
        ) : (
          insights.map((insight) => (
            <div key={insight.id} className="rounded-lg border border-border p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{insight.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {insight.impactArea} | {insight.decisionWindow ?? "No window"}
                  </p>
                </div>
                <Badge variant={severityVariant(insight.priority)}>
                  {insight.priority.toLowerCase()}
                </Badge>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{insight.narrative}</p>
              {insight.recommendedAction ? (
                <p className="mt-2 text-xs font-medium">{insight.recommendedAction}</p>
              ) : null}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function BoardMisCard({ packs }: { packs: BoardMisSnapshotView[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClipboardList className="h-4 w-4 text-primary" />
          Board MIS
        </CardTitle>
        <CardDescription>Board pack status, governance summary, and strategic MIS metrics</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {packs.length === 0 ? (
          <EmptyState icon={ClipboardList} title="No board MIS packs" description="Board MIS snapshots will appear here." />
        ) : (
          packs.map((pack) => <BoardPack key={pack.id} pack={pack} />)
        )}
      </CardContent>
    </Card>
  );
}

function BoardPack({ pack }: { pack: BoardMisSnapshotView }) {
  return (
    <div className="rounded-lg border border-border p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-semibold">{pack.title}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {pack.packNumber} | {pack.period} | {formatRole(pack.createdByRole)}
          </p>
        </div>
        <Badge variant={pack.status === "APPROVED" || pack.status === "READY" ? "success" : "warning"}>
          {formatStatus(pack.status)}
        </Badge>
      </div>
      <p className="mt-3 text-sm text-muted-foreground">{pack.governanceSummary}</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Revenue" value={formatInr(pack.revenue)} />
        <Metric label="EBITDA" value={formatInr(pack.ebitda)} />
        <Metric
          label="Cash runway"
          value={pack.cashRunwayMonths == null ? "n/a" : `${pack.cashRunwayMonths} months`}
        />
        <Metric label="Risk index" value={String(pack.riskIndex)} />
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-muted/20 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  );
}

function AuditCard({ logs }: { logs: ExecutiveDashboardData["auditLogs"] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" />
          Audit logs
        </CardTitle>
        <CardDescription>Executive intelligence generation and board pack traceability</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {logs.length === 0 ? (
          <EmptyState icon={CheckCircle2} title="No audit events" description="Executive audit events will appear here." />
        ) : (
          logs.map((log) => (
            <div key={log.id} className="rounded-lg border border-border p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">{formatStatus(log.action)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {log.resource} | {formatDate(log.createdAt)}
                  </p>
                </div>
                <Badge variant={severityVariant(log.severity)}>
                  {log.severity.toLowerCase()}
                </Badge>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function formatKpiValue(kpi: ExecutiveKpiView): string {
  if (kpi.valueText) return kpi.valueText;
  if (kpi.value == null) return "n/a";
  if (kpi.unit === "INR") return formatInr(kpi.value);
  if (kpi.unit === "%") return `${kpi.value}%`;
  return `${formatNumber(kpi.value)}${kpi.unit ? ` ${kpi.unit}` : ""}`;
}

function formatKpiTarget(kpi: ExecutiveKpiView): string {
  if (kpi.target == null) return "n/a";
  if (kpi.unit === "INR") return formatInr(kpi.target);
  if (kpi.unit === "%") return `${kpi.target}%`;
  return `${formatNumber(kpi.target)}${kpi.unit ? ` ${kpi.unit}` : ""}`;
}

function formatForecastValue(value: number, metric: string): string {
  if (metric.includes("revenue") || metric.includes("collection")) return formatInr(value);
  if (metric.includes("runway")) return `${value} months`;
  if (metric.includes("roi") || metric.includes("index")) return formatNumber(value);
  return formatNumber(value);
}

function formatStatus(value: string): string {
  return value
    .toLowerCase()
    .replaceAll(".", " ")
    .replaceAll("_", " ")
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatRole(role: string | null): string {
  return role ? formatStatus(role) : "Unassigned";
}

function formatDate(iso: string): string {
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
    notation: Math.abs(amount) >= 1000000 ? "compact" : "standard",
  }).format(amount);
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 1,
    notation: Math.abs(value) >= 1000000 ? "compact" : "standard",
  }).format(value);
}

function isEscalated(severity: string): boolean {
  return severity === "HIGH" || severity === "CRITICAL";
}

function kpiVariant(status: string): "default" | "success" | "warning" | "danger" | "info" {
  if (status === "AHEAD" || status === "ON_TRACK") return "success";
  if (status === "WATCH") return "warning";
  if (status === "OFF_TRACK") return "danger";
  return "info";
}

function severityVariant(severity: string): "default" | "success" | "warning" | "danger" | "info" {
  if (severity === "CRITICAL" || severity === "HIGH" || severity === "ERROR") return "danger";
  if (severity === "MEDIUM" || severity === "WARNING") return "warning";
  if (severity === "INFO") return "info";
  return "success";
}
