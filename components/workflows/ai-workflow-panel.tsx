import {
  AlertTriangle,
  ArrowUpRight,
  BadgeCheck,
  BrainCircuit,
  Clock3,
  IndianRupee,
  Route,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";
import type {
  AiInsightSeverity,
  WorkflowIntelligenceData,
} from "@/lib/workflows/types";

type AiWorkflowPanelProps = {
  intelligence?: WorkflowIntelligenceData | null;
};

export function AiWorkflowPanel({ intelligence }: AiWorkflowPanelProps) {
  if (!intelligence) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <PanelHeader />
        <EmptyState message="Workflow intelligence is unavailable for this tenant." />
      </section>
    );
  }

  const topRecommendation = intelligence.approvalRecommendations[0];

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <PanelHeader
        generatedAt={intelligence.generatedAt}
        engineVersion={intelligence.engineVersion}
      />

      <div className="grid gap-2 sm:grid-cols-2">
        {intelligence.widgets.map((widget) => (
          <div key={widget.id} className="rounded-lg border border-border p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{widget.label}</p>
                <p className="mt-1 truncate text-xs text-muted-foreground">
                  {widget.detail}
                </p>
              </div>
              <RiskScoreBadge
                score={Number(widget.value)}
                severity={widget.severity}
                label={widget.value}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 space-y-4">
        <SignalSection
          title="Approval recommendations"
          icon={BadgeCheck}
          empty="No approval recommendations at the moment."
        >
          {intelligence.approvalRecommendations.slice(0, 3).map((recommendation) => (
            <article
              key={recommendation.id}
              className="rounded-lg border border-border bg-muted/20 p-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="line-clamp-1 text-sm font-semibold">
                    {recommendation.title}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {recommendation.rationale}
                  </p>
                </div>
                <Badge variant={severityVariant(recommendation.riskScore)}>
                  {formatAction(recommendation.recommendedAction)}
                </Badge>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <MetricPill
                  label="Risk score"
                  value={`${recommendation.riskScore}/100`}
                  severity={severityFromScore(recommendation.riskScore)}
                />
                <MetricPill
                  label="Priority score"
                  value={`${recommendation.priorityScore}/100`}
                  severity={severityFromScore(recommendation.priorityScore)}
                />
              </div>
              <ConfidenceMeter value={recommendation.confidence} />
              <EvidenceList
                label="Signals"
                items={recommendation.auditSignals}
              />
              <EvidenceList
                label="Safeguards"
                items={recommendation.safeguards}
              />
            </article>
          ))}
        </SignalSection>

        <SignalSection
          title="SLA breach prediction"
          icon={Clock3}
          empty="No SLA breaches predicted."
        >
          {intelligence.slaPredictions.slice(0, 3).map((prediction) => (
            <SignalRow
              key={prediction.id}
              title={prediction.title}
              description={prediction.reason}
              severity={prediction.severity}
              metric={`${prediction.probability}%`}
              detail={prediction.dueAt ? `Due ${formatDateTime(prediction.dueAt)}` : "No due date"}
            />
          ))}
        </SignalSection>

        <SignalSection
          title="Finance anomaly alerts"
          icon={IndianRupee}
          empty="No finance anomalies detected."
        >
          {intelligence.financeAnomalies.slice(0, 3).map((alert) => (
            <SignalRow
              key={alert.id}
              title={alert.title}
              description={alert.description}
              severity={alert.severity}
              metric={alert.amountInr != null ? formatInr(alert.amountInr) : alert.entityType}
              detail={alert.evidence.slice(0, 2).join(" | ")}
            />
          ))}
        </SignalSection>

        <SignalSection
          title="Workflow bottlenecks"
          icon={Route}
          empty="No workflow bottlenecks detected."
        >
          {intelligence.bottleneckInsights.slice(0, 3).map((bottleneck) => (
            <SignalRow
              key={bottleneck.id}
              title={bottleneck.title}
              description={bottleneck.description}
              severity={bottleneck.severity}
              metric={`${bottleneck.count} item${bottleneck.count === 1 ? "" : "s"}`}
              detail={`Avg age ${formatAgeHours(bottleneck.averageAgeHours)} - ${bottleneck.confidence}% confidence`}
            />
          ))}
        </SignalSection>

        <SignalSection
          title="Priority recommendations"
          icon={ArrowUpRight}
          empty="No priority changes recommended."
        >
          {intelligence.priorityPredictions.slice(0, 3).map((prediction) => (
            <SignalRow
              key={prediction.id}
              title={prediction.title}
              description={prediction.reason}
              severity={severityFromScore(prediction.predictedScore)}
              metric={prediction.predictedPriority}
              detail={`${prediction.currentPriority} -> ${prediction.predictedPriority} - ${prediction.confidence}% confidence`}
            />
          ))}
        </SignalSection>
      </div>

      {topRecommendation && (
        <p className="mt-4 rounded-lg border border-border bg-card px-3 py-2 text-xs text-muted-foreground">
          Next best action:{" "}
          <span className="font-medium text-foreground">
            {formatAction(topRecommendation.recommendedAction)}
          </span>{" "}
          for {topRecommendation.title}
        </p>
      )}
    </section>
  );
}

function PanelHeader({
  generatedAt,
  engineVersion,
}: {
  generatedAt?: string;
  engineVersion?: string;
}) {
  return (
    <div className="mb-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400">
            <BrainCircuit className="h-4 w-4" />
            AI Workflow Intelligence
          </p>
          <h3 className="mt-1 text-lg font-semibold">
            Recommendations & risk signals
          </h3>
        </div>
        {engineVersion && <Badge variant="info">Rules engine</Badge>}
      </div>
      {generatedAt && (
        <p className="mt-1 text-xs text-muted-foreground">
          Updated {formatDateTime(generatedAt)}
        </p>
      )}
    </div>
  );
}

function SignalSection({
  title,
  icon: Icon,
  empty,
  children,
}: {
  title: string;
  icon: LucideIcon;
  empty: string;
  children: ReactNode;
}) {
  const hasChildren = Array.isArray(children) ? children.length > 0 : Boolean(children);

  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary" />
        <h4 className="text-sm font-semibold">{title}</h4>
      </div>
      <div className="space-y-2">
        {hasChildren ? children : <EmptyState message={empty} />}
      </div>
    </div>
  );
}

function SignalRow({
  title,
  description,
  severity,
  metric,
  detail,
}: {
  title: string;
  description: string;
  severity: AiInsightSeverity;
  metric: string;
  detail: string;
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
        <RiskScoreBadge score={metric} severity={severity} label={metric} />
      </div>
      <p className="mt-2 line-clamp-1 text-xs text-muted-foreground">{detail}</p>
    </div>
  );
}

function MetricPill({
  label,
  value,
  severity,
}: {
  label: string;
  value: string;
  severity: AiInsightSeverity;
}) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-md border border-border px-2.5 py-2 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <RiskScoreBadge score={value} severity={severity} label={value} />
    </div>
  );
}

function RiskScoreBadge({
  score,
  severity,
  label,
}: {
  score: number | string;
  severity: AiInsightSeverity;
  label: string;
}) {
  return (
    <span
      className={cn(
        "shrink-0 rounded-md px-2 py-1 text-xs font-semibold capitalize",
        severity === "critical" && "bg-red-500/10 text-red-600 dark:text-red-400",
        severity === "high" && "bg-red-500/10 text-red-600 dark:text-red-400",
        severity === "medium" && "bg-amber-500/10 text-amber-600 dark:text-amber-400",
        severity === "low" && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
      )}
      aria-label={`Risk score ${score}`}
    >
      {label}
    </span>
  );
}

function ConfidenceMeter({ value }: { value: number }) {
  return (
    <div className="mt-3">
      <div className="mb-1.5 flex justify-between text-xs">
        <span className="text-muted-foreground">Confidence</span>
        <span className="font-medium">{value}%</span>
      </div>
      <div
        className="h-2 overflow-hidden rounded-full bg-muted"
        role="meter"
        aria-label="Recommendation confidence"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={value}
      >
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function EvidenceList({ label, items }: { label: string; items: string[] }) {
  if (items.length === 0) return null;

  return (
    <div className="mt-3">
      <p className="text-[11px] font-medium uppercase text-muted-foreground">
        {label}
      </p>
      <div className="mt-1 flex flex-wrap gap-1.5">
        {items.slice(0, 3).map((item) => (
          <span
            key={item}
            className="rounded-md border border-border bg-card px-2 py-1 text-[11px] text-muted-foreground"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-3.5 w-3.5" />
        {message}
      </div>
    </div>
  );
}

function severityVariant(score: number): "success" | "warning" | "danger" | "info" {
  if (score >= 70) return "danger";
  if (score >= 45) return "warning";
  return "success";
}

function severityFromScore(score: number): AiInsightSeverity {
  if (score >= 88) return "critical";
  if (score >= 70) return "high";
  if (score >= 45) return "medium";
  return "low";
}

function formatAction(value: string): string {
  return value
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

function formatAgeHours(hours: number): string {
  if (hours < 1) return "<1h";
  if (hours < 24) return `${Math.round(hours)}h`;
  return `${Math.round(hours / 24)}d`;
}

function formatInr(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}
