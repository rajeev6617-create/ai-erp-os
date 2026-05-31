import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Bot,
  ClipboardCheck,
  FileCheck2,
  GitBranch,
  IndianRupee,
  Layers3,
  ReceiptText,
  ShieldCheck,
  Timer,
} from "lucide-react";
import { DashboardReportActions } from "@/components/reports/dashboard-report-actions";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatCard } from "@/components/ui/stat-card";
import type {
  CommandCenterApproval,
  CommandCenterAuditEvent,
  CommandCenterFinanceImpact,
  CommandCenterJourney,
  CommandCenterModuleSummary,
  CommandCenterSignal,
  CommandCenterModuleStatus,
  EnterpriseSignalSeverity,
  OperationsCommandCenterData,
} from "@/lib/operations/command-center-data";

export function OperationsCommandCenterDashboard({
  data,
}: {
  data: OperationsCommandCenterData;
}) {
  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Enterprise operations</p>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            ASTRA Operations Command Center
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Cross-module control tower for procurement, revenue, accounting, relationships,
            inventory, production, approvals, finance impact, and audit exceptions.
          </p>
        </div>
        <DashboardReportActions />
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          label="Connected modules"
          value={String(data.summary.connectedModules)}
          change="Operations, relationships, supply chain, and access"
          trend="up"
          icon={Layers3}
        />
        <StatCard
          label="Open controls"
          value={String(data.summary.openControls)}
          change={`${data.summary.pendingApprovals} pending approvals`}
          trend={data.summary.openControls > 0 ? "neutral" : "up"}
          icon={ClipboardCheck}
        />
        <StatCard
          label="AI risk alerts"
          value={String(data.summary.highRiskAlerts)}
          change={`${data.signals.length} enterprise signals`}
          trend={data.summary.highRiskAlerts > 0 ? "down" : "up"}
          icon={Bot}
        />
        <StatCard
          label="Finance exposure"
          value={formatInr(data.summary.financeExposure)}
          change={`${data.financeImpacts.length} linked impact lines`}
          trend="neutral"
          icon={IndianRupee}
        />
        <StatCard
          label="Audit events"
          value={String(data.summary.auditEvents)}
          change="Cross-module evidence timeline"
          trend="neutral"
          icon={Timer}
        />
        <StatCard
          label="Control journeys"
          value={String(data.journeys.length)}
          change="Source-to-pay, lead-to-cash, fulfill, and report"
          trend="up"
          icon={GitBranch}
        />
      </section>

      <section>
        <SectionHeading
          title="Module command grid"
          description="Operational health, pending decisions, finance exposure, and drill-down."
          badge={`${data.modules.length} connected`}
        />
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {data.modules.map((module) => (
            <ModuleSummaryCard key={module.slug} module={module} />
          ))}
        </div>
      </section>

      <section>
        <SectionHeading
          title="End-to-end workflow linking"
          description="Connected control chains spanning relationship, operations, supply chain, and finance."
          badge={`${data.journeys.length} journeys`}
        />
        <div className="grid gap-3 md:grid-cols-2">
          {data.journeys.map((journey) => (
            <JourneyCard key={journey.id} journey={journey} />
          ))}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-12">
        <div className="xl:col-span-7">
          <EnterpriseSignalQueue signals={data.signals} />
        </div>
        <div className="xl:col-span-5">
          <PendingApprovals approvals={data.approvals} />
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-12">
        <div className="xl:col-span-7">
          <FinanceImpactLines impacts={data.financeImpacts} />
        </div>
        <div className="xl:col-span-5">
          <AuditTimeline events={data.auditEvents} />
        </div>
      </section>
    </div>
  );
}

function ModuleSummaryCard({ module }: { module: CommandCenterModuleSummary }) {
  return (
    <Link
      href={module.href}
      className="rounded-lg border border-border bg-card p-4 transition-colors hover:bg-muted/40"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold">{module.label}</p>
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
            {module.description}
          </p>
        </div>
        <ModuleStatusBadge status={module.status} />
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
        <Metric label="Open" value={String(module.openItems)} />
        <Metric label="Approval" value={String(module.pendingApprovals)} />
        <Metric label="Risk" value={String(module.highRiskAlerts)} />
      </div>
      <div className="mt-3 flex items-center justify-between gap-3 text-xs">
        <span className="text-muted-foreground">
          {module.financeExposure > 0 ? formatInr(module.financeExposure) : "No direct exposure"}
        </span>
        <ArrowRight className="h-4 w-4 text-primary" />
      </div>
    </Link>
  );
}

function JourneyCard({ journey }: { journey: CommandCenterJourney }) {
  return (
    <Link
      href={journey.href}
      className="rounded-lg border border-border bg-card p-4 transition-colors hover:bg-muted/40"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold">{journey.title}</p>
          <p className="mt-1 text-xs text-muted-foreground">{journey.description}</p>
        </div>
        <ModuleStatusBadge status={journey.status} />
      </div>
      <div className="mt-3 flex items-center justify-between gap-3 text-xs">
        <span className="text-muted-foreground">{journey.controlCount} linked controls</span>
        <ArrowRight className="h-4 w-4 text-primary" />
      </div>
    </Link>
  );
}

function EnterpriseSignalQueue({ signals }: { signals: CommandCenterSignal[] }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-primary" />
          Enterprise AI exception queue
        </CardTitle>
        <CardDescription>Cross-module risks with module drill-down and owner action</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {signals.length === 0 ? (
          <EmptyState
            icon={Bot}
            title="No enterprise alerts"
            description="AI risk and exception signals will appear here."
          />
        ) : (
          signals.slice(0, 8).map((signal) => (
            <Link
              key={signal.id}
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
              <p className="mt-2 line-clamp-1 text-xs text-muted-foreground">
                {signal.recommendedAction}
              </p>
            </Link>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function PendingApprovals({ approvals }: { approvals: CommandCenterApproval[] }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" />
          Pending approvals
        </CardTitle>
        <CardDescription>Human decisions required across enterprise workflows</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {approvals.length === 0 ? (
          <EmptyState
            icon={FileCheck2}
            title="No pending approvals"
            description="Approval queues are currently clear."
          />
        ) : (
          approvals.slice(0, 8).map((approval) => (
            <Link
              key={approval.id}
              href={approval.href}
              className="block rounded-lg border border-border p-3 transition-colors hover:bg-muted/40"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold">{approval.reference}</p>
                    <Badge variant="warning">{approval.module}</Badge>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                    {approval.title}
                  </p>
                </div>
                <p className="text-xs font-semibold">
                  {approval.amount == null ? "Review" : formatInr(approval.amount)}
                </p>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Owner {formatRole(approval.ownerRole)}
                {approval.dueAt ? ` | Due ${formatDate(approval.dueAt)}` : ""}
              </p>
            </Link>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function FinanceImpactLines({ impacts }: { impacts: CommandCenterFinanceImpact[] }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IndianRupee className="h-4 w-4 text-primary" />
          Finance impact summary
        </CardTitle>
        <CardDescription>Largest cross-module spend, revenue, cash, and exposure lines</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {impacts.length === 0 ? (
          <EmptyState
            icon={ReceiptText}
            title="No finance impacts"
            description="Linked module impacts will appear here."
          />
        ) : (
          impacts.slice(0, 10).map((impact) => (
            <Link
              key={impact.id}
              href={impact.href}
              className="grid gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted/40 md:grid-cols-[1fr_auto]"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold">{impact.title}</p>
                  <Badge variant={directionVariant(impact.direction)}>
                    {formatStatus(impact.direction)}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {impact.module} | {formatStatus(impact.impactType)}
                  {impact.period ? ` | ${impact.period}` : ""}
                </p>
              </div>
              <p className="text-sm font-semibold md:text-right">{formatInr(impact.amount)}</p>
            </Link>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function AuditTimeline({ events }: { events: CommandCenterAuditEvent[] }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Timer className="h-4 w-4 text-primary" />
          Audit timeline
        </CardTitle>
        <CardDescription>Latest enterprise control evidence and exception events</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {events.length === 0 ? (
          <EmptyState
            icon={Timer}
            title="No audit events"
            description="Cross-module evidence will appear here."
          />
        ) : (
          events.slice(0, 10).map((event) => (
            <Link
              key={event.id}
              href={event.href}
              className="block rounded-lg border border-border p-3 transition-colors hover:bg-muted/40"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="line-clamp-1 text-sm font-semibold">
                    {formatStatus(event.action)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {event.module}
                    {event.reference ? ` | ${event.reference}` : ""}
                  </p>
                </div>
                <Badge variant={auditVariant(event.severity)}>
                  {event.severity.toLowerCase()}
                </Badge>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{formatDate(event.createdAt)}</p>
            </Link>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function SectionHeading({
  title,
  description,
  badge,
}: {
  title: string;
  description: string;
  badge: string;
}) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <div>
        <h2 className="text-sm font-semibold">{title}</h2>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Badge variant="info">{badge}</Badge>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-muted/50 p-2">
      <p className="text-muted-foreground">{label}</p>
      <p className="mt-0.5 font-semibold">{value}</p>
    </div>
  );
}

function ModuleStatusBadge({ status }: { status: CommandCenterModuleStatus }) {
  return (
    <Badge
      variant={status === "attention" ? "danger" : status === "watch" ? "warning" : "success"}
    >
      {status}
    </Badge>
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

function directionVariant(direction: string): "default" | "success" | "warning" | "danger" | "info" {
  if (direction === "INFLOW") return "success";
  if (direction === "OUTFLOW") return "warning";
  return "info";
}

function auditVariant(severity: string): "default" | "success" | "warning" | "danger" | "info" {
  if (severity === "CRITICAL" || severity === "ERROR") return "danger";
  if (severity === "WARNING") return "warning";
  if (severity === "INFO") return "info";
  return "default";
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
