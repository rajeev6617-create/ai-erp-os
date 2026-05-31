import Link from "next/link";
import {
  Activity,
  Banknote,
  Bot,
  BriefcaseBusiness,
  ClipboardCheck,
  FileCheck2,
  FileText,
  GitBranch,
  Handshake,
  IndianRupee,
  ReceiptText,
  ShieldCheck,
  Store,
  Timer,
  Truck,
  Users,
} from "lucide-react";
import { DashboardReportActions } from "@/components/reports/dashboard-report-actions";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatCard } from "@/components/ui/stat-card";
import { operationModuleNav } from "@/lib/operations/data";
import type {
  CrmOperationsPortalData,
  SrmOperationsPortalData,
} from "@/lib/operations/relationship-portal-data";
import type {
  CrmSalesActivityRecord,
  PurchaseHistoryRecord,
  SupplierDeliveryRecord,
  VendorComplianceDocument,
  VendorPerformanceRecord,
} from "@/lib/operations/relationship-enterprise-data";
import type {
  OperationAuditEvent,
  OperationModuleDashboardData,
  OperationRecord,
  OperationRiskAlert,
} from "@/lib/operations/types";
import type {
  CrmLeadView,
  CustomerView,
  RelationshipAiInsightView,
  RelationshipAuditView,
  SalesOpportunityView,
  SupportTicketView,
  VendorOnboardingView,
  VendorView,
} from "@/lib/relationships/types";
import { cn } from "@/lib/utils/cn";

const ACTIVE_OPERATION_STATUSES = new Set(["OPEN", "WAITING_APPROVAL", "BLOCKED", "EXCEPTION", "APPROVED"]);
const HIGH_PRIORITY = new Set(["HIGH", "CRITICAL"]);

export function CrmOperationsPortalDashboard({
  data,
}: {
  data: CrmOperationsPortalData;
}) {
  const metrics = buildCrmMetrics(data);
  const customerRisk = data.crm.customers.filter(isCustomerPaymentRisk);

  return (
    <div className="space-y-6">
      <RelationshipOperationsHeader
        activeSlug="crm"
        eyebrow="Enterprise relationship operations"
        title="ASTRA CRM Customer Relationships"
        description="Customer master, lead management, sales pipeline, payment risk, profitability intelligence, audit, workflow, and finance linkage."
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Customer master"
          value={String(data.crm.customers.length)}
          change={`${data.crm.customers.filter((customer) => customer.status === "ACTIVE").length} active records`}
          trend="up"
          icon={Users}
        />
        <StatCard
          label="Active leads"
          value={String(metrics.openLeads)}
          change={`${metrics.highScoreLeads} high-score leads`}
          trend="neutral"
          icon={Handshake}
        />
        <StatCard
          label="Opportunity value"
          value={formatInr(metrics.pipeline)}
          change={`${formatInr(metrics.weightedPipeline)} weighted`}
          trend="up"
          icon={BriefcaseBusiness}
        />
        <StatCard
          label="High-risk customers"
          value={String(customerRisk.length)}
          change={`${formatInr(metrics.paymentRiskExposure)} outstanding exposure`}
          trend={customerRisk.length > 0 ? "down" : "up"}
          icon={Banknote}
        />
        <StatCard
          label="Customer profitability insights"
          value={String(metrics.profitabilityAlerts)}
          change={`${formatInr(metrics.profitabilityBase)} weighted margin base`}
          trend={metrics.profitabilityAlerts > 0 ? "neutral" : "up"}
          icon={IndianRupee}
        />
        <StatCard
          label="Top customers"
          value={String(metrics.topCustomers)}
          change={`${metrics.topCustomerName} leads account value`}
          trend="up"
          icon={Users}
        />
        <StatCard
          label="Workflow approvals"
          value={String(metrics.workflowApprovals)}
          change={`${data.operations?.approvalFlows.length ?? 0} OTC approval controls`}
          trend={metrics.workflowApprovals > 0 ? "neutral" : "up"}
          icon={ShieldCheck}
        />
        <StatCard
          label="AI insights"
          value={String(data.crm.insights.length)}
          change={`${metrics.aiEscalations} high or critical`}
          trend={metrics.aiEscalations > 0 ? "down" : "up"}
          icon={Bot}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-12">
        <div className="xl:col-span-5">
          <CustomerMasterCard customers={data.crm.customers} />
        </div>
        <div className="xl:col-span-7">
          <SalesPipelineCard opportunities={data.crm.opportunities} />
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-12">
        <div className="xl:col-span-4">
          <LeadManagementCard leads={data.crm.leads} />
        </div>
        <div className="xl:col-span-4">
          <CustomerPaymentRiskCard customers={customerRisk} />
        </div>
        <div className="xl:col-span-4">
          <CustomerProfitabilityCard
            insights={data.crm.insights}
            opportunities={data.crm.opportunities}
            customers={data.crm.customers}
          />
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-12">
        <div className="xl:col-span-7">
          <SalesActivitiesCard activities={data.enterprise.crmActivities} />
        </div>
        <div className="xl:col-span-5">
          <CustomerSupportTicketsCard tickets={data.crm.tickets} />
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-12">
        <div className="xl:col-span-5">
          <AiInsightsCard
            title="AI CRM insights"
            description="Customer churn risk, sales opportunity score, payment risk, and profitability alerts"
            insights={data.crm.insights}
            operationAlerts={data.operations?.riskAlerts ?? []}
          />
        </div>
        <div className="xl:col-span-7">
          <WorkflowIntegrationCard
            title="CRM workflow integration"
            description="Approvals, customer activity, and OTC controls linked to sales and collection workflows"
            operations={data.operations}
            emptyTitle="No linked OTC workflow controls"
          />
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-12">
        <div className="xl:col-span-4">
          <FinanceLinkageCard
            title="CRM finance linkage"
            description="Receivable, pipeline, collection, and revenue impact"
            operations={data.operations}
            primaryLabel="Customer outstanding"
            primaryValue={metrics.customerOutstanding}
            secondaryLabel="Weighted pipeline"
            secondaryValue={metrics.weightedPipeline}
          />
        </div>
        <div className="xl:col-span-4">
          <DocumentTrackingCard
            title="CRM document tracking"
            description="Invoice evidence, customer requests, and portal support documents"
            tickets={data.crm.tickets}
            operations={data.operations}
          />
        </div>
        <div className="xl:col-span-4">
          <ActivityTimelineCard
            title="Customer activity timeline"
            relationshipEvents={data.crm.auditLogs}
            operationEvents={data.operations?.auditEvents ?? []}
          />
        </div>
      </section>
    </div>
  );
}

export function SrmOperationsPortalDashboard({
  data,
}: {
  data: SrmOperationsPortalData;
}) {
  const metrics = buildSrmMetrics(data);

  return (
    <div className="space-y-6">
      <RelationshipOperationsHeader
        activeSlug="srm"
        eyebrow="Enterprise relationship operations"
        title="ASTRA SRM Supplier Relationships"
        description="Vendor master, onboarding, quotation tracking, purchase performance, delivery performance, compliance documents, workflow, audit, and AI risk intelligence."
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Active vendors"
          value={String(metrics.activeVendors)}
          change={`${data.srm.vendors.length} vendor master records`}
          trend="up"
          icon={Store}
        />
        <StatCard
          label="Vendor onboarding"
          value={String(metrics.activeOnboardings)}
          change={`${metrics.highRiskOnboardings} high-risk onboarding records`}
          trend={metrics.highRiskOnboardings > 0 ? "down" : "up"}
          icon={ClipboardCheck}
        />
        <StatCard
          label="Vendor quotation tracking"
          value={String(metrics.quotationRecords)}
          change={`${formatInr(metrics.quotationValue)} under commercial review`}
          trend="neutral"
          icon={FileText}
        />
        <StatCard
          label="Vendor risk score"
          value={`${metrics.vendorRiskScore}/100`}
          change={metrics.vendorRiskScore >= 75 ? "Risk review required" : "Within supplier tolerance"}
          trend={metrics.vendorRiskScore >= 75 ? "down" : "up"}
          icon={ShieldCheck}
        />
        <StatCard
          label="Purchase performance"
          value={formatInr(metrics.purchaseValue)}
          change={`${metrics.openPurchaseRecords} active P2P records`}
          trend="neutral"
          icon={IndianRupee}
        />
        <StatCard
          label="Delayed supplier deliveries"
          value={String(metrics.delayedSupplierDeliveries)}
          change={`${formatInr(metrics.deliveryExposure)} delivery exposure`}
          trend={metrics.deliveryExceptions > 0 ? "down" : "up"}
          icon={Truck}
        />
        <StatCard
          label="Compliance documents"
          value={String(metrics.complianceDocuments)}
          change="GST, insurance, bank, and onboarding evidence"
          trend={metrics.complianceDocuments > 0 ? "neutral" : "up"}
          icon={FileCheck2}
        />
        <StatCard
          label="AI insights"
          value={String(data.srm.insights.length)}
          change={`${metrics.aiEscalations} high or critical`}
          trend={metrics.aiEscalations > 0 ? "down" : "up"}
          icon={Bot}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-12">
        <div className="xl:col-span-5">
          <VendorMasterCard vendors={data.srm.vendors} />
        </div>
        <div className="xl:col-span-7">
          <VendorOnboardingCard onboardings={data.srm.onboardings} />
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-12">
        <div className="xl:col-span-4">
          <VendorQuotationTrackingCard records={quotationRecords(data.operations)} />
        </div>
        <div className="xl:col-span-4">
          <PurchasePerformanceCard operations={data.operations} />
        </div>
        <div className="xl:col-span-4">
          <DeliveryPerformanceCard operations={data.operations} />
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-12">
        <div className="xl:col-span-6">
          <VendorPerformanceScoreCard records={data.enterprise.vendorPerformance} />
        </div>
        <div className="xl:col-span-6">
          <SupplierDeliveryTrackingCard records={data.enterprise.supplierDeliveries} />
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-12">
        <div className="xl:col-span-7">
          <PurchaseHistoryCard records={data.enterprise.purchaseHistory} />
        </div>
        <div className="xl:col-span-5">
          <VendorComplianceEvidenceCard documents={data.enterprise.vendorDocuments} />
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-12">
        <div className="xl:col-span-5">
          <AiInsightsCard
            title="AI SRM insights"
            description="Vendor reliability score, supplier delay prediction, compliance risk, and profitability alerts"
            insights={data.srm.insights}
            operationAlerts={data.operations?.riskAlerts ?? []}
          />
        </div>
        <div className="xl:col-span-7">
          <WorkflowIntegrationCard
            title="SRM workflow integration"
            description="Approvals, vendor activity, and P2P controls linked to supplier workflows"
            operations={data.operations}
            emptyTitle="No linked P2P workflow controls"
          />
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-12">
        <div className="xl:col-span-4">
          <FinanceLinkageCard
            title="SRM finance linkage"
            description="Committed spend, AP exposure, delivery risk, and purchase performance"
            operations={data.operations}
            primaryLabel="Purchase exposure"
            primaryValue={metrics.purchaseValue}
            secondaryLabel="Delivery exposure"
            secondaryValue={metrics.deliveryExposure}
          />
        </div>
        <div className="xl:col-span-4">
          <ComplianceDocumentsCard
            onboardings={data.srm.onboardings}
            tickets={data.srm.tickets}
          />
        </div>
        <div className="xl:col-span-4">
          <ActivityTimelineCard
            title="Vendor audit timeline"
            relationshipEvents={data.srm.auditLogs}
            operationEvents={data.operations?.auditEvents ?? []}
          />
        </div>
      </section>
    </div>
  );
}

function RelationshipOperationsHeader({
  activeSlug,
  eyebrow,
  title,
  description,
}: {
  activeSlug: "crm" | "srm";
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p className="text-sm text-muted-foreground">{eyebrow}</p>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{description}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {operationModuleNav.map((item) => (
            <Link
              key={item.slug}
              href={item.href}
              className={cn(
                "rounded-md border border-border px-3 py-1.5 text-sm font-medium transition-colors",
                item.slug === activeSlug
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
  );
}

function CustomerMasterCard({ customers }: { customers: CustomerView[] }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          Customer master
        </CardTitle>
        <CardDescription>Customer records, credit limits, status, and exposure</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {customers.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No customer records"
            description="Customer master data will appear here."
          />
        ) : (
          customers.map((customer) => (
            <div key={customer.id} className="rounded-lg border border-border p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{customer.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {customer.code} | {customer.segment ?? "Unsegmented"} | {customer.industry ?? "No industry"}
                  </p>
                </div>
                <StatusBadge status={customer.status} />
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Outstanding {formatInr(customer.outstandingAmount)} | Credit {customer.creditLimit == null ? "not set" : formatInr(customer.creditLimit)}
              </p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function LeadManagementCard({ leads }: { leads: CrmLeadView[] }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Handshake className="h-4 w-4 text-primary" />
          Leads
        </CardTitle>
        <CardDescription>Lead management with AI scoring and next actions</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {leads.length === 0 ? (
          <EmptyState icon={Handshake} title="No leads" description="Inbound and partner leads will appear here." />
        ) : (
          leads.map((lead) => (
            <div key={lead.id} className="rounded-lg border border-border p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{lead.companyName}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {lead.leadNumber} | {lead.source}
                  </p>
                </div>
                <StatusBadge status={lead.status} />
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Score {lead.score} | {lead.estimatedValue == null ? "No value" : formatInr(lead.estimatedValue)} | {lead.nextAction ?? "No next action"}
              </p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function SalesPipelineCard({ opportunities }: { opportunities: SalesOpportunityView[] }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BriefcaseBusiness className="h-4 w-4 text-primary" />
          Sales pipeline
        </CardTitle>
        <CardDescription>Opportunities, expected value, probability, and customer context</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {opportunities.length === 0 ? (
          <EmptyState icon={BriefcaseBusiness} title="No opportunities" description="Qualified pipeline will appear here." />
        ) : (
          opportunities.map((item) => (
            <div
              key={item.id}
              className="grid gap-3 rounded-lg border border-border p-3 md:grid-cols-[1fr_auto]"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold">{item.name}</p>
                  <StatusBadge status={item.stage} />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {item.customerName} | {item.opportunityNumber}
                </p>
              </div>
              <div className="text-sm md:text-right">
                <p className="font-semibold">{formatInr(item.amount)}</p>
                <p className="text-xs text-muted-foreground">{item.probability}% probability</p>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function CustomerPaymentRiskCard({ customers }: { customers: CustomerView[] }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Banknote className="h-4 w-4 text-primary" />
          Customer payment risk
        </CardTitle>
        <CardDescription>Credit usage and collection exposure watchlist</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {customers.length === 0 ? (
          <EmptyState icon={Banknote} title="No payment risk" description="Customer credit exposure is within tolerance." />
        ) : (
          customers.map((customer) => (
            <div key={customer.id} className="rounded-lg border border-border p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">{customer.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Outstanding {formatInr(customer.outstandingAmount)}
                  </p>
                </div>
                <Badge variant="danger">{customerRiskLabel(customer)}</Badge>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function CustomerProfitabilityCard({
  insights,
  opportunities,
  customers,
}: {
  insights: RelationshipAiInsightView[];
  opportunities: SalesOpportunityView[];
  customers: CustomerView[];
}) {
  const profitabilityInsights = insights.filter((insight) =>
    includesAny(insight.title, ["profitability", "margin", "profit"]) ||
    includesAny(insight.description, ["profitability", "margin", "profit"]),
  );
  const topOpportunity = opportunities
    .slice()
    .sort((left, right) => right.amount * right.probability - left.amount * left.probability)
    .at(0);
  const totalOutstanding = customers.reduce((sum, customer) => sum + customer.outstandingAmount, 0);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IndianRupee className="h-4 w-4 text-primary" />
          Customer profitability insights
        </CardTitle>
        <CardDescription>Margin, collection exposure, and account value signals</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <SummaryTile label="Outstanding exposure" value={formatInr(totalOutstanding)} />
        {topOpportunity ? (
          <SummaryTile
            label="Best weighted opportunity"
            value={`${topOpportunity.customerName} | ${formatInr((topOpportunity.amount * topOpportunity.probability) / 100)}`}
          />
        ) : null}
        {profitabilityInsights.length === 0 ? (
          <EmptyState
            icon={IndianRupee}
            title="No profitability alerts"
            description="Customer profitability alerts will appear as AI signals are detected."
          />
        ) : (
          profitabilityInsights.map((insight) => (
            <InsightLine key={insight.id} insight={insight} />
          ))
        )}
      </CardContent>
    </Card>
  );
}

function SalesActivitiesCard({ activities }: { activities: CrmSalesActivityRecord[] }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          Sales activities
        </CardTitle>
        <CardDescription>Customer meetings, proposals, collection actions, and discovery follow-ups</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2">
        {activities.map((activity) => (
          <div key={activity.id} className="rounded-lg border border-border p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold">{activity.subject}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {activity.activityNumber} | {formatStatus(activity.activityType)}
                </p>
              </div>
              <StatusBadge status={activity.status} />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {activity.customerName} | {activity.linkedReference} | Owner {activity.owner}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Due {formatDate(activity.dueAt)}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function CustomerSupportTicketsCard({ tickets }: { tickets: SupportTicketView[] }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          Customer support tickets
        </CardTitle>
        <CardDescription>Portal requests, service issues, collection blockers, and SLA ownership</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {tickets.length === 0 ? (
          <EmptyState icon={FileText} title="No support tickets" description="Customer support activity will appear here." />
        ) : (
          tickets.map((ticket) => <TicketLine key={ticket.id} ticket={ticket} />)
        )}
      </CardContent>
    </Card>
  );
}

function VendorMasterCard({ vendors }: { vendors: VendorView[] }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Store className="h-4 w-4 text-primary" />
          Vendor master
        </CardTitle>
        <CardDescription>Supplier records, status, terms, and risk tiers</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {vendors.length === 0 ? (
          <EmptyState icon={Store} title="No vendors" description="Vendor master data will appear here." />
        ) : (
          vendors.map((vendor) => (
            <div key={vendor.id} className="rounded-lg border border-border p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{vendor.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {vendor.code} | {formatStatus(vendor.vendorType)}
                  </p>
                </div>
                <StatusBadge status={vendor.status} />
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Terms {vendor.paymentTermsDays} days | Risk {vendor.riskTier ?? "unrated"}
              </p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function VendorOnboardingCard({ onboardings }: { onboardings: VendorOnboardingView[] }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClipboardCheck className="h-4 w-4 text-primary" />
          Vendor onboarding
        </CardTitle>
        <CardDescription>Supplier qualification, document readiness, and approval state</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {onboardings.length === 0 ? (
          <EmptyState icon={ClipboardCheck} title="No onboarding records" description="Vendor onboarding workflows will appear here." />
        ) : (
          onboardings.map((item) => (
            <div
              key={item.id}
              className="grid gap-3 rounded-lg border border-border p-3 md:grid-cols-[1fr_auto]"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold">{item.supplierName}</p>
                  <StatusBadge status={item.status} />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {item.onboardingNumber} | {item.currentStep}
                </p>
              </div>
              <div className="text-sm md:text-right">
                <p className="font-semibold">Risk {item.riskScore}</p>
                <p className="text-xs text-muted-foreground">{item.contactName ?? "No contact"}</p>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function VendorQuotationTrackingCard({ records }: { records: OperationRecord[] }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ReceiptText className="h-4 w-4 text-primary" />
          Vendor quotation tracking
        </CardTitle>
        <CardDescription>RFQ and quotation controls linked to P2P workflows</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {records.length === 0 ? (
          <EmptyState
            icon={ReceiptText}
            title="No quotation records"
            description="Vendor quotation controls will appear here after RFQ activity."
          />
        ) : (
          records.map((record) => <OperationRecordLine key={record.id} record={record} />)
        )}
      </CardContent>
    </Card>
  );
}

function PurchasePerformanceCard({
  operations,
}: {
  operations: OperationModuleDashboardData | null;
}) {
  const purchaseRecords = (operations?.records ?? []).filter((record) =>
    ["purchase_order", "payment_approval", "invoice_matching"].includes(record.stageKey ?? ""),
  );

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IndianRupee className="h-4 w-4 text-primary" />
          Purchase performance
        </CardTitle>
        <CardDescription>Committed spend, invoice controls, and payment exposure</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <SummaryTile label="Committed spend" value={formatInr(sumRecords(purchaseRecords))} />
        {purchaseRecords.length === 0 ? (
          <EmptyState icon={IndianRupee} title="No purchase records" description="Purchase performance records will appear here." />
        ) : (
          purchaseRecords.slice(0, 3).map((record) => <OperationRecordLine key={record.id} record={record} />)
        )}
      </CardContent>
    </Card>
  );
}

function DeliveryPerformanceCard({
  operations,
}: {
  operations: OperationModuleDashboardData | null;
}) {
  const deliveryRecords = (operations?.records ?? []).filter((record) =>
    ["goods_receipt_note", "dispatch", "delivery"].includes(record.stageKey ?? ""),
  );

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Truck className="h-4 w-4 text-primary" />
          Delivery performance
        </CardTitle>
        <CardDescription>GRN, receipt, and delivery exceptions from supplier workflows</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <SummaryTile label="Delivery exposure" value={formatInr(sumRecords(deliveryRecords))} />
        {deliveryRecords.length === 0 ? (
          <EmptyState icon={Truck} title="No delivery records" description="Delivery and GRN records will appear here." />
        ) : (
          deliveryRecords.map((record) => <OperationRecordLine key={record.id} record={record} />)
        )}
      </CardContent>
    </Card>
  );
}

function VendorPerformanceScoreCard({ records }: { records: VendorPerformanceRecord[] }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" />
          Vendor performance score
        </CardTitle>
        <CardDescription>Reliability, acceptance, lead time, and supplier operating tier</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {records.map((record) => (
          <div key={record.id} className="rounded-lg border border-border p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">{record.vendorName}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {record.vendorCode} | {record.category}
                </p>
              </div>
              <Badge variant={statusVariant(record.status)}>{record.performanceScore}/100</Badge>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              OTD {record.onTimeDeliveryPercent}% | Quality {record.qualityAcceptancePercent}% | Lead time{" "}
              {record.averageLeadTimeDays} days
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function SupplierDeliveryTrackingCard({ records }: { records: SupplierDeliveryRecord[] }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Truck className="h-4 w-4 text-primary" />
          Supplier delivery performance
        </CardTitle>
        <CardDescription>ASN status, delayed receipts, compliance blocks, and purchase exposure</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {records.map((record) => (
          <div key={record.id} className="rounded-lg border border-border p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">{record.vendorName}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {record.deliveryNumber} | {record.poNumber}
                </p>
              </div>
              <StatusBadge status={record.status} />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {record.material} | {formatInr(record.value)} | Due {formatDate(record.expectedAt)}
            </p>
            {record.delayedDays > 0 ? (
              <p className="mt-1 text-xs font-medium text-destructive">{record.delayedDays} day delay</p>
            ) : null}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function PurchaseHistoryCard({ records }: { records: PurchaseHistoryRecord[] }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ReceiptText className="h-4 w-4 text-primary" />
          Purchase history
        </CardTitle>
        <CardDescription>Supplier purchase orders, receipts, invoice matching, and historical value</CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-xs">
          <thead className="text-muted-foreground">
            <tr className="border-b border-border">
              <th className="pb-2 pr-4 font-medium">Purchase order</th>
              <th className="pb-2 pr-4 font-medium">Vendor</th>
              <th className="pb-2 pr-4 font-medium">Category</th>
              <th className="pb-2 pr-4 text-right font-medium">Value</th>
              <th className="pb-2 pr-4 font-medium">Receipt</th>
              <th className="pb-2 font-medium">Invoice</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record) => (
              <tr key={record.id} className="border-b border-border/70 last:border-0">
                <td className="py-3 pr-4">
                  <p className="font-semibold">{record.poNumber}</p>
                  <p className="mt-1 text-muted-foreground">{formatDate(record.orderedAt)}</p>
                </td>
                <td className="py-3 pr-4">{record.vendorName}</td>
                <td className="py-3 pr-4 text-muted-foreground">{record.category}</td>
                <td className="py-3 pr-4 text-right font-medium">{formatInr(record.amount)}</td>
                <td className="py-3 pr-4">
                  <StatusBadge status={record.receiptStatus} />
                </td>
                <td className="py-3">
                  <StatusBadge status={record.invoiceStatus} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

function VendorComplianceEvidenceCard({ documents }: { documents: VendorComplianceDocument[] }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileCheck2 className="h-4 w-4 text-primary" />
          Vendor compliance documents
        </CardTitle>
        <CardDescription>GST, insurance, bank validation, expiry, and evidence ownership</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {documents.map((document) => (
          <div key={document.id} className="rounded-lg border border-border p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">{document.vendorName}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {document.documentNumber} | {formatStatus(document.documentType)}
                </p>
              </div>
              <StatusBadge status={document.status} />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Valid until {formatDate(document.validUntil)} | Owner {document.ownerRole}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function ComplianceDocumentsCard({
  onboardings,
  tickets,
}: {
  onboardings: VendorOnboardingView[];
  tickets: SupportTicketView[];
}) {
  const documentOnboardings = onboardings.filter((item) =>
    includesAny(item.currentStep, ["document", "certificate", "GST", "bank", "risk", "insurance"]),
  );
  const documentTickets = tickets.filter((ticket) =>
    includesAny(ticket.subject, ["certificate", "bank", "document", "insurance", "validation"]),
  );

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileCheck2 className="h-4 w-4 text-primary" />
          Compliance documents
        </CardTitle>
        <CardDescription>GST, insurance, bank, onboarding, and supplier compliance evidence</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {documentOnboardings.length === 0 && documentTickets.length === 0 ? (
          <EmptyState icon={FileCheck2} title="No document items" description="Compliance document tracking will appear here." />
        ) : (
          <>
            {documentOnboardings.map((item) => (
              <div key={item.id} className="rounded-lg border border-border p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{item.supplierName}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{item.currentStep}</p>
                  </div>
                  <StatusBadge status={item.status} />
                </div>
              </div>
            ))}
            {documentTickets.map((ticket) => (
              <TicketLine key={ticket.id} ticket={ticket} />
            ))}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function AiInsightsCard({
  title,
  description,
  insights,
  operationAlerts,
}: {
  title: string;
  description: string;
  insights: RelationshipAiInsightView[];
  operationAlerts: OperationRiskAlert[];
}) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-4 w-4 text-primary" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {insights.length === 0 && operationAlerts.length === 0 ? (
          <EmptyState icon={Bot} title="No AI insights" description="Relationship AI signals will appear here." />
        ) : (
          <>
            {insights.map((insight) => (
              <InsightLine key={insight.id} insight={insight} />
            ))}
            {operationAlerts.slice(0, 3).map((alert) => (
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
                <p className="mt-2 text-xs text-muted-foreground">
                  {formatStatus(alert.signalType)}
                  {alert.recordReference ? ` | ${alert.recordReference}` : ""}
                </p>
              </div>
            ))}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function WorkflowIntegrationCard({
  title,
  description,
  operations,
  emptyTitle,
}: {
  title: string;
  description: string;
  operations: OperationModuleDashboardData | null;
  emptyTitle: string;
}) {
  const waitingRecords = (operations?.records ?? []).filter((record) => record.status === "WAITING_APPROVAL");

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GitBranch className="h-4 w-4 text-primary" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {!operations ? (
          <EmptyState icon={GitBranch} title={emptyTitle} description="Linked workflow controls will appear after setup." />
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-3">
              <SummaryTile label="Approvals" value={String(waitingRecords.length)} />
              <SummaryTile label="Audit logs" value={String(operations.auditEvents.length)} />
              <SummaryTile label="Finance lines" value={String(operations.financeImpacts.length)} />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {operations.approvalFlows.slice(0, 4).map((flow) => (
                <div key={flow.id} className="rounded-lg border border-border p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{flow.name}</p>
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                        {flow.trigger}
                      </p>
                    </div>
                    <Badge variant={flow.isActive ? "success" : "default"}>
                      {formatRole(flow.approverRole)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function FinanceLinkageCard({
  title,
  description,
  operations,
  primaryLabel,
  primaryValue,
  secondaryLabel,
  secondaryValue,
}: {
  title: string;
  description: string;
  operations: OperationModuleDashboardData | null;
  primaryLabel: string;
  primaryValue: number;
  secondaryLabel: string;
  secondaryValue: number;
}) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IndianRupee className="h-4 w-4 text-primary" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border border-border bg-muted/20 p-4">
          <p className="text-xs text-muted-foreground">{primaryLabel}</p>
          <p className="mt-1 text-2xl font-semibold">{formatInr(primaryValue)}</p>
        </div>
        <div className="grid gap-2 text-sm">
          <SummaryRow label={secondaryLabel} value={formatInr(secondaryValue)} />
          <SummaryRow label="Linked inflow" value={formatInr(operations?.financeSummary.inflow ?? 0)} />
          <SummaryRow label="Linked outflow" value={formatInr(operations?.financeSummary.outflow ?? 0)} />
          <SummaryRow label="Neutral exposure" value={formatInr(operations?.financeSummary.neutralExposure ?? 0)} />
        </div>
      </CardContent>
    </Card>
  );
}

function DocumentTrackingCard({
  title,
  description,
  tickets,
  operations,
}: {
  title: string;
  description: string;
  tickets: SupportTicketView[];
  operations: OperationModuleDashboardData | null;
}) {
  const documentTickets = tickets.filter((ticket) =>
    includesAny(`${ticket.subject} ${ticket.description ?? ""}`, ["invoice", "evidence", "document", "copy", "acceptance"]),
  );
  const documentRecords = (operations?.records ?? []).filter((record) =>
    includesAny(`${record.title} ${record.description ?? ""}`, ["invoice", "document", "evidence", "acceptance"]),
  );

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileCheck2 className="h-4 w-4 text-primary" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {documentTickets.length === 0 && documentRecords.length === 0 ? (
          <EmptyState icon={FileCheck2} title="No document items" description="Document tracking activity will appear here." />
        ) : (
          <>
            {documentTickets.map((ticket) => (
              <TicketLine key={ticket.id} ticket={ticket} />
            ))}
            {documentRecords.slice(0, 3).map((record) => (
              <OperationRecordLine key={record.id} record={record} />
            ))}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function ActivityTimelineCard({
  title,
  relationshipEvents,
  operationEvents,
}: {
  title: string;
  relationshipEvents: RelationshipAuditView[];
  operationEvents: OperationAuditEvent[];
}) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Timer className="h-4 w-4 text-primary" />
          {title}
        </CardTitle>
        <CardDescription>Audit logs across relationship, portal, workflow, and finance activity</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {relationshipEvents.length === 0 && operationEvents.length === 0 ? (
          <EmptyState icon={Timer} title="No audit events" description="Relationship audit logs will appear here." />
        ) : (
          <>
            {relationshipEvents.map((event) => (
              <div key={event.id} className="rounded-lg border border-border p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="line-clamp-1 text-sm font-semibold">{formatStatus(event.action)}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {event.resource} | {formatDate(event.createdAt)}
                    </p>
                  </div>
                  <Badge variant={severityVariant(event.severity)}>{event.severity.toLowerCase()}</Badge>
                </div>
              </div>
            ))}
            {operationEvents.slice(0, 4).map((event) => (
              <div key={event.id} className="rounded-lg border border-border p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="line-clamp-1 text-sm font-semibold">{formatStatus(event.action)}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {event.recordReference ?? "Operation"} | {formatDate(event.createdAt)}
                    </p>
                  </div>
                  <Badge variant={severityVariant(event.severity)}>{event.severity.toLowerCase()}</Badge>
                </div>
              </div>
            ))}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function OperationRecordLine({ record }: { record: OperationRecord }) {
  return (
    <div className="rounded-lg border border-border p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold">{record.reference}</p>
            <StatusBadge status={record.status} />
          </div>
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
            {record.title}
            {record.stageName ? ` | ${record.stageName}` : ""}
          </p>
        </div>
        <div className="text-right text-xs">
          <p className="font-semibold">{record.amount == null ? "No amount" : formatInr(record.amount)}</p>
          <p className="text-muted-foreground">Risk {record.riskScore}</p>
        </div>
      </div>
    </div>
  );
}

function TicketLine({ ticket }: { ticket: SupportTicketView }) {
  return (
    <div className="rounded-lg border border-border p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold">{ticket.subject}</p>
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
            {ticket.ticketNumber} | {formatStatus(ticket.channel)} | Owner {formatRole(ticket.ownerRole)}
          </p>
        </div>
        <Badge variant={priorityVariant(ticket.priority)}>{formatStatus(ticket.priority)}</Badge>
      </div>
    </div>
  );
}

function InsightLine({ insight }: { insight: RelationshipAiInsightView }) {
  return (
    <div className="rounded-lg border border-border p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold">{insight.title}</p>
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
            {insight.description}
          </p>
        </div>
        <SeverityBadge severity={insight.severity} />
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        {insight.module}
        {insight.confidence == null ? "" : ` | ${Math.round(insight.confidence)}% confidence`}
      </p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  return <Badge variant={statusVariant(status)}>{formatStatus(status)}</Badge>;
}

function SeverityBadge({
  severity,
}: {
  severity: RelationshipAiInsightView["severity"] | OperationRiskAlert["severity"];
}) {
  return <Badge variant={severityVariant(severity)}>{severity.toLowerCase()}</Badge>;
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/20 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
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

function buildCrmMetrics(data: CrmOperationsPortalData) {
  const openLeads = data.crm.leads.filter((lead) => !["CONVERTED", "LOST"].includes(lead.status));
  const pipeline = data.crm.opportunities.reduce((sum, item) => sum + item.amount, 0);
  const weightedPipeline = data.crm.opportunities.reduce(
    (sum, item) => sum + (item.amount * item.probability) / 100,
    0,
  );
  const customerOutstanding = data.crm.customers.reduce((sum, customer) => sum + customer.outstandingAmount, 0);

  return {
    openLeads: openLeads.length,
    highScoreLeads: openLeads.filter((lead) => lead.score >= 80).length,
    pipeline,
    weightedPipeline,
    customerOutstanding,
    topCustomers: data.enterprise.customerProfitability.filter((customer) => customer.revenue >= 5000000).length,
    topCustomerName:
      data.enterprise.customerProfitability.slice().sort((left, right) => right.revenue - left.revenue).at(0)
        ?.customerName ?? "No customer",
    paymentRiskExposure: data.crm.customers.filter(isCustomerPaymentRisk).reduce((sum, customer) => sum + customer.outstandingAmount, 0),
    profitabilityBase: weightedPipeline - customerOutstanding * 0.05,
    profitabilityAlerts: data.crm.insights.filter((insight) =>
      includesAny(`${insight.title} ${insight.description}`, ["profitability", "profit", "margin"]),
    ).length,
    workflowApprovals: (data.operations?.records ?? []).filter((record) => record.status === "WAITING_APPROVAL").length,
    aiEscalations: data.crm.insights.filter((insight) => HIGH_PRIORITY.has(insight.severity)).length,
  };
}

function buildSrmMetrics(data: SrmOperationsPortalData) {
  const operationsRecords = data.operations?.records ?? [];
  const quotation = quotationRecords(data.operations);
  const delivery = operationsRecords.filter((record) =>
    ["goods_receipt_note", "dispatch", "delivery"].includes(record.stageKey ?? ""),
  );
  const purchaseRecords = operationsRecords.filter((record) => ACTIVE_OPERATION_STATUSES.has(record.status));
  const riskTierScores = data.srm.vendors.map((vendor) => {
    if (vendor.riskTier === "HIGH") return 85;
    if (vendor.riskTier === "MEDIUM") return 65;
    if (vendor.riskTier === "LOW") return 35;
    return 0;
  });

  return {
    activeVendors: data.srm.vendors.filter((vendor) => vendor.status === "ACTIVE").length,
    activeOnboardings: data.srm.onboardings.filter((item) => !["APPROVED", "REJECTED"].includes(item.status)).length,
    highRiskOnboardings: data.srm.onboardings.filter((item) => item.riskScore >= 75).length,
    quotationRecords: quotation.length,
    quotationValue: sumRecords(quotation),
    vendorRiskScore: Math.max(0, ...riskTierScores, ...data.srm.onboardings.map((item) => item.riskScore)),
    purchaseValue: sumRecords(purchaseRecords) + (data.operations?.financeSummary.outflow ?? 0),
    openPurchaseRecords: purchaseRecords.length,
    deliveryExceptions: delivery.filter((record) => ["BLOCKED", "EXCEPTION", "OPEN"].includes(record.status)).length,
    delayedSupplierDeliveries: data.enterprise.supplierDeliveries.filter((record) => record.status !== "ON_TRACK").length,
    deliveryExposure: sumRecords(delivery),
    complianceDocuments:
      data.srm.onboardings.filter((item) =>
        includesAny(item.currentStep, ["document", "certificate", "GST", "bank", "risk", "insurance"]),
      ).length +
      data.srm.tickets.filter((ticket) =>
        includesAny(`${ticket.subject} ${ticket.description ?? ""}`, ["certificate", "bank", "document", "insurance", "validation"]),
      ).length +
      data.enterprise.vendorDocuments.length,
    aiEscalations: data.srm.insights.filter((insight) => HIGH_PRIORITY.has(insight.severity)).length,
  };
}

function quotationRecords(operations: OperationModuleDashboardData | null): OperationRecord[] {
  return (operations?.records ?? []).filter((record) =>
    ["rfq", "vendor_quotation"].includes(record.stageKey ?? ""),
  );
}

function isCustomerPaymentRisk(customer: CustomerView): boolean {
  if (customer.creditLimit == null) return customer.outstandingAmount > 750000;
  return customer.outstandingAmount >= customer.creditLimit * 0.6;
}

function customerRiskLabel(customer: CustomerView): string {
  if (customer.creditLimit == null) return "watch";
  const usage = customer.outstandingAmount / customer.creditLimit;
  if (usage >= 0.8) return "high";
  if (usage >= 0.6) return "medium";
  return "watch";
}

function sumRecords(records: OperationRecord[]): number {
  return records.reduce((sum, record) => sum + (record.amount ?? 0), 0);
}

function statusVariant(status: string): "default" | "success" | "warning" | "danger" | "info" {
  if (["ACTIVE", "CONVERTED", "WON", "APPROVED", "COMPLETED", "RESOLVED", "CLOSED", "HEALTHY", "MATCHED", "ON_TRACK", "PREFERRED", "RECEIVED", "VALID"].includes(status)) {
    return "success";
  }
  if (["ATTENTION", "DELAYED", "EXPIRING", "MARGIN_WATCH", "PENDING", "REVIEW_PENDING", "SCHEDULED", "VALIDATION_PENDING", "WAITING_APPROVAL", "QUALIFIED", "PROPOSAL", "NEGOTIATION", "UNDER_REVIEW", "IN_PROGRESS", "OPEN", "NURTURING", "ONBOARDING", "WATCH"].includes(status)) {
    return "warning";
  }
  if (["BLOCKED", "COMPLIANCE_BLOCK", "EXCEPTION", "LOST", "QUALITY_HOLD", "REJECTED", "RISK_REVIEW", "CRITICAL", "HIGH"].includes(status)) return "danger";
  return "info";
}

function severityVariant(severity: string): "default" | "success" | "warning" | "danger" | "info" {
  if (severity === "CRITICAL" || severity === "HIGH" || severity === "ERROR") return "danger";
  if (severity === "MEDIUM" || severity === "WARNING") return "warning";
  if (severity === "INFO") return "info";
  return "success";
}

function priorityVariant(priority: string): "default" | "success" | "warning" | "danger" | "info" {
  if (priority === "CRITICAL" || priority === "HIGH") return "danger";
  if (priority === "MEDIUM") return "warning";
  return "info";
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

function includesAny(value: string, needles: string[]): boolean {
  const haystack = value.toLowerCase();
  return needles.some((needle) => haystack.includes(needle.toLowerCase()));
}
