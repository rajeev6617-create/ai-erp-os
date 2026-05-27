import Link from "next/link";
import {
  Banknote,
  Bot,
  BriefcaseBusiness,
  CalendarClock,
  ChartNoAxesCombined,
  ClipboardCheck,
  CreditCard,
  FileText,
  GitBranch,
  IndianRupee,
  ReceiptText,
  ShieldCheck,
  Timer,
  Truck,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardReportActions } from "@/components/reports/dashboard-report-actions";
import { EmptyState } from "@/components/ui/empty-state";
import { StatCard } from "@/components/ui/stat-card";
import { cn } from "@/lib/utils/cn";
import type { OtcOperationsDashboardData } from "@/lib/operations/otc-data";
import type {
  OperationAuditEvent,
  OperationFinanceImpact,
  OperationModuleDashboardData,
  OperationRecord,
  OperationRiskAlert,
  OperationStage,
} from "@/lib/operations/types";
import type {
  CrmLeadView,
  CustomerView,
  RelationshipAuditView,
  SalesOpportunityView,
} from "@/lib/relationships/types";

const ACTIVE_STATUSES = new Set(["OPEN", "WAITING_APPROVAL", "BLOCKED", "EXCEPTION", "APPROVED"]);
const COLLECTION_RISK_SIGNALS = new Set([
  "customer_payment_risk",
  "delayed_collections",
  "collection_exception",
  "credit_exposure",
]);

export function OtcOrderToCashDashboard({
  data,
}: {
  data: OtcOperationsDashboardData;
}) {
  const operations = data.operations;
  const metrics = buildOtcMetrics(operations.records, operations.riskAlerts, operations.financeImpacts);
  const topCustomerExposure = data.crm.customers
    .slice()
    .sort((left, right) => right.outstandingAmount - left.outstandingAmount)
    .slice(0, 3)
    .reduce((total, customer) => total + customer.outstandingAmount, 0);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Enterprise operations</p>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            OTC Order-to-Cash
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Run sales order, dispatch, invoicing, collections, and revenue recognition
            workflows with CRM context, finance linkage, audit, and AI risk intelligence.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {operations.nav.map((item) => (
              <Link
                key={item.slug}
                href={item.href}
                className={cn(
                  "rounded-md border border-border px-3 py-1.5 text-sm font-medium transition-colors",
                  item.slug === operations.activeSlug
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
          label="Open sales orders"
          value={String(metrics.openSalesOrders)}
          change={`${formatInr(metrics.openSalesOrderValue)} order value`}
          trend={metrics.openSalesOrders > 0 ? "neutral" : "up"}
          icon={BriefcaseBusiness}
        />
        <StatCard
          label="Overdue collections"
          value={String(metrics.overdueCollections)}
          change={`${formatInr(metrics.overdueCollectionValue)} at risk`}
          trend={metrics.overdueCollections > 0 ? "down" : "up"}
          icon={CreditCard}
        />
        <StatCard
          label="Invoice aging"
          value={`${metrics.invoiceAgingDays}d`}
          change={`${formatInr(metrics.invoiceAgingValue)} open invoice value`}
          trend={metrics.invoiceAgingDays > 30 ? "down" : "neutral"}
          icon={CalendarClock}
        />
        <StatCard
          label="Revenue trend"
          value={formatInr(metrics.revenueTrend)}
          change={`${formatInr(metrics.weightedPipeline)} weighted pipeline`}
          trend="up"
          icon={ChartNoAxesCombined}
        />
        <StatCard
          label="Collection efficiency"
          value={`${metrics.collectionEfficiency}%`}
          change={`${formatInr(metrics.cashCollected)} collected or applicable`}
          trend={metrics.collectionEfficiency >= 80 ? "up" : "down"}
          icon={Banknote}
        />
        <StatCard
          label="Dispatch delays"
          value={String(metrics.dispatchDelays)}
          change={`${formatInr(metrics.dispatchDelayValue)} delayed order value`}
          trend={metrics.dispatchDelays > 0 ? "down" : "up"}
          icon={Truck}
        />
        <StatCard
          label="Top customers"
          value={String(data.crm.customers.length)}
          change={`${formatInr(topCustomerExposure)} outstanding exposure`}
          trend="neutral"
          icon={Users}
        />
        <StatCard
          label="AI sales alerts"
          value={String(operations.riskAlerts.length)}
          change={`${metrics.highRiskAlerts} high or critical`}
          trend={metrics.highRiskAlerts > 0 ? "down" : "up"}
          icon={Bot}
        />
      </section>

      <section>
        <SectionHeading
          title="OTC workflow stages"
          description="Customer revenue lifecycle from lead through revenue recognition."
          badge={`${operations.stages.length} stages`}
        />
        {operations.stages.length === 0 ? (
          <EmptyState
            icon={GitBranch}
            title="No OTC stages configured"
            description="Order-to-cash stages will appear here after setup or seed."
          />
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {operations.stages.map((stage) => (
              <OtcStageCard key={stage.id} stage={stage} />
            ))}
          </div>
        )}
      </section>

      <section className="grid gap-4 xl:grid-cols-12">
        <div className="xl:col-span-7">
          <SalesWorkflowQueue records={operations.records} />
        </div>
        <div className="space-y-4 xl:col-span-5">
          <AiRevenueInsights alerts={operations.riskAlerts} />
          <ApprovalTracking data={operations} />
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-12">
        <div className="xl:col-span-4">
          <TopCustomers customers={data.crm.customers} />
        </div>
        <div className="xl:col-span-4">
          <SalesPipeline leads={data.crm.leads} opportunities={data.crm.opportunities} />
        </div>
        <div className="xl:col-span-4">
          <OpportunityTracking opportunities={data.crm.opportunities} />
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-12">
        <div className="xl:col-span-5">
          <FinanceLinkage data={operations} />
        </div>
        <div className="xl:col-span-7">
          <FinanceImpactLines impacts={operations.financeImpacts} />
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-12">
        <div className="xl:col-span-7">
          <AuditTrail events={operations.auditEvents} />
        </div>
        <div className="xl:col-span-5">
          <CustomerActivityTimeline events={data.crm.auditLogs} />
        </div>
      </section>
    </div>
  );
}

function OtcStageCard({ stage }: { stage: OperationStage }) {
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

function SalesWorkflowQueue({ records }: { records: OperationRecord[] }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClipboardCheck className="h-4 w-4 text-primary" />
          OTC control queue
        </CardTitle>
        <CardDescription>Leads, opportunities, sales orders, dispatches, invoices, and cash</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {records.length === 0 ? (
          <EmptyState
            icon={ClipboardCheck}
            title="No OTC records"
            description="Sales and collection transactions will appear here after intake."
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
                  {record.counterparty ?? "Customer operation"} | Owner{" "}
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

function AiRevenueInsights({ alerts }: { alerts: OperationRiskAlert[] }) {
  const orderedAlerts = [...alerts].sort(
    (a, b) => severityRank(b.severity) - severityRank(a.severity),
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-4 w-4 text-primary" />
          AI OTC insights
        </CardTitle>
        <CardDescription>
          Customer payment risk, delayed collections, forecasting, profitability, and anomalies
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {orderedAlerts.length === 0 ? (
          <EmptyState
            icon={Bot}
            title="No active AI insights"
            description="AI OTC signals will appear here when detected."
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

function ApprovalTracking({ data }: { data: OperationModuleDashboardData }) {
  const waitingRecords = data.records.filter((record) => record.status === "WAITING_APPROVAL");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" />
          Approval tracking
        </CardTitle>
        <CardDescription>Credit, discount, dispatch, collection, and revenue controls</CardDescription>
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
            description="OTC approval controls will appear here."
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

function TopCustomers({ customers }: { customers: CustomerView[] }) {
  const topCustomers = [...customers]
    .sort((left, right) => right.outstandingAmount - left.outstandingAmount)
    .slice(0, 5);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          Customer master
        </CardTitle>
        <CardDescription>Top customers by outstanding exposure</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {topCustomers.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No customers"
            description="Customer master records will appear here."
          />
        ) : (
          topCustomers.map((customer) => (
            <div key={customer.id} className="rounded-lg border border-border p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{customer.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {customer.segment ?? "Unsegmented"} | {customer.industry ?? "No industry"}
                  </p>
                </div>
                <Badge variant={customer.status === "ACTIVE" ? "success" : "default"}>
                  {formatStatus(customer.status)}
                </Badge>
              </div>
              <div className="mt-3 grid gap-1 text-xs text-muted-foreground">
                <SummaryRow label="Outstanding" value={formatInr(customer.outstandingAmount)} />
                <SummaryRow
                  label="Credit limit"
                  value={customer.creditLimit == null ? "Not set" : formatInr(customer.creditLimit)}
                />
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function SalesPipeline({
  leads,
  opportunities,
}: {
  leads: CrmLeadView[];
  opportunities: SalesOpportunityView[];
}) {
  const pipeline = opportunities.reduce((sum, item) => sum + item.amount, 0);
  const weighted = opportunities.reduce(
    (sum, item) => sum + (item.amount * item.probability) / 100,
    0,
  );
  const openLeads = leads.filter((lead) => !["CONVERTED", "LOST"].includes(lead.status));

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ChartNoAxesCombined className="h-4 w-4 text-primary" />
          Sales pipeline
        </CardTitle>
        <CardDescription>Lead flow and weighted opportunity coverage</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border border-border bg-muted/20 p-4">
          <p className="text-xs text-muted-foreground">Weighted pipeline</p>
          <p className="mt-1 text-2xl font-semibold">{formatInr(weighted)}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {formatInr(pipeline)} gross across {opportunities.length} opportunities
          </p>
        </div>
        <div className="grid gap-2 text-sm">
          <SummaryRow label="Open leads" value={String(openLeads.length)} />
          <SummaryRow
            label="High-score leads"
            value={String(openLeads.filter((lead) => lead.score >= 80).length)}
          />
          <SummaryRow label="Opportunities" value={String(opportunities.length)} />
        </div>
      </CardContent>
    </Card>
  );
}

function OpportunityTracking({ opportunities }: { opportunities: SalesOpportunityView[] }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          Opportunity tracking
        </CardTitle>
        <CardDescription>CRM opportunities feeding OTC revenue workflows</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {opportunities.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No opportunities"
            description="Sales opportunities will appear here."
          />
        ) : (
          opportunities.slice(0, 5).map((opportunity) => (
            <div key={opportunity.id} className="rounded-lg border border-border p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="line-clamp-1 text-sm font-semibold">{opportunity.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {opportunity.customerName} | {formatStatus(opportunity.stage)}
                  </p>
                </div>
                <Badge variant={opportunity.probability >= 70 ? "success" : "info"}>
                  {opportunity.probability}%
                </Badge>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                {formatInr(opportunity.amount)}
                {opportunity.expectedCloseAt ? ` | Close ${formatDate(opportunity.expectedCloseAt)}` : ""}
              </p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function FinanceLinkage({ data }: { data: OperationModuleDashboardData }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IndianRupee className="h-4 w-4 text-primary" />
          Finance linkage
        </CardTitle>
        <CardDescription>{data.module.financeCategory ?? "Accounts receivable"}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {data.financeImpacts.length === 0 ? (
          <EmptyState
            icon={IndianRupee}
            title="No finance impact"
            description="Revenue, receivable, and cash impacts will appear here."
          />
        ) : (
          <>
            <div className="rounded-lg border border-border bg-muted/20 p-4">
              <p className="text-xs text-muted-foreground">Net AR and revenue impact</p>
              <p className="mt-1 text-2xl font-semibold">
                {formatInr(data.financeSummary.netImpact)}
              </p>
            </div>
            <div className="grid gap-2 text-sm">
              <SummaryRow label="Revenue and receivables" value={formatInr(data.financeSummary.inflow)} />
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
        <CardTitle className="flex items-center gap-2">
          <ReceiptText className="h-4 w-4 text-primary" />
          Finance impact lines
        </CardTitle>
        <CardDescription>Revenue, receivable, cash, discount, and recognition exposure</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {impacts.length === 0 ? (
          <EmptyState
            icon={ReceiptText}
            title="No impact lines"
            description="OTC finance impacts will appear here."
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
                  <Badge variant={impact.direction === "INFLOW" ? "success" : "info"}>
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

function AuditTrail({ events }: { events: OperationAuditEvent[] }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Timer className="h-4 w-4 text-primary" />
          Audit trail
        </CardTitle>
        <CardDescription>Workflow evidence for order, dispatch, invoice, and cash controls</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2">
        {events.length === 0 ? (
          <EmptyState
            icon={Timer}
            title="No audit events"
            description="OTC control events will appear here."
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
                {event.recordReference ?? "OTC module"} | {detailsText(event.details)}
              </p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function CustomerActivityTimeline({ events }: { events: RelationshipAuditView[] }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          Customer activity timeline
        </CardTitle>
        <CardDescription>CRM and portal activity linked to order-to-cash operations</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {events.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No customer activity"
            description="CRM and portal audit activity will appear here."
          />
        ) : (
          events.slice(0, 6).map((event) => (
            <div key={event.id} className="rounded-lg border border-border p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="line-clamp-1 text-sm font-semibold">
                    {formatStatus(event.action)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatStatus(event.resource)} | {formatDate(event.createdAt)}
                  </p>
                </div>
                <Badge variant={auditVariant(event.severity)}>
                  {event.severity.toLowerCase()}
                </Badge>
              </div>
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

function buildOtcMetrics(
  records: OperationRecord[],
  alerts: OperationRiskAlert[],
  impacts: OperationFinanceImpact[],
) {
  const openSalesOrders = records.filter(
    (record) => record.stageKey === "sales_order" && ACTIVE_STATUSES.has(record.status),
  );
  const overdueCollections = records.filter((record) => {
    if (record.stageKey !== "payment_collection") return false;
    if (record.status === "BLOCKED" || record.status === "EXCEPTION") return true;
    return record.dueAt ? new Date(record.dueAt).getTime() < Date.now() : false;
  });
  const agedInvoices = records.filter(
    (record) => record.stageKey === "invoice" && ACTIVE_STATUSES.has(record.status),
  );
  const dispatchDelays = records.filter((record) => {
    if (record.stageKey !== "dispatch") return false;
    if (record.status === "BLOCKED" || record.status === "EXCEPTION") return true;
    return record.dueAt ? new Date(record.dueAt).getTime() < Date.now() : false;
  });
  const revenueTrend = sumImpacts(
    impacts,
    new Set(["forecast_revenue", "recognized_revenue", "revenue_recognition"]),
  );
  const weightedPipeline = sumImpacts(impacts, new Set(["weighted_pipeline"]));
  const cashCollected = sumImpacts(impacts, new Set(["cash_collection", "unapplied_cash"]));
  const collectionBase =
    cashCollected + sumImpacts(impacts, new Set(["overdue_receivable", "collection_risk"]));
  const invoiceAgingDays = Math.max(
    0,
    ...agedInvoices.map((record) => daysLate(record.dueAt)),
  );
  const collectionEfficiency =
    collectionBase > 0 ? Math.round((cashCollected / collectionBase) * 100) : 0;

  return {
    openSalesOrders: openSalesOrders.length,
    openSalesOrderValue: sumRecords(openSalesOrders),
    overdueCollections: overdueCollections.length,
    overdueCollectionValue: sumRecords(overdueCollections),
    invoiceAgingDays,
    invoiceAgingValue: sumRecords(agedInvoices),
    revenueTrend,
    weightedPipeline,
    collectionEfficiency,
    cashCollected,
    dispatchDelays: dispatchDelays.length,
    dispatchDelayValue: sumRecords(dispatchDelays),
    highRiskAlerts: alerts.filter((alert) => ["HIGH", "CRITICAL"].includes(alert.severity)).length,
    collectionRiskAlerts: alerts.filter((alert) => COLLECTION_RISK_SIGNALS.has(alert.signalType)).length,
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

function daysLate(iso: string | null): number {
  if (!iso) return 0;
  const diff = Date.now() - new Date(iso).getTime();
  if (diff <= 0) return 0;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function statusVariant(status: string): "default" | "success" | "warning" | "danger" | "info" {
  if (["COMPLETED", "APPROVED", "CONVERTED", "CLOSED"].includes(status)) return "success";
  if (["WAITING_APPROVAL", "IN_PROGRESS", "OPEN", "NEGOTIATION"].includes(status)) return "warning";
  if (["BLOCKED", "EXCEPTION", "FAILED", "LOST"].includes(status)) return "danger";
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
