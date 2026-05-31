"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Bot,
  CheckCircle2,
  FileCheck2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import type {
  CommandCenterApproval,
  CommandCenterSignal,
  EnterpriseSignalSeverity,
  OperationsCommandCenterData,
} from "@/lib/operations/command-center-data";
import { cn } from "@/lib/utils/cn";

const FILTERS = ["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"] as const;
type SignalFilter = (typeof FILTERS)[number];

export function EnterpriseAiControlTower({
  data,
}: {
  data: OperationsCommandCenterData;
}) {
  const [filter, setFilter] = useState<SignalFilter>("ALL");
  const visibleSignals = useMemo(
    () =>
      filter === "ALL"
        ? data.signals
        : data.signals.filter((signal) => signal.severity === filter),
    [data.signals, filter],
  );
  const moduleCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const signal of data.signals) {
      counts.set(signal.module, (counts.get(signal.module) ?? 0) + 1);
    }
    return [...counts.entries()].sort((left, right) => right[1] - left[1]);
  }, [data.signals]);

  return (
    <section className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold">Enterprise AI control tower</h2>
          <p className="text-xs text-muted-foreground">
            Centralized operational alerts, module drill-down, suggested actions, and human approval gates.
          </p>
        </div>
        <Badge variant="info">{data.signals.length} enterprise signals</Badge>
      </div>

      <div className="grid gap-4 xl:grid-cols-12">
        <div className="xl:col-span-7">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-primary" />
                Enterprise signal queue
              </CardTitle>
              <CardDescription>Filter risks by severity and open the owning module for resolution</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-1 rounded-lg border border-border bg-muted/20 p-1">
                {FILTERS.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setFilter(item)}
                    className={cn(
                      "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                      filter === item
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    {formatStatus(item)}
                  </button>
                ))}
              </div>
              {visibleSignals.length === 0 ? (
                <EmptyState
                  icon={CheckCircle2}
                  title={`No ${formatStatus(filter)} signals`}
                  description="This severity queue is currently clear."
                />
              ) : (
                visibleSignals.slice(0, 10).map((signal) => (
                  <SignalLine key={signal.id} signal={signal} />
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4 xl:col-span-5">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-4 w-4 text-primary" />
                Module risk coverage
              </CardTitle>
              <CardDescription>Enterprise modules monitored by ASTRA AI controls</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {moduleCounts.length === 0 ? (
                <EmptyState icon={Bot} title="No module signals" description="AI module coverage will appear here." />
              ) : (
                moduleCounts.map(([module, count]) => (
                  <div key={module} className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
                    <span className="text-sm font-medium">{module}</span>
                    <Badge variant="info">{count} signal{count === 1 ? "" : "s"}</Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
          <HumanApprovalGuardrails approvals={data.approvals} />
        </div>
      </div>

      <SuggestedActions signals={data.signals} />
    </section>
  );
}

function SignalLine({ signal }: { signal: CommandCenterSignal }) {
  return (
    <Link
      href={signal.href}
      className="block rounded-lg border border-border p-3 transition-colors hover:bg-muted/40"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold">{signal.title}</p>
            <Badge variant="info">{signal.module}</Badge>
          </div>
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
            {signal.description}
          </p>
        </div>
        <SeverityBadge severity={signal.severity} />
      </div>
      <div className="mt-2 flex items-center justify-between gap-3 text-xs text-muted-foreground">
        <span>
          {formatStatus(signal.signalType)}
          {signal.confidence == null ? "" : ` | ${Math.round(signal.confidence)}% confidence`}
        </span>
        <ArrowRight className="h-4 w-4 shrink-0 text-primary" />
      </div>
    </Link>
  );
}

function HumanApprovalGuardrails({
  approvals,
}: {
  approvals: CommandCenterApproval[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" />
          Human approval guardrails
        </CardTitle>
        <CardDescription>Sensitive workflow actions remain approval-gated</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {approvals.length === 0 ? (
          <EmptyState icon={FileCheck2} title="No pending gates" description="Human approval queue is currently clear." />
        ) : (
          approvals.slice(0, 5).map((approval) => (
            <Link
              key={approval.id}
              href={approval.href}
              className="block rounded-lg border border-border p-3 transition-colors hover:bg-muted/40"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{approval.reference}</p>
                  <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{approval.title}</p>
                </div>
                <Badge variant="warning">{approval.module}</Badge>
              </div>
            </Link>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function SuggestedActions({ signals }: { signals: CommandCenterSignal[] }) {
  const prioritizedSignals = signals.filter((signal) =>
    ["HIGH", "CRITICAL"].includes(signal.severity),
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          Suggested enterprise actions
        </CardTitle>
        <CardDescription>AI-generated next actions for prioritized operational risks</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {prioritizedSignals.length === 0 ? (
          <EmptyState
            icon={CheckCircle2}
            title="No priority actions"
            description="There are no high-severity AI actions waiting for review."
          />
        ) : (
          prioritizedSignals.slice(0, 6).map((signal) => (
            <Link
              key={signal.id}
              href={signal.href}
              className="rounded-lg border border-border p-3 transition-colors hover:bg-muted/40"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-semibold">{signal.module}</p>
                <SeverityBadge severity={signal.severity} />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{signal.recommendedAction}</p>
            </Link>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function SeverityBadge({ severity }: { severity: EnterpriseSignalSeverity }) {
  return <Badge variant={severityVariant(severity)}>{severity.toLowerCase()}</Badge>;
}

function severityVariant(
  severity: EnterpriseSignalSeverity,
): "default" | "success" | "warning" | "danger" | "info" {
  if (severity === "CRITICAL" || severity === "HIGH") return "danger";
  if (severity === "MEDIUM") return "warning";
  return "success";
}

function formatStatus(value: string): string {
  return value
    .toLowerCase()
    .replaceAll("_", " ")
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
