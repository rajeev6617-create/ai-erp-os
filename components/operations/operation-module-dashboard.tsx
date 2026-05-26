import Link from "next/link";
import {
  AlertTriangle,
  Banknote,
  BrainCircuit,
  CheckCircle2,
  ClipboardCheck,
  FileClock,
  GitBranch,
  IndianRupee,
  ShieldCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardReportActions } from "@/components/reports/dashboard-report-actions";
import { EmptyState } from "@/components/ui/empty-state";
import { StatCard } from "@/components/ui/stat-card";
import { cn } from "@/lib/utils/cn";
import type {
  OperationAuditEvent,
  OperationFinanceImpact,
  OperationModuleDashboardData,
  OperationRecord,
  OperationRiskAlert,
  OperationStage,
} from "@/lib/operations/types";

export function OperationModuleDashboard({
  data,
}: {
  data: OperationModuleDashboardData;
}) {
  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Enterprise operations</p>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {data.module.name}
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            {data.module.description}
          </p>
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
        <DashboardReportActions />
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Open records"
          value={String(data.kpis.openRecords)}
          change={`${data.kpis.waitingApprovals} awaiting approval`}
          trend={data.kpis.openRecords > 0 ? "neutral" : "up"}
          icon={FileClock}
        />
        <StatCard
          label="Workflow completion"
          value={`${data.kpis.stageCompletionPercent}%`}
          change={`${data.stages.length} controlled stages`}
          trend={data.kpis.stageCompletionPercent > 50 ? "up" : "neutral"}
          icon={GitBranch}
        />
        <StatCard
          label="AI risk alerts"
          value={String(data.kpis.activeRiskAlerts)}
          change={`${data.kpis.highRiskAlerts} high or critical`}
          trend={data.kpis.highRiskAlerts > 0 ? "down" : "up"}
          icon={BrainCircuit}
        />
        <StatCard
          label="Finance exposure"
          value={formatInr(data.kpis.financeExposure)}
          change={`${formatInr(data.financeSummary.netImpact)} net`}
          trend={data.financeSummary.netImpact >= 0 ? "up" : "down"}
          icon={IndianRupee}
        />
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold">Workflow stages</h2>
            <p className="text-xs text-muted-foreground">
              SLA, automation, and current state across the operating cycle.
            </p>
          </div>
          <Badge variant="info">{formatRole(data.module.ownerRole)}</Badge>
        </div>
        {data.stages.length === 0 ? (
          <EmptyState
            icon={GitBranch}
            title="No workflow stages configured"
            description="Seeded or configured operation stages will appear here."
          />
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {data.stages.map((stage) => (
              <StageCard key={stage.id} stage={stage} />
            ))}
          </div>
        )}
      </section>

      <section className="grid gap-4 xl:grid-cols-12">
        <div className="xl:col-span-7">
          <OperationsRecords data={data.records} />
        </div>
        <div className="space-y-4 xl:col-span-5">
          <ApprovalFlows data={data} />
          <RiskAlerts alerts={data.riskAlerts} />
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-12">
        <div className="xl:col-span-5">
          <FinanceImpactSummary data={data} />
        </div>
        <div className="xl:col-span-7">
          <FinanceImpactLines impacts={data.financeImpacts} />
        </div>
      </section>

      <AuditLogs events={data.auditEvents} />
    </div>
  );
}

function StageCard({ stage }: { stage: OperationStage }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-semibold">
              {stage.sequence}
            </span>
            <h3 className="line-clamp-1 text-sm font-semibold">{stage.name}</h3>
          </div>
          <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
            {stage.description}
          </p>
        </div>
        <StatusBadge status={stage.status} />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
        <div>
          <p className="text-muted-foreground">SLA</p>
          <p className="mt-1 font-medium">{stage.slaHours ?? 0}h</p>
        </div>
        <div>
          <p className="text-muted-foreground">Automation</p>
          <p className="mt-1 line-clamp-1 font-medium">
            {stage.automationLevel ?? "Manual control"}
          </p>
        </div>
      </div>
    </div>
  );
}

function OperationsRecords({ data }: { data: OperationRecord[] }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClipboardCheck className="h-4 w-4 text-primary" />
          Operational records
        </CardTitle>
        <CardDescription>Transactions, exceptions, owners, and due dates</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {data.length === 0 ? (
          <EmptyState
            icon={ClipboardCheck}
            title="No operational records"
            description="Live transactions and exceptions will appear here after intake."
          />
        ) : (
          data.map((record) => (
            <div
              key={record.id}
              className="grid gap-3 rounded-lg border border-border p-3 lg:grid-cols-[1fr_auto]"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold">{record.reference}</p>
                  <StatusBadge status={record.status} />
                  {record.stageName && <Badge>{record.stageName}</Badge>}
                </div>
                <p className="mt-1 text-sm font-medium">{record.title}</p>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                  {record.description}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {record.counterparty ?? "Internal"} | Owner {formatRole(record.ownerRole)}
                </p>
              </div>
              <div className="grid gap-2 text-left lg:min-w-40 lg:text-right">
                <p className="text-sm font-semibold">
                  {record.amount == null ? "No amount" : formatInr(record.amount)}
                </p>
                <RiskScore score={record.riskScore} />
                <p className="text-xs text-muted-foreground">
                  {record.dueAt ? `Due ${formatDate(record.dueAt)}` : "No due date"}
                </p>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function ApprovalFlows({ data }: { data: OperationModuleDashboardData }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" />
          Approval flows
        </CardTitle>
        <CardDescription>Role-based control points for this module</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {data.approvalFlows.length === 0 ? (
          <EmptyState
            icon={ShieldCheck}
            title="No approval flows"
            description="Configured approval controls will appear here."
          />
        ) : (
          data.approvalFlows.map((flow) => (
            <div key={flow.id} className="rounded-lg border border-border p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{flow.name}</p>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                    {flow.description}
                  </p>
                </div>
                <Badge variant={flow.isActive ? "success" : "default"}>
                  {formatRole(flow.approverRole)}
                </Badge>
              </div>
              <div className="mt-3 grid gap-1 text-xs text-muted-foreground">
                <p>{flow.trigger}</p>
                <p>
                  {formatStatus(flow.approvalType)}
                  {flow.thresholdAmount != null
                    ? ` | ${formatInr(flow.thresholdAmount)} threshold`
                    : ""}
                </p>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function RiskAlerts({ alerts }: { alerts: OperationRiskAlert[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-primary" />
          AI risk and exception alerts
        </CardTitle>
        <CardDescription>Rules-engine signals linked to live operations</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts.length === 0 ? (
          <EmptyState
            icon={AlertTriangle}
            title="No active AI risk alerts"
            description="Risk and exception signals will appear here when detected."
          />
        ) : (
          alerts.map((alert) => (
            <div key={alert.id} className="rounded-lg border border-border p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{alert.title}</p>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                    {alert.description}
                  </p>
                </div>
                <SeverityBadge severity={alert.severity} />
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                {formatStatus(alert.signalType)}
                {alert.confidence == null
                  ? ""
                  : ` | ${Math.round(alert.confidence)}% confidence`}
                {alert.recordReference ? ` | ${alert.recordReference}` : ""}
              </p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function FinanceImpactSummary({ data }: { data: OperationModuleDashboardData }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Banknote className="h-4 w-4 text-primary" />
          Finance impact summary
        </CardTitle>
        <CardDescription>{data.module.financeCategory ?? "Operations finance"}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {data.financeImpacts.length === 0 ? (
          <EmptyState
            icon={Banknote}
            title="No finance impact lines"
            description="Financial exposure summaries will appear once operational records carry amounts."
          />
        ) : (
          <>
            <div className="rounded-lg border border-border bg-muted/20 p-4">
              <p className="text-xs text-muted-foreground">Net impact</p>
              <p className="mt-1 text-2xl font-semibold">
                {formatInr(data.financeSummary.netImpact)}
              </p>
            </div>
            <div className="grid gap-2 text-sm">
              <SummaryRow label="Inflow" value={formatInr(data.financeSummary.inflow)} />
              <SummaryRow label="Outflow" value={formatInr(data.financeSummary.outflow)} />
              <SummaryRow
                label="Neutral exposure"
                value={formatInr(data.financeSummary.neutralExposure)}
              />
              <SummaryRow label="Impact lines" value={String(data.financeImpacts.length)} />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function FinanceImpactLines({ impacts }: { impacts: OperationFinanceImpact[] }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Finance impact lines</CardTitle>
        <CardDescription>Operational events translated into financial exposure</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {impacts.length === 0 ? (
          <EmptyState
            icon={IndianRupee}
            title="No finance impact lines"
            description="Operational finance impacts will appear here after records are processed."
          />
        ) : (
          impacts.map((impact) => (
            <div
              key={impact.id}
              className="grid gap-3 rounded-lg border border-border p-3 md:grid-cols-[1fr_auto]"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold">{impact.title}</p>
                  <Badge variant={impact.direction === "INFLOW" ? "success" : impact.direction === "OUTFLOW" ? "warning" : "info"}>
                    {formatStatus(impact.direction)}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatStatus(impact.impactType)}
                  {impact.recordReference ? ` | ${impact.recordReference}` : ""}
                  {impact.period ? ` | ${impact.period}` : ""}
                </p>
              </div>
              <p className="text-left text-sm font-semibold md:text-right">
                {formatInr(impact.amount)}
              </p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function AuditLogs({ events }: { events: OperationAuditEvent[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-primary" />
          Audit logs
        </CardTitle>
        <CardDescription>Control events captured for operational traceability</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {events.length === 0 ? (
          <EmptyState
            icon={CheckCircle2}
            title="No audit events"
            description="Control and exception audit events will appear here."
          />
        ) : (
          events.map((event) => (
            <div key={event.id} className="rounded-lg border border-border p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="line-clamp-1 text-sm font-semibold">
                    {formatStatus(event.action)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {event.actor ?? "System"} | {formatDate(event.createdAt)}
                  </p>
                </div>
                <Badge variant={auditVariant(event.severity)}>
                  {event.severity.toLowerCase()}
                </Badge>
              </div>
              <p className="mt-3 line-clamp-2 text-xs text-muted-foreground">
                {event.recordReference ?? "Module control"} | {detailsText(event.details)}
              </p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function RiskScore({ score }: { score: number }) {
  const severity = score >= 85 ? "CRITICAL" : score >= 70 ? "HIGH" : score >= 50 ? "MEDIUM" : "LOW";
  return (
    <span
      className={cn(
        "inline-flex w-fit rounded-md px-2 py-0.5 text-xs font-medium lg:ml-auto",
        severity === "CRITICAL" && "bg-red-500/10 text-red-600 dark:text-red-400",
        severity === "HIGH" && "bg-red-500/10 text-red-600 dark:text-red-400",
        severity === "MEDIUM" && "bg-amber-500/10 text-amber-600 dark:text-amber-400",
        severity === "LOW" && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
      )}
    >
      Risk {score}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  return <Badge variant={statusVariant(status)}>{formatStatus(status)}</Badge>;
}

function SeverityBadge({
  severity,
}: {
  severity: OperationRiskAlert["severity"];
}) {
  return <Badge variant={severityVariant(severity)}>{severity.toLowerCase()}</Badge>;
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function statusVariant(status: string): "default" | "success" | "warning" | "danger" | "info" {
  if (["COMPLETED", "APPROVED"].includes(status)) return "success";
  if (["WAITING_APPROVAL", "IN_PROGRESS", "OPEN"].includes(status)) return "warning";
  if (["BLOCKED", "EXCEPTION", "FAILED"].includes(status)) return "danger";
  return "default";
}

function severityVariant(
  severity: OperationRiskAlert["severity"],
): "default" | "success" | "warning" | "danger" | "info" {
  if (severity === "CRITICAL" || severity === "HIGH") return "danger";
  if (severity === "MEDIUM") return "warning";
  return "success";
}

function auditVariant(severity: string): "default" | "success" | "warning" | "danger" | "info" {
  if (severity === "CRITICAL" || severity === "ERROR") return "danger";
  if (severity === "WARNING") return "warning";
  if (severity === "INFO") return "info";
  return "default";
}

function formatStatus(status: string): string {
  return status
    .toLowerCase()
    .replaceAll(".", " ")
    .replaceAll("_", " ")
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatRole(role: string | null): string {
  if (!role) return "Unassigned";
  return formatStatus(role.replaceAll("-", " "));
}

function formatInr(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
    notation: Math.abs(amount) >= 1000000 ? "compact" : "standard",
  }).format(amount);
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

function detailsText(details: Record<string, unknown> | null): string {
  if (!details) return "No details";
  return Object.entries(details)
    .filter(([key]) => key !== "seedProfile")
    .map(([key, value]) => `${formatStatus(key)} ${String(value)}`)
    .slice(0, 2)
    .join(" | ");
}
