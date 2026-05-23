"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { BrainCircuit, Clock3, Route, ShieldCheck, type LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { apiFetch } from "@/lib/api/client";
import { cn } from "@/lib/utils/cn";
import type {
  AiInsightSeverity,
  OperationsDashboardData,
  WorkflowIntelligenceData,
} from "@/lib/workflows/types";

type IntelligenceState =
  | { status: "loading"; data: null }
  | { status: "ready"; data: WorkflowIntelligenceData }
  | { status: "error"; data: null };

export function EnterpriseAiWorkflowIntelligence() {
  const [state, setState] = useState<IntelligenceState>({
    status: "loading",
    data: null,
  });

  useEffect(() => {
    let active = true;

    async function loadIntelligence() {
      const res = await apiFetch<OperationsDashboardData>("/api/operations/dashboard");
      if (!active) return;

      if (res.success && res.data?.intelligence) {
        setState({ status: "ready", data: res.data.intelligence });
        return;
      }

      setState({ status: "error", data: null });
    }

    loadIntelligence();

    return () => {
      active = false;
    };
  }, []);

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div>
          <CardTitle className="flex items-center gap-2">
            <BrainCircuit className="h-4 w-4 text-primary" />
            AI workflow intelligence
          </CardTitle>
          <CardDescription>Live risk, SLA, finance, and bottleneck signals</CardDescription>
        </div>
        <Badge variant="info">Enterprise</Badge>
      </CardHeader>
      <CardContent>
        {state.status === "loading" && (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {["Risk", "SLA", "Bottlenecks", "Priority"].map((label) => (
              <div key={label} className="rounded-lg border border-border p-3">
                <p className="text-xs text-muted-foreground">{label}</p>
                <div className="mt-2 h-5 w-16 rounded-md bg-muted" />
              </div>
            ))}
          </div>
        )}

        {state.status === "error" && (
          <p className="rounded-lg border border-dashed border-border p-3 text-sm text-muted-foreground">
            Workflow intelligence is not available right now.
          </p>
        )}

        {state.status === "ready" && <IntelligenceSummary intelligence={state.data} />}
      </CardContent>
    </Card>
  );
}

function IntelligenceSummary({
  intelligence,
}: {
  intelligence: WorkflowIntelligenceData;
}) {
  const topRecommendation = intelligence.approvalRecommendations[0];
  const topSla = intelligence.slaPredictions[0];
  const topBottleneck = intelligence.bottleneckInsights[0];

  return (
    <div className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryTile
          label="Max risk"
          value={`${intelligence.summary.maxRiskScore}/100`}
          detail={`${intelligence.summary.highRiskApprovals} high-risk approvals`}
          severity={severityFromScore(intelligence.summary.maxRiskScore)}
          icon={ShieldCheck}
        />
        <SummaryTile
          label="SLA breaches"
          value={String(intelligence.summary.predictedSlaBreaches)}
          detail={topSla ? `${topSla.probability}% top probability` : "No breach predicted"}
          severity={intelligence.summary.predictedSlaBreaches > 0 ? "high" : "low"}
          icon={Clock3}
        />
        <SummaryTile
          label="Bottlenecks"
          value={String(intelligence.summary.bottleneckInsights)}
          detail={topBottleneck ? topBottleneck.title : "No queue concentration"}
          severity={intelligence.summary.bottleneckInsights > 0 ? "medium" : "low"}
          icon={Route}
        />
        <SummaryTile
          label="Priority recs"
          value={String(intelligence.summary.priorityRecommendations)}
          detail={`${intelligence.financeAnomalies.length} finance anomalies`}
          severity={intelligence.summary.priorityRecommendations > 0 ? "medium" : "low"}
          icon={BrainCircuit}
        />
      </div>

      {topRecommendation && (
        <div className="flex flex-col gap-2 rounded-lg border border-border bg-muted/20 p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="line-clamp-1 text-sm font-medium">{topRecommendation.title}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {topRecommendation.rationale}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <SeverityBadge severity={severityFromScore(topRecommendation.riskScore)}>
              Risk {topRecommendation.riskScore}
            </SeverityBadge>
            <Badge variant="info">{topRecommendation.confidence}% confidence</Badge>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryTile({
  label,
  value,
  detail,
  severity,
  icon: Icon,
}: {
  label: string;
  value: string;
  detail: string;
  severity: AiInsightSeverity;
  icon: LucideIcon;
}) {
  return (
    <div className="rounded-lg border border-border p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="mt-1 text-xl font-semibold tracking-tight">{value}</p>
        </div>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent">
          <Icon className="h-4 w-4 text-accent-foreground" />
        </div>
      </div>
      <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{detail}</p>
      <div className="mt-2">
        <SeverityBadge severity={severity}>{severity}</SeverityBadge>
      </div>
    </div>
  );
}

function SeverityBadge({
  severity,
  children,
}: {
  severity: AiInsightSeverity;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium capitalize",
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

function severityFromScore(score: number): AiInsightSeverity {
  if (score >= 88) return "critical";
  if (score >= 70) return "high";
  if (score >= 45) return "medium";
  return "low";
}
