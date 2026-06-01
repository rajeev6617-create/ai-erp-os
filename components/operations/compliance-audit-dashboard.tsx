import Link from "next/link";
import {
  AlertTriangle,
  BellRing,
  Bot,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  ClipboardCheck,
  FileCheck2,
  FileSearch,
  FileText,
  GitBranch,
  History,
  Landmark,
  Link2,
  ReceiptText,
  Scale,
  ShieldAlert,
  ShieldCheck,
  Timer,
  UploadCloud,
  type LucideIcon,
} from "lucide-react";
import { DashboardReportActions } from "@/components/reports/dashboard-report-actions";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import type {
  ComplianceAuditCapability,
  ComplianceAuditOperationsData,
  ComplianceAuditSeverity,
} from "@/lib/operations/compliance-audit-data";
import { cn } from "@/lib/utils/cn";

type ComplianceAuditView = "compliance" | "audit";
type BadgeVariant = "default" | "success" | "warning" | "danger" | "info";

const widgetIcons: Record<string, LucideIcon> = {
  "upcoming-due-dates": CalendarDays,
  "overdue-compliance": ShieldAlert,
  "open-audit-points": ClipboardCheck,
  "high-risk-observations": AlertTriangle,
  "gst-tds-alerts": ReceiptText,
  "pending-evidence": UploadCloud,
};

export function ComplianceAuditDashboard({
  data,
  view,
}: {
  data: ComplianceAuditOperationsData;
  view: ComplianceAuditView;
}) {
  return (
    <div className="space-y-6">
      <ComplianceAuditHeader asOf={data.asOf} view={view} />
      <WidgetGrid data={data} />
      <AiInsightsCard data={data} />
      {view === "compliance" ? (
        <ComplianceWorkspace data={data} />
      ) : (
        <AuditWorkspace data={data} />
      )}
      <WorkflowIntegration data={data} />
    </div>
  );
}

function ComplianceAuditHeader({
  asOf,
  view,
}: {
  asOf: string;
  view: ComplianceAuditView;
}) {
  const isCompliance = view === "compliance";

  return (
    <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p className="text-sm text-muted-foreground">Governance, risk, and statutory operations</p>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          {isCompliance ? "ASTRA Compliance Management" : "ASTRA Audit Management"}
        </h1>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
          {isCompliance
            ? "GST, TDS, statutory dates, filing governance, compliance evidence, notices, and escalation control."
            : "Internal audit programs, observations, corrective actions, evidence mapping, exceptions, approvals, and closure workflow."}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <WorkspaceLink
            active={isCompliance}
            href="/dashboard/operations/compliance"
            icon={ShieldCheck}
            label="Compliance"
          />
          <WorkspaceLink
            active={!isCompliance}
            href="/dashboard/operations/audit"
            icon={FileSearch}
            label="Audit"
          />
          <span className="text-xs text-muted-foreground">Demo snapshot {formatDate(asOf)}</span>
        </div>
      </div>
      <DashboardReportActions />
    </header>
  );
}

function WorkspaceLink({
  active,
  href,
  icon: Icon,
  label,
}: {
  active: boolean;
  href: string;
  icon: LucideIcon;
  label: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm font-medium transition-colors",
        active ? "bg-primary text-primary-foreground" : "bg-card hover:bg-muted",
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  );
}

function WidgetGrid({ data }: { data: ComplianceAuditOperationsData }) {
  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {data.widgets.map((widget) => (
        <StatCard
          key={widget.key}
          label={widget.label}
          value={widget.value}
          change={widget.change}
          trend={widget.trend}
          icon={widgetIcons[widget.key] ?? ShieldCheck}
        />
      ))}
    </section>
  );
}

function AiInsightsCard({ data }: { data: ComplianceAuditOperationsData }) {
  return (
    <section>
      <SectionHeading
        badge="AI monitored"
        description="Predictive control signals for statutory filings, audit anomalies, evidence quality, and recurring observations."
        title="ASTRA AI governance insights"
      />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {data.aiInsights.map((insight) => (
          <Card key={insight.id}>
            <CardContent className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <Bot className="h-5 w-5 text-primary" />
                <Badge variant={severityVariant(insight.severity)}>
                  {insight.severity.toLowerCase()}
                </Badge>
              </div>
              <div>
                <p className="text-lg font-semibold">{insight.metric}</p>
                <p className="mt-1 text-sm font-semibold">{insight.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{insight.description}</p>
              </div>
              <div className="rounded-md bg-muted/60 p-2 text-xs">
                <p className="font-medium">{insight.recommendedAction}</p>
                <p className="mt-1 text-muted-foreground">
                  {formatStatus(insight.insightType)} | {insight.confidence}% confidence
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

function ComplianceWorkspace({ data }: { data: ComplianceAuditOperationsData }) {
  return (
    <>
      <CapabilityGrid
        badge={`${data.complianceCapabilities.length} capabilities`}
        capabilities={data.complianceCapabilities}
        description="Connected statutory workspaces with ownership, obligations, filing controls, evidence, and response tracking."
        title="Compliance operations"
      />
      <section className="grid gap-4 xl:grid-cols-12">
        <div className="xl:col-span-7">
          <FilingTrackerCard data={data} />
        </div>
        <div className="xl:col-span-5">
          <DueDatesCard data={data} />
        </div>
      </section>
      <section className="grid gap-4 xl:grid-cols-12">
        <div className="xl:col-span-5">
          <LiveAssessmentsCard data={data} />
        </div>
        <div className="xl:col-span-7">
          <ComplianceCalendarCard data={data} />
        </div>
      </section>
      <section className="grid gap-4 xl:grid-cols-12">
        <div className="xl:col-span-6">
          <DocumentRepositoryCard data={data} />
        </div>
        <div className="xl:col-span-6">
          <NoticeResponseCard data={data} />
        </div>
      </section>
    </>
  );
}

function AuditWorkspace({ data }: { data: ComplianceAuditOperationsData }) {
  return (
    <>
      <CapabilityGrid
        badge={`${data.auditCapabilities.length} capabilities`}
        capabilities={data.auditCapabilities}
        description="Risk-based internal audit operations with control testing, evidence, remediation, approval, and closure."
        title="Audit operations"
      />
      <section className="grid gap-4 xl:grid-cols-12">
        <div className="xl:col-span-5">
          <AuditChecklistCard data={data} />
        </div>
        <div className="xl:col-span-7">
          <ObservationCard data={data} />
        </div>
      </section>
      <ActionTrackerCard data={data} />
      <section className="grid gap-4 xl:grid-cols-12">
        <div className="xl:col-span-6">
          <EvidenceMappingCard data={data} />
        </div>
        <div className="xl:col-span-6">
          <ExceptionRegisterCard data={data} />
        </div>
      </section>
      <section className="grid gap-4 xl:grid-cols-12">
        <div className="xl:col-span-6">
          <ApprovalHistoryCard data={data} />
        </div>
        <div className="xl:col-span-6">
          <ClosureWorkflowCard data={data} />
        </div>
      </section>
    </>
  );
}

function CapabilityGrid({
  badge,
  capabilities,
  description,
  title,
}: {
  badge: string;
  capabilities: ComplianceAuditCapability[];
  description: string;
  title: string;
}) {
  return (
    <section>
      <SectionHeading badge={badge} description={description} title={title} />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {capabilities.map((capability) => (
          <Card key={capability.id}>
            <CardContent className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <ShieldCheck className="h-5 w-5 text-primary" />
                <Badge variant={statusVariant(capability.status)}>
                  {formatStatus(capability.status)}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-semibold">{capability.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{capability.description}</p>
              </div>
              <p className="text-xs text-muted-foreground">
                {capability.controlCount} controls | {capability.owner}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

function FilingTrackerCard({ data }: { data: ComplianceAuditOperationsData }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ReceiptText className="h-4 w-4 text-primary" />
          GST and TDS filing tracker
        </CardTitle>
        <CardDescription>Return status, due dates, statutory liability, and filing ownership</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {data.filingTrackers.map((filing) => (
          <div key={filing.id} className="rounded-lg border border-border p-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold">{filing.returnName}</p>
                  <Badge variant="info">{filing.complianceType}</Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {filing.period} | Due {formatDate(filing.dueDate)} | {filing.owner}
                </p>
              </div>
              <div className="text-right">
                <Badge variant={statusVariant(filing.filingStatus)}>
                  {formatStatus(filing.filingStatus)}
                </Badge>
                <p className="mt-2 text-xs font-semibold">{formatInr(filing.liability)}</p>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function DueDatesCard({ data }: { data: ComplianceAuditOperationsData }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-primary" />
          Statutory due dates
        </CardTitle>
        <CardDescription>Priority obligations with accountable owner and next action</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {data.dueDates.map((item) => (
          <div key={item.id} className="rounded-lg border border-border p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold">{item.obligation}</p>
                  <Badge variant="info">{item.complianceType}</Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Due {formatDate(item.dueDate)} | {item.owner}
                </p>
              </div>
              <Badge variant={severityVariant(item.priority as ComplianceAuditSeverity)}>
                {item.priority.toLowerCase()}
              </Badge>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{formatStatus(item.status)}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function LiveAssessmentsCard({ data }: { data: ComplianceAuditOperationsData }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" />
          Live compliance assessments
        </CardTitle>
        <CardDescription>Prisma-backed tenant framework and current-period control status</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {data.compliance.assessments.slice(0, 6).map((assessment) => (
          <div key={assessment.id} className="rounded-lg border border-border p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">
                  {assessment.requirementTitle ?? assessment.frameworkName}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {assessment.frameworkCode} | {assessment.evidenceCount} evidence item(s)
                </p>
              </div>
              <Badge variant={statusVariant(assessment.status)}>
                {formatStatus(assessment.status)}
              </Badge>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function ComplianceCalendarCard({ data }: { data: ComplianceAuditOperationsData }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-primary" />
          Compliance calendar
        </CardTitle>
        <CardDescription>Upcoming statutory workload and filing readiness by date</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 md:grid-cols-2">
          {data.dueDates.map((item) => (
            <div key={item.id} className="rounded-lg border border-border p-3">
              <p className="text-xs font-semibold text-primary">{formatDate(item.dueDate)}</p>
              <p className="mt-1 text-sm font-semibold">{item.obligation}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {item.complianceType} | {item.owner}
              </p>
              <div className="mt-2">
                <Badge variant={statusVariant(item.status)}>{formatStatus(item.status)}</Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function DocumentRepositoryCard({ data }: { data: ComplianceAuditOperationsData }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          Compliance document repository
        </CardTitle>
        <CardDescription>Return packs, statutory workings, evidence, and authority responses</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {data.documents.map((document) => (
          <div key={document.id} className="rounded-lg border border-border p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">{document.documentName}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {document.reference} | {document.category} | {document.owner}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Updated {formatDateTime(document.updatedAt)}
                </p>
              </div>
              <Badge variant={statusVariant(document.status)}>{formatStatus(document.status)}</Badge>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function NoticeResponseCard({ data }: { data: ComplianceAuditOperationsData }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Landmark className="h-4 w-4 text-primary" />
          Notice and response tracker
        </CardTitle>
        <CardDescription>Authority notices, response deadlines, owners, and review status</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {data.notices.map((notice) => (
          <div key={notice.id} className="rounded-lg border border-border p-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">{notice.subject}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {notice.noticeNumber} | {notice.authority}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Response due {formatDate(notice.responseDueAt)} | {notice.owner}
                </p>
              </div>
              <Badge variant={statusVariant(notice.status)}>{formatStatus(notice.status)}</Badge>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function AuditChecklistCard({ data }: { data: ComplianceAuditOperationsData }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClipboardCheck className="h-4 w-4 text-primary" />
          Internal audit checklist
        </CardTitle>
        <CardDescription>Risk-based programs and test completion by audit area</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {data.auditChecklists.map((checklist) => {
          const completion = Math.round((checklist.completedItems / checklist.totalItems) * 100);
          return (
            <div key={checklist.id} className="rounded-lg border border-border p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">{checklist.checklistName}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {checklist.auditArea} | {checklist.owner}
                  </p>
                </div>
                <Badge variant={statusVariant(checklist.status)}>
                  {formatStatus(checklist.status)}
                </Badge>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary" style={{ width: `${completion}%` }} />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {checklist.completedItems} of {checklist.totalItems} tests complete ({completion}%)
              </p>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function ObservationCard({ data }: { data: ComplianceAuditOperationsData }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-primary" />
          Audit observations
        </CardTitle>
        <CardDescription>Severity-rated findings with accountable owner and remediation date</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {data.auditObservations.map((observation) => (
          <div key={observation.id} className="rounded-lg border border-border p-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold">{observation.title}</p>
                  <Badge variant="info">{observation.observationNumber}</Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {observation.auditArea} | Due {formatDate(observation.dueDate)} | {observation.owner}
                </p>
              </div>
              <Badge variant={severityVariant(observation.severity)}>
                {observation.severity.toLowerCase()}
              </Badge>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{formatStatus(observation.status)}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function ActionTrackerCard({ data }: { data: ComplianceAuditOperationsData }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-primary" />
          Audit action tracker
        </CardTitle>
        <CardDescription>Corrective actions, target dates, evidence progress, and closure readiness</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 lg:grid-cols-3">
        {data.auditActions.map((action) => (
          <div key={action.id} className="rounded-lg border border-border p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-primary">{action.actionNumber}</p>
                <p className="mt-1 text-sm font-semibold">{action.action}</p>
              </div>
              <Badge variant={statusVariant(action.status)}>{formatStatus(action.status)}</Badge>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {action.observationNumber} | Due {formatDate(action.dueDate)} | {action.owner}
            </p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${action.progressPercent}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{action.progressPercent}% complete</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function EvidenceMappingCard({ data }: { data: ComplianceAuditOperationsData }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link2 className="h-4 w-4 text-primary" />
          Evidence and document mapping
        </CardTitle>
        <CardDescription>Control workpapers, document references, ownership, and evidence gaps</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {data.evidenceMappings.map((mapping) => (
          <div key={mapping.id} className="rounded-lg border border-border p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">{mapping.evidenceName}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {mapping.controlReference} | {mapping.documentReference} | {mapping.owner}
                </p>
              </div>
              <Badge variant={statusVariant(mapping.status)}>{formatStatus(mapping.status)}</Badge>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function ExceptionRegisterCard({ data }: { data: ComplianceAuditOperationsData }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Scale className="h-4 w-4 text-primary" />
          Exception register
        </CardTitle>
        <CardDescription>Risk acceptance, remediation state, owner, and linked finance exposure</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {data.exceptions.map((exception) => (
          <div key={exception.id} className="rounded-lg border border-border p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">{exception.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {exception.exceptionNumber} | {exception.linkedObservation} | {exception.owner}
                </p>
                <p className="mt-1 text-xs font-semibold">
                  {exception.financeExposure > 0
                    ? formatInr(exception.financeExposure)
                    : "No direct finance exposure"}
                </p>
              </div>
              <Badge variant={statusVariant(exception.status)}>{formatStatus(exception.status)}</Badge>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function ApprovalHistoryCard({ data }: { data: ComplianceAuditOperationsData }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-4 w-4 text-primary" />
          Approval history
        </CardTitle>
        <CardDescription>Review and sign-off decisions for filings, responses, and audit closure</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {data.approvalHistory.map((approval) => (
          <div key={approval.id} className="rounded-lg border border-border p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">{approval.workflow}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {approval.reference} | {approval.approver}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {approval.action} | {formatDateTime(approval.actedAt)}
                </p>
              </div>
              <Badge variant={statusVariant(approval.status)}>{formatStatus(approval.status)}</Badge>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function ClosureWorkflowCard({ data }: { data: ComplianceAuditOperationsData }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileCheck2 className="h-4 w-4 text-primary" />
          Audit closure workflow
        </CardTitle>
        <CardDescription>Management response, evidence sign-off, approval, and closure status</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {data.closures.map((closure) => (
          <div key={closure.id} className="rounded-lg border border-border p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">{closure.auditArea}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {closure.auditReference} | {closure.closureStage}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Target {formatDate(closure.targetDate)} | {closure.approver}
                </p>
              </div>
              <Badge variant={statusVariant(closure.status)}>{formatStatus(closure.status)}</Badge>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function WorkflowIntegration({ data }: { data: ComplianceAuditOperationsData }) {
  return (
    <section>
      <SectionHeading
        badge={`${data.workflowIntegrations.length} integrations`}
        description="Approvals, immutable audit trail, finance impact, document tracking, and escalation reminders."
        title="Workflow integration"
      />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {data.workflowIntegrations.map((integration) => (
          <Link
            key={integration.id}
            href={integration.href}
            className="rounded-lg border border-border bg-card p-4 transition-colors hover:bg-muted/40"
          >
            <div className="flex items-start justify-between gap-3">
              <GitBranch className="h-5 w-5 text-primary" />
              <Badge variant={statusVariant(integration.status)}>
                {formatStatus(integration.status)}
              </Badge>
            </div>
            <p className="mt-3 text-sm font-semibold">{integration.title}</p>
            <p className="mt-1 text-xs text-muted-foreground">{integration.description}</p>
            <p className="mt-3 text-xs font-medium">{integration.linkedRecords} linked records</p>
          </Link>
        ))}
      </div>
      <section className="mt-4 grid gap-4 xl:grid-cols-12">
        <div className="xl:col-span-4">
          <EscalationReminderCard data={data} />
        </div>
        <div className="xl:col-span-4">
          <FinanceImpactCard data={data} />
        </div>
        <div className="xl:col-span-4">
          <AuditTimelineCard data={data} />
        </div>
      </section>
    </section>
  );
}

function EscalationReminderCard({ data }: { data: ComplianceAuditOperationsData }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BellRing className="h-4 w-4 text-primary" />
          Escalation reminders
        </CardTitle>
        <CardDescription>SLA reminders for owners and approvers</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {data.escalationReminders.map((reminder) => (
          <div key={reminder.id} className="rounded-lg border border-border p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">{reminder.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {reminder.owner} | {formatDateTime(reminder.dueAt)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{reminder.channel}</p>
              </div>
              <Badge variant={statusVariant(reminder.status)}>{formatStatus(reminder.status)}</Badge>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function FinanceImpactCard({ data }: { data: ComplianceAuditOperationsData }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CircleDollarSign className="h-4 w-4 text-primary" />
          Finance impact
        </CardTitle>
        <CardDescription>Statutory payables and control exposure</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {data.financeImpacts.map((impact) => (
          <div key={impact.id} className="rounded-lg border border-border p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">{impact.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {impact.impactType} | {impact.period}
                </p>
                <p className="mt-1 text-xs font-semibold">{formatInr(impact.amount)}</p>
              </div>
              <Badge variant={statusVariant(impact.status)}>{formatStatus(impact.status)}</Badge>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function AuditTimelineCard({ data }: { data: ComplianceAuditOperationsData }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Timer className="h-4 w-4 text-primary" />
          Audit log timeline
        </CardTitle>
        <CardDescription>Recent governance events and actor trail</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {data.auditLogs.map((event) => (
          <div key={event.id} className="rounded-lg border border-border p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">{event.action}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {event.reference} | {event.actor}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatDateTime(event.occurredAt)}
                </p>
              </div>
              <Badge variant={statusVariant(event.severity)}>{formatStatus(event.severity)}</Badge>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function SectionHeading({
  badge,
  description,
  title,
}: {
  badge: string;
  description: string;
  title: string;
}) {
  return (
    <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      <Badge variant="info">{badge}</Badge>
    </div>
  );
}

function severityVariant(severity: ComplianceAuditSeverity): BadgeVariant {
  if (severity === "CRITICAL" || severity === "HIGH") return "danger";
  if (severity === "MEDIUM") return "warning";
  return "success";
}

function statusVariant(status: string): BadgeVariant {
  if (
    [
      "ACKNOWLEDGED",
      "ACTIVE",
      "APPROVED",
      "CLOSED",
      "COMPLIANT",
      "COMPLETED",
      "INFO",
      "VALID",
    ].includes(status)
  ) {
    return "success";
  }
  if (
    [
      "ATTENTION",
      "DRAFT_READY",
      "EVIDENCE_GAP",
      "EVIDENCE_PENDING",
      "ESCALATED",
      "EXCEPTION",
      "LEGAL_REVIEW",
      "NON_COMPLIANT",
      "OVERDUE_REVIEW",
      "PARTIAL",
      "PENDING_UPLOAD",
      "RISK_ACCEPTANCE_REVIEW",
      "WARNING",
    ].includes(status)
  ) {
    return "danger";
  }
  if (
    [
      "IN_PROGRESS",
      "OWNER_RESPONSE",
      "RECONCILIATION",
      "REMEDIATION",
      "RESPONSE_DRAFT",
      "REVIEW_PENDING",
      "SCHEDULED",
      "WAITING_APPROVAL",
      "WAITING_EVIDENCE",
      "WATCH",
    ].includes(status)
  ) {
    return "warning";
  }
  return "info";
}

function formatStatus(status: string): string {
  return status.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatInr(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    currency: "INR",
    maximumFractionDigits: 0,
    notation: value >= 10000000 ? "compact" : "standard",
    style: "currency",
  }).format(value);
}
