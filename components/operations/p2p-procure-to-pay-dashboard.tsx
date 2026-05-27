import Link from "next/link";
import {
  AlertTriangle,
  Banknote,
  Bot,
  ClipboardCheck,
  FileText,
  GitBranch,
  IndianRupee,
  PackageCheck,
  ReceiptText,
  ShieldCheck,
  ShoppingCart,
  Timer,
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

const ACTIVE_STATUSES = new Set(["OPEN", "WAITING_APPROVAL", "BLOCKED", "EXCEPTION", "APPROVED"]);
const PENDING_STATUSES = new Set(["OPEN", "WAITING_APPROVAL", "BLOCKED", "EXCEPTION"]);

export function P2pProcureToPayDashboard({
  data,
}: {
  data: OperationModuleDashboardData;
}) {
  const metrics = buildP2pMetrics(data.records, data.riskAlerts);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Enterprise operations</p>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            P2P Procure-to-Pay
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Control procurement from requisition through payment approval with workflow,
            audit, finance impact, and AI exception visibility.
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

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          label="Pending PRs"
          value={String(metrics.pendingPrs)}
          change={`${formatInr(metrics.pendingPrValue)} requested spend`}
          trend={metrics.pendingPrs > 0 ? "neutral" : "up"}
          icon={FileText}
        />
        <StatCard
          label="Open POs"
          value={String(metrics.openPos)}
          change={`${formatInr(metrics.openPoValue)} committed spend`}
          trend={metrics.openPos > 0 ? "neutral" : "up"}
          icon={ShoppingCart}
        />
        <StatCard
          label="GRN pending"
          value={String(metrics.grnPending)}
          change={`${formatInr(metrics.grnPendingValue)} receipt exposure`}
          trend={metrics.grnPending > 0 ? "neutral" : "up"}
          icon={PackageCheck}
        />
        <StatCard
          label="Invoice mismatch alerts"
          value={String(metrics.invoiceMismatchAlerts)}
          change={`${metrics.criticalAlerts} critical or high signals`}
          trend={metrics.invoiceMismatchAlerts > 0 ? "down" : "up"}
          icon={AlertTriangle}
        />
        <StatCard
          label="Payment approvals"
          value={String(metrics.paymentApprovals)}
          change={`${formatInr(metrics.paymentApprovalValue)} queued for release`}
          trend={metrics.paymentApprovals > 0 ? "neutral" : "up"}
          icon={Banknote}
        />
        <StatCard
          label="Vendor risk score"
          value={`${metrics.vendorRiskScore}/100`}
          change={metrics.vendorRiskScore >= 75 ? "Risk review required" : "Within watch band"}
          trend={metrics.vendorRiskScore >= 75 ? "down" : "up"}
          icon={ShieldCheck}
        />
      </section>

      <section>
        <SectionHeading
          title="P2P workflow stages"
          description="Procurement lifecycle from purchase request through treasury release."
          badge={`${data.stages.length} stages`}
        />
        {data.stages.length === 0 ? (
          <EmptyState
            icon={GitBranch}
            title="No P2P stages configured"
            description="Procure-to-pay stages will appear here after setup or seed."
          />
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {data.stages.map((stage) => (
              <P2pStageCard key={stage.id} stage={stage} />
            ))}
          </div>
        )}
      </section>

      <section className="grid gap-4 xl:grid-cols-12">
        <div className="xl:col-span-7">
          <ProcurementQueue records={data.records} />
        </div>
        <div className="space-y-4 xl:col-span-5">
          <AiInsights alerts={data.riskAlerts} />
          <ApprovalStatus data={data} />
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

      <AuditTimeline events={data.auditEvents} />
    </div>
  );
}

function P2pStageCard({ stage }: { stage: OperationStage }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-semibold">
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
          <p className="text-muted-foreground">Control</p>
          <p className="mt-1 line-clamp-1 font-medium">
            {stage.automationLevel ?? "Manual"}
          </p>
        </div>
      </div>
    </div>
  );
}

function ProcurementQueue({ records }: { records: OperationRecord[] }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClipboardCheck className="h-4 w-4 text-primary" />
          P2P control queue
        </CardTitle>
        <CardDescription>Purchase requests, POs, receipts, invoices, and payments</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {records.length === 0 ? (
          <EmptyState
            icon={ClipboardCheck}
            title="No P2P records"
            description="Procurement transactions will appear here after intake."
          />
        ) : (
          records.map((record) => (
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
                  {record.counterparty ?? "Internal procurement"} | Owner{" "}
                  {formatRole(record.ownerRole)}
                </p>
              </div>
              <div className="grid gap-2 text-left lg:min-w-44 lg:text-right">
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

function AiInsights({ alerts }: { alerts: OperationRiskAlert[] }) {
  const orderedAlerts = [...alerts].sort(
    (a, b) => severityRank(b.severity) - severityRank(a.severity),
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-4 w-4 text-primary" />
          AI procurement insights
        </CardTitle>
        <CardDescription>
          Vendor risk, price variance, delayed procurement, and budget impact
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {orderedAlerts.length === 0 ? (
          <EmptyState
            icon={Bot}
            title="No active AI insights"
            description="AI procurement signals will appear here when detected."
          />
        ) : (
          orderedAlerts.map((alert) => (
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

function ApprovalStatus({ data }: { data: OperationModuleDashboardData }) {
  const waitingRecords = data.records.filter((record) => record.status === "WAITING_APPROVAL");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" />
          Approval status
        </CardTitle>
        <CardDescription>Workflow integration for PR, PO, invoice, and payment controls</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-2 rounded-lg border border-border bg-muted/20 p-3 text-sm">
          <SummaryRow label="Awaiting approval" value={String(waitingRecords.length)} />
          <SummaryRow label="Active approval flows" value={String(data.approvalFlows.length)} />
          <SummaryRow label="Exception records" value={String(data.kpis.exceptionRecords)} />
        </div>
        {data.approvalFlows.length === 0 ? (
          <EmptyState
            icon={ShieldCheck}
            title="No approval flows"
            description="P2P approval controls will appear here."
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
                <Badge variant="info">{formatRole(flow.approverRole)}</Badge>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                {flow.trigger}
                {flow.thresholdAmount == null ? "" : ` | ${formatInr(flow.thresholdAmount)}`}
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
          <IndianRupee className="h-4 w-4 text-primary" />
          Finance impact
        </CardTitle>
        <CardDescription>{data.module.financeCategory ?? "Accounts payable"}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {data.financeImpacts.length === 0 ? (
          <EmptyState
            icon={IndianRupee}
            title="No finance impact"
            description="P2P spend, liability, budget, and cash impacts will appear here."
          />
        ) : (
          <>
            <div className="rounded-lg border border-border bg-muted/20 p-4">
              <p className="text-xs text-muted-foreground">Net AP exposure</p>
              <p className="mt-1 text-2xl font-semibold">
                {formatInr(Math.abs(data.financeSummary.netImpact))}
              </p>
            </div>
            <div className="grid gap-2 text-sm">
              <SummaryRow label="Spend outflow" value={formatInr(data.financeSummary.outflow)} />
              <SummaryRow
                label="Budget exposure"
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
        <CardTitle className="flex items-center gap-2">
          <ReceiptText className="h-4 w-4 text-primary" />
          Finance impact lines
        </CardTitle>
        <CardDescription>Budget, liability, accrual, and payment exposure</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {impacts.length === 0 ? (
          <EmptyState
            icon={ReceiptText}
            title="No impact lines"
            description="Procurement finance impacts will appear here."
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
                  <Badge variant={impact.direction === "OUTFLOW" ? "warning" : "info"}>
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

function AuditTimeline({ events }: { events: OperationAuditEvent[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Timer className="h-4 w-4 text-primary" />
          Audit timeline
        </CardTitle>
        <CardDescription>Traceability for P2P workflow, AI, finance, and control events</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {events.length === 0 ? (
          <EmptyState
            icon={Timer}
            title="No audit events"
            description="P2P control events will appear here."
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
                {event.recordReference ?? "P2P module"} | {detailsText(event.details)}
              </p>
            </div>
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

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
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

function RiskScore({ score }: { score: number }) {
  const severity = score >= 85 ? "CRITICAL" : score >= 70 ? "HIGH" : score >= 50 ? "MEDIUM" : "LOW";
  return (
    <span
      className={cn(
        "inline-flex w-fit rounded-md px-2 py-0.5 text-xs font-medium lg:ml-auto",
        (severity === "CRITICAL" || severity === "HIGH") &&
          "bg-red-500/10 text-red-600 dark:text-red-400",
        severity === "MEDIUM" && "bg-amber-500/10 text-amber-600 dark:text-amber-400",
        severity === "LOW" && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
      )}
    >
      Risk {score}
    </span>
  );
}

function buildP2pMetrics(records: OperationRecord[], alerts: OperationRiskAlert[]) {
  const pendingPrs = records.filter(
    (record) => record.stageKey === "purchase_requisition" && PENDING_STATUSES.has(record.status),
  );
  const openPos = records.filter(
    (record) => record.stageKey === "purchase_order" && ACTIVE_STATUSES.has(record.status),
  );
  const grnPending = records.filter(
    (record) => record.stageKey === "goods_receipt_note" && PENDING_STATUSES.has(record.status),
  );
  const paymentApprovals = records.filter(
    (record) => record.stageKey === "payment_approval" && record.status === "WAITING_APPROVAL",
  );
  const invoiceMismatchAlerts = alerts.filter((alert) =>
    ["invoice_mismatch", "invoice_match_exception", "price_variance"].includes(alert.signalType),
  );
  const criticalAlerts = alerts.filter((alert) =>
    ["HIGH", "CRITICAL"].includes(alert.severity),
  ).length;
  const vendorRiskScore = Math.max(
    0,
    ...records
      .filter((record) => record.counterparty && record.counterparty !== "Internal procurement")
      .map((record) => record.riskScore),
    ...alerts
      .filter((alert) => alert.signalType === "vendor_risk")
      .map((alert) => Math.round(alert.confidence ?? 0)),
  );

  return {
    pendingPrs: pendingPrs.length,
    pendingPrValue: sumAmounts(pendingPrs),
    openPos: openPos.length,
    openPoValue: sumAmounts(openPos),
    grnPending: grnPending.length,
    grnPendingValue: sumAmounts(grnPending),
    invoiceMismatchAlerts: invoiceMismatchAlerts.length,
    paymentApprovals: paymentApprovals.length,
    paymentApprovalValue: sumAmounts(paymentApprovals),
    vendorRiskScore,
    criticalAlerts,
  };
}

function sumAmounts(records: OperationRecord[]): number {
  return records.reduce((total, record) => total + (record.amount ?? 0), 0);
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

function severityRank(severity: OperationRiskAlert["severity"]): number {
  return {
    LOW: 1,
    MEDIUM: 2,
    HIGH: 3,
    CRITICAL: 4,
  }[severity];
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
