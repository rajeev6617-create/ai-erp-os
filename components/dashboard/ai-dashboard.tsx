import {
  AlertTriangle,
  Bot,
  BrainCircuit,
  Clock3,
  Gauge,
  Sparkles,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { AiAgentWidgets } from "@/components/dashboard/ai-agent-widgets";
import { EnterpriseAiControlTower } from "@/components/dashboard/enterprise-ai-control-tower";
import { AiWorkflowPanel } from "@/components/workflows/ai-workflow-panel";
import { cn } from "@/lib/utils/cn";
import type { AiDashboardData } from "@/lib/dashboard/ai";
import type { AiInsightSeverity } from "@/lib/workflows/types";

export function AiDashboard({ data }: { data: AiDashboardData }) {
  const intelligence = data.operations.intelligence;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">AI operations</p>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            AI command center
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Workflow intelligence, risk monitoring, recommendations, anomaly detection, SLA prediction, and agent health.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:items-end">
          <Badge variant="info">{intelligence.engineVersion}</Badge>
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Active AI agents"
          value={String(data.agentOverview.activeAgents)}
          change={`${data.agentOverview.totalAgents} total configured`}
          trend="neutral"
          icon={Bot}
        />
        <StatCard
          label="Risk monitor"
          value={`${intelligence.summary.maxRiskScore}/100`}
          change={`${intelligence.summary.highRiskApprovals} high-risk approval(s)`}
          trend={intelligence.summary.highRiskApprovals > 0 ? "down" : "neutral"}
          icon={Gauge}
        />
        <StatCard
          label="SLA predictions"
          value={String(intelligence.summary.predictedSlaBreaches)}
          change={`${intelligence.slaPredictions.length} watched approval(s)`}
          trend={intelligence.summary.predictedSlaBreaches > 0 ? "down" : "neutral"}
          icon={Clock3}
        />
        <StatCard
          label="Recommendations"
          value={String(intelligence.approvalRecommendations.length)}
          change={`${intelligence.summary.priorityRecommendations} priority updates`}
          trend="up"
          icon={Sparkles}
        />
      </section>

      <AiAgentWidgets
        cfo={data.cfoAgent}
        auditor={data.auditorAgent}
        compliance={data.complianceAgent}
      />

      <EnterpriseAiControlTower data={data.controlTower} />

      <section className="grid gap-4 xl:grid-cols-12">
        <div className="space-y-4 xl:col-span-7">
          <RiskMonitoring data={data} />
          <AiRecommendations data={data} />
          <AnomalyDetection data={data} />
        </div>
        <aside className="space-y-4 xl:col-span-5">
          <AgentOverview data={data} />
          <SlaPrediction data={data} />
        </aside>
      </section>

      <section className="grid gap-4 xl:grid-cols-12">
        <div className="xl:col-span-7">
          <AiWorkflowPanel intelligence={intelligence} />
        </div>
        <div className="xl:col-span-5">
          <RecentAiActions data={data} />
        </div>
      </section>
    </div>
  );
}

function RiskMonitoring({ data }: { data: AiDashboardData }) {
  const intelligence = data.operations.intelligence;
  const riskItems = intelligence.insights.filter((insight) =>
    ["risk", "priority", "finance"].includes(insight.type),
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gauge className="h-4 w-4 text-primary" />
          Risk monitoring
        </CardTitle>
        <CardDescription>Approval, finance, and workflow risk signals</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2">
        {riskItems.length === 0 ? (
          <EmptyState message="No risk signals currently need attention." />
        ) : (
          riskItems.slice(0, 4).map((insight) => (
            <InsightCard
              key={insight.id}
              title={insight.title}
              description={insight.description}
              severity={insight.severity}
              metric={insight.score != null ? `${Math.round(insight.score)}` : insight.type}
              footer={
                insight.confidence != null
                  ? `${insight.confidence}% confidence`
                  : insight.source ?? "rules engine"
              }
            />
          ))
        )}
      </CardContent>
    </Card>
  );
}

function AiRecommendations({ data }: { data: AiDashboardData }) {
  const recommendations = data.operations.intelligence.approvalRecommendations;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BrainCircuit className="h-4 w-4 text-primary" />
          AI recommendations
        </CardTitle>
        <CardDescription>Next-best actions for approval decisions</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {recommendations.length === 0 ? (
          <EmptyState message="No approval recommendations generated." />
        ) : (
          recommendations.slice(0, 4).map((recommendation) => (
            <div key={recommendation.id} className="rounded-lg border border-border p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="line-clamp-1 text-sm font-medium">{recommendation.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {recommendation.rationale}
                  </p>
                </div>
                <SeverityBadge severity={severityFromScore(recommendation.riskScore)}>
                  {formatAction(recommendation.recommendedAction)}
                </SeverityBadge>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                <Metric label="Risk" value={`${recommendation.riskScore}/100`} />
                <Metric label="Priority" value={`${recommendation.priorityScore}/100`} />
                <Metric label="Confidence" value={`${recommendation.confidence}%`} />
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function AnomalyDetection({ data }: { data: AiDashboardData }) {
  const intelligence = data.operations.intelligence;
  const anomalies = [
    ...intelligence.financeAnomalies.map((alert) => ({
      id: alert.id,
      title: alert.title,
      description: alert.description,
      severity: alert.severity,
      detail: alert.evidence.slice(0, 2).join(" | "),
    })),
    ...intelligence.bottleneckInsights.slice(0, 3).map((bottleneck) => ({
      id: bottleneck.id,
      title: bottleneck.title,
      description: bottleneck.description,
      severity: bottleneck.severity,
      detail: `${bottleneck.count} item(s) | ${bottleneck.confidence}% confidence`,
    })),
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-primary" />
          Anomaly detection
        </CardTitle>
        <CardDescription>Finance anomalies and workflow bottlenecks</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2">
        {anomalies.length === 0 ? (
          <EmptyState message="No anomalies detected." />
        ) : (
          anomalies.slice(0, 6).map((anomaly) => (
            <InsightCard
              key={anomaly.id}
              title={anomaly.title}
              description={anomaly.description}
              severity={anomaly.severity}
              metric={anomaly.severity}
              footer={anomaly.detail}
            />
          ))
        )}
      </CardContent>
    </Card>
  );
}

function SlaPrediction({ data }: { data: AiDashboardData }) {
  const predictions = data.operations.intelligence.slaPredictions;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock3 className="h-4 w-4 text-primary" />
          SLA prediction
        </CardTitle>
        <CardDescription>Approvals likely to breach response windows</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {predictions.length === 0 ? (
          <EmptyState message="No SLA breaches predicted." />
        ) : (
          predictions.slice(0, 5).map((prediction) => (
            <div key={prediction.id} className="rounded-lg border border-border p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="line-clamp-1 text-sm font-medium">{prediction.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{prediction.reason}</p>
                </div>
                <SeverityBadge severity={prediction.severity}>
                  {prediction.probability}%
                </SeverityBadge>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function AgentOverview({ data }: { data: AiDashboardData }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-4 w-4 text-primary" />
          AI agent overview
        </CardTitle>
        <CardDescription>
          {data.agentOverview.actionsLast30Days} action(s) in the last 30 days
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2 sm:grid-cols-2">
          <Metric label="Success rate" value={`${data.agentOverview.successRate}%`} />
          <Metric label="Avg latency" value={`${data.agentOverview.averageLatencyMs}ms`} />
          <Metric label="Approval-gated" value={String(data.agentOverview.approvalRequired)} />
          <Metric label="Cost" value={formatInr(data.agentOverview.costInr)} />
        </div>
        <div className="space-y-2">
          {data.agents.length === 0 ? (
            <EmptyState message="No AI agents configured for this tenant." />
          ) : (
            data.agents.slice(0, 5).map((agent) => (
              <div key={agent.id} className="rounded-lg border border-border p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="line-clamp-1 text-sm font-medium">{agent.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {agent.modelProvider} | {agent.modelId} | v{agent.version}
                    </p>
                  </div>
                  <Badge variant={agent.status === "ACTIVE" ? "success" : "default"}>
                    {formatAction(agent.status)}
                  </Badge>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {agent.actionCount} total action(s)
                </p>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function RecentAiActions({ data }: { data: AiDashboardData }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" />
          Recent AI actions
        </CardTitle>
        <CardDescription>Agent execution and approval gate activity</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {data.recentActions.length === 0 ? (
          <EmptyState message="No AI actions have run yet." />
        ) : (
          data.recentActions.map((action) => (
            <div key={action.id} className="rounded-lg border border-border p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="line-clamp-1 text-sm font-medium">
                    {formatAction(action.actionType)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {action.agentName} | {formatDateTime(action.createdAt)}
                  </p>
                </div>
                <Badge variant={action.status === "SUCCEEDED" ? "success" : action.status === "FAILED" ? "danger" : "info"}>
                  {formatAction(action.status)}
                </Badge>
              </div>
              <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                {action.requiresApproval && <span>Requires approval</span>}
                {action.latencyMs != null && <span>{action.latencyMs}ms latency</span>}
                {action.costInr > 0 && <span>{formatInr(action.costInr)}</span>}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function InsightCard({
  title,
  description,
  severity,
  metric,
  footer,
}: {
  title: string;
  description: string;
  severity: AiInsightSeverity;
  metric: string;
  footer: string;
}) {
  return (
    <div className="rounded-lg border border-border p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="line-clamp-1 text-sm font-medium">{title}</p>
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
            {description}
          </p>
        </div>
        <SeverityBadge severity={severity}>{metric}</SeverityBadge>
      </div>
      <p className="mt-2 line-clamp-1 text-xs text-muted-foreground">{footer}</p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/20 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  );
}

function SeverityBadge({
  severity,
  children,
}: {
  severity: AiInsightSeverity;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-md px-2 py-0.5 text-xs font-medium capitalize",
        severity === "critical" && "bg-red-500/10 text-red-600 dark:text-red-400",
        severity === "high" && "bg-red-500/10 text-red-600 dark:text-red-400",
        severity === "medium" && "bg-amber-500/10 text-amber-600 dark:text-amber-400",
        severity === "low" && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
      )}
    >
      {children}
    </span>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
      {message}
    </div>
  );
}

function severityFromScore(score: number): AiInsightSeverity {
  if (score >= 88) return "critical";
  if (score >= 70) return "high";
  if (score >= 45) return "medium";
  return "low";
}

function formatAction(value: string): string {
  return value
    .toLowerCase()
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatInr(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}
