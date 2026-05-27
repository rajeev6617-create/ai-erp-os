import Link from "next/link";
import {
  AlertTriangle,
  Banknote,
  Bot,
  CalendarClock,
  ChartNoAxesCombined,
  ClipboardCheck,
  FileText,
  GitBranch,
  IndianRupee,
  ReceiptText,
  ShieldCheck,
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
const AI_R2R_SIGNALS = new Set([
  "unusual_journal_entry",
  "reconciliation_anomaly",
  "closing_delay_prediction",
  "expense_variance_alert",
  "audit_risk_signal",
]);

export function R2rRecordToReportDashboard({
  data,
}: {
  data: OperationModuleDashboardData;
}) {
  const metrics = buildR2rMetrics(data.records, data.riskAlerts, data.financeImpacts);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Enterprise operations</p>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            R2R Record-to-Report
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Control journals, ledger posting, reconciliations, financial close, reporting,
            and audit review with finance linkage and AI exception intelligence.
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
          label="Pending journals"
          value={String(metrics.pendingJournals)}
          change={`${formatInr(metrics.pendingJournalValue)} awaiting review`}
          trend={metrics.pendingJournals > 0 ? "neutral" : "up"}
          icon={FileText}
        />
        <StatCard
          label="Reconciliation status"
          value={String(metrics.reconciliationExceptions)}
          change={`${formatInr(metrics.reconciliationExposure)} exception exposure`}
          trend={metrics.reconciliationExceptions > 0 ? "down" : "up"}
          icon={Banknote}
        />
        <StatCard
          label="Closing checklist"
          value={String(metrics.closingTasks)}
          change={`${metrics.closingApprovalCount} awaiting close approval`}
          trend={metrics.closingTasks > 0 ? "neutral" : "up"}
          icon={ClipboardCheck}
        />
        <StatCard
          label="Trial balance summary"
          value={formatInr(metrics.trialBalanceVariance)}
          change={`${metrics.trialBalanceRecords} trial balance controls`}
          trend={metrics.trialBalanceVariance > 0 ? "down" : "up"}
          icon={ChartNoAxesCombined}
        />
        <StatCard
          label="P&L overview"
          value={formatInr(metrics.plNet)}
          change={`${formatInr(metrics.plRevenue)} revenue against ${formatInr(metrics.plExpense)} expense`}
          trend={metrics.plNet >= 0 ? "up" : "down"}
          icon={IndianRupee}
        />
        <StatCard
          label="Balance sheet snapshot"
          value={formatInr(metrics.balanceSheetNet)}
          change={`${formatInr(metrics.balanceSheetAssets)} assets tracked`}
          trend={metrics.balanceSheetNet >= 0 ? "neutral" : "down"}
          icon={ReceiptText}
        />
        <StatCard
          label="Audit exceptions"
          value={String(metrics.auditExceptions)}
          change={`${metrics.highRiskAlerts} high or critical AI signals`}
          trend={metrics.auditExceptions > 0 ? "down" : "up"}
          icon={AlertTriangle}
        />
        <StatCard
          label="AI R2R alerts"
          value={String(metrics.aiR2rAlerts)}
          change="Journal, close, variance, and audit risk coverage"
          trend={metrics.aiR2rAlerts > 0 ? "neutral" : "up"}
          icon={Bot}
        />
      </section>

      <section>
        <SectionHeading
          title="R2R workflow stages"
          description="Accounting, closing, reconciliation, financial reporting, and audit review controls."
          badge={`${data.stages.length} stages`}
        />
        {data.stages.length === 0 ? (
          <EmptyState
            icon={GitBranch}
            title="No R2R stages configured"
            description="Record-to-report stages will appear here after setup or seed."
          />
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {data.stages.map((stage) => (
              <R2rStageCard key={stage.id} stage={stage} />
            ))}
          </div>
        )}
      </section>

      <section className="grid gap-4 xl:grid-cols-12">
        <div className="xl:col-span-7">
          <AccountingControlQueue records={data.records} />
        </div>
        <div className="space-y-4 xl:col-span-5">
          <AiR2rInsights alerts={data.riskAlerts} />
          <ApprovalTracking data={data} />
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-12">
        <div className="xl:col-span-5">
          <FinanceLinkage data={data} metrics={metrics} />
        </div>
        <div className="xl:col-span-7">
          <FinanceImpactLines impacts={data.financeImpacts} />
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-12">
        <div className="xl:col-span-7">
          <AuditTimeline events={data.auditEvents} />
        </div>
        <div className="xl:col-span-5">
          <ComplianceReview data={data} />
        </div>
      </section>
    </div>
  );
}

function R2rStageCard({ stage }: { stage: OperationStage }) {
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
            {stage.automationLevel ?? "Manual control"}
          </p>
        </div>
      </div>
    </div>
  );
}

function AccountingControlQueue({ records }: { records: OperationRecord[] }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClipboardCheck className="h-4 w-4 text-primary" />
          R2R control queue
        </CardTitle>
        <CardDescription>Journals, ledger posting, reconciliations, close, statements, MIS, and audit review</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {records.length === 0 ? (
          <EmptyState
            icon={ClipboardCheck}
            title="No R2R records"
            description="Accounting and reporting controls will appear here after intake."
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
                  {record.counterparty ?? "Internal accounting"} | Owner {formatRole(record.ownerRole)}
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

function AiR2rInsights({ alerts }: { alerts: OperationRiskAlert[] }) {
  const sortedAlerts = alerts.slice().sort((left, right) => severityRank(right.severity) - severityRank(left.severity));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-4 w-4 text-primary" />
          AI R2R insights
        </CardTitle>
        <CardDescription>Unusual journals, reconciliation anomalies, close delay, expense variance, and audit risk signals</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {sortedAlerts.length === 0 ? (
          <EmptyState
            icon={Bot}
            title="No AI R2R alerts"
            description="AI accounting and reporting exceptions will appear here."
          />
        ) : (
          sortedAlerts.map((alert) => (
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
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                <Badge variant="info">{formatStatus(alert.signalType)}</Badge>
                {alert.recordReference && <span>{alert.recordReference}</span>}
                {alert.confidence != null && <span>{Math.round(alert.confidence)}% confidence</span>}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function ApprovalTracking({ data }: { data: OperationModuleDashboardData }) {
  const waitingRecords = data.records.filter((record) => record.status === "WAITING_APPROVAL");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" />
          Approval tracking
        </CardTitle>
        <CardDescription>Journal, reconciliation, close, statement, and audit sign-offs</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <SummaryTile label="Waiting records" value={String(waitingRecords.length)} />
          <SummaryTile label="Approval flows" value={String(data.approvalFlows.length)} />
        </div>
        {data.approvalFlows.length === 0 ? (
          <EmptyState
            icon={ShieldCheck}
            title="No approval flows"
            description="R2R approval controls will appear here."
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

function FinanceLinkage({
  data,
  metrics,
}: {
  data: OperationModuleDashboardData;
  metrics: ReturnType<typeof buildR2rMetrics>;
}) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IndianRupee className="h-4 w-4 text-primary" />
          Finance linkage
        </CardTitle>
        <CardDescription>{data.module.financeCategory ?? "General ledger"}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {data.financeImpacts.length === 0 ? (
          <EmptyState
            icon={IndianRupee}
            title="No finance linkage"
            description="R2R finance impact and statement links will appear here."
          />
        ) : (
          <>
            <div className="rounded-lg border border-border bg-muted/20 p-4">
              <p className="text-xs text-muted-foreground">Statement net position</p>
              <p className="mt-1 text-2xl font-semibold">
                {formatInr(metrics.plNet + metrics.balanceSheetNet)}
              </p>
            </div>
            <div className="grid gap-2 text-sm">
              <SummaryRow label="P&L net" value={formatInr(metrics.plNet)} />
              <SummaryRow label="Balance sheet net" value={formatInr(metrics.balanceSheetNet)} />
              <SummaryRow label="Neutral exposure" value={formatInr(data.financeSummary.neutralExposure)} />
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
        <CardDescription>Accrual, reconciliation, trial balance, P&L, balance sheet, and audit exposure</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {impacts.length === 0 ? (
          <EmptyState
            icon={ReceiptText}
            title="No impact lines"
            description="R2R finance impacts will appear here."
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
                  <Badge variant={financeDirectionVariant(impact.direction)}>
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
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Timer className="h-4 w-4 text-primary" />
          Audit timeline
        </CardTitle>
        <CardDescription>Traceability for journal, ledger, close, reporting, and compliance review controls</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2">
        {events.length === 0 ? (
          <EmptyState
            icon={Timer}
            title="No audit events"
            description="R2R control events will appear here."
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
                {event.recordReference ?? "R2R module"} | {detailsText(event.details)}
              </p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function ComplianceReview({ data }: { data: OperationModuleDashboardData }) {
  const auditRecords = data.records.filter((record) => record.stageKey === "audit_review");
  const auditRiskAlerts = data.riskAlerts.filter((alert) =>
    ["audit_risk_signal", "unusual_journal_entry"].includes(alert.signalType),
  );
  const complianceEvents = data.auditEvents.filter((event) =>
    event.action.includes("audit") || event.action.includes("close") || event.severity === "CRITICAL",
  );

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarClock className="h-4 w-4 text-primary" />
          Compliance review
        </CardTitle>
        <CardDescription>Audit readiness, close controls, and evidence remediation</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <SummaryTile label="Audit records" value={String(auditRecords.length)} />
          <SummaryTile label="Risk signals" value={String(auditRiskAlerts.length)} />
          <SummaryTile label="Evidence events" value={String(complianceEvents.length)} />
          <SummaryTile label="High risks" value={String(data.kpis.highRiskAlerts)} />
        </div>
        {auditRecords.length === 0 ? (
          <EmptyState
            icon={CalendarClock}
            title="No compliance review items"
            description="Audit review records will appear here."
          />
        ) : (
          auditRecords.map((record) => (
            <div key={record.id} className="rounded-lg border border-border p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{record.title}</p>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                    {record.description}
                  </p>
                </div>
                <StatusBadge status={record.status} />
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                {record.reference} | Owner {formatRole(record.ownerRole)} | Risk {record.riskScore}
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

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/20 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
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

function buildR2rMetrics(
  records: OperationRecord[],
  alerts: OperationRiskAlert[],
  impacts: OperationFinanceImpact[],
) {
  const pendingJournals = records.filter(
    (record) => record.stageKey === "journal_entry" && PENDING_STATUSES.has(record.status),
  );
  const reconciliationRecords = records.filter(
    (record) => record.stageKey === "bank_reconciliation" && ACTIVE_STATUSES.has(record.status),
  );
  const reconciliationExceptions = reconciliationRecords.filter((record) =>
    ["BLOCKED", "EXCEPTION"].includes(record.status),
  );
  const closingRecords = records.filter(
    (record) => record.stageKey === "period_closing" && PENDING_STATUSES.has(record.status),
  );
  const trialBalanceRecords = records.filter(
    (record) => record.stageKey === "trial_balance" && ACTIVE_STATUSES.has(record.status),
  );
  const auditExceptionRecords = records.filter(
    (record) => record.stageKey === "audit_review" && ["BLOCKED", "EXCEPTION"].includes(record.status),
  );
  const plRevenue = sumImpacts(impacts, new Set(["pl_revenue"]));
  const plExpense = sumImpacts(impacts, new Set(["pl_expense", "journal_accrual", "expense_variance"]));
  const balanceSheetAssets = sumImpacts(impacts, new Set(["balance_sheet_asset"]));
  const balanceSheetLiabilities = sumImpacts(impacts, new Set(["balance_sheet_liability"]));

  return {
    pendingJournals: pendingJournals.length,
    pendingJournalValue: sumRecords(pendingJournals),
    reconciliationExceptions: reconciliationExceptions.length,
    reconciliationExposure:
      sumRecords(reconciliationExceptions) + sumImpacts(impacts, new Set(["reconciliation_variance"])),
    closingTasks: closingRecords.length,
    closingApprovalCount: closingRecords.filter((record) => record.status === "WAITING_APPROVAL").length,
    trialBalanceRecords: trialBalanceRecords.length,
    trialBalanceVariance: sumRecords(trialBalanceRecords) + sumImpacts(impacts, new Set(["trial_balance_variance"])),
    plRevenue,
    plExpense,
    plNet: plRevenue - plExpense,
    balanceSheetAssets,
    balanceSheetLiabilities,
    balanceSheetNet: balanceSheetAssets - balanceSheetLiabilities,
    auditExceptions: auditExceptionRecords.length,
    highRiskAlerts: alerts.filter((alert) => ["HIGH", "CRITICAL"].includes(alert.severity)).length,
    aiR2rAlerts: alerts.filter((alert) => AI_R2R_SIGNALS.has(alert.signalType)).length,
  };
}

function sumRecords(records: OperationRecord[]): number {
  return records.reduce((total, record) => total + (record.amount ?? 0), 0);
}

function sumImpacts(impacts: OperationFinanceImpact[], types: Set<string>): number {
  return impacts
    .filter((impact) => types.has(impact.impactType))
    .reduce((total, impact) => total + impact.amount, 0);
}

function statusVariant(status: string): "default" | "success" | "warning" | "danger" | "info" {
  if (["COMPLETED", "APPROVED", "CLOSED"].includes(status)) return "success";
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

function financeDirectionVariant(direction: string): "default" | "success" | "warning" | "danger" | "info" {
  if (direction === "INFLOW") return "success";
  if (direction === "OUTFLOW") return "warning";
  if (direction === "NEUTRAL") return "info";
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
