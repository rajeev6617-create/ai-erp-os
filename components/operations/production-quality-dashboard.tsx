import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowRightLeft,
  Bot,
  Boxes,
  CircleDollarSign,
  ClipboardCheck,
  Factory,
  FileWarning,
  Gauge,
  GitBranch,
  History,
  PackageSearch,
  ShieldCheck,
  Timer,
  UsersRound,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { DashboardReportActions } from "@/components/reports/dashboard-report-actions";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import type {
  ManufacturingCapability,
  ProductionQualityOperationsData,
} from "@/lib/operations/production-quality-data";
import { cn } from "@/lib/utils/cn";

type ProductionQualityView = "production" | "quality";
type BadgeVariant = "default" | "success" | "warning" | "danger" | "info";

const widgetIcons: Record<string, LucideIcon> = {
  "active-work-orders": Wrench,
  "production-output": Factory,
  "rejection-rate": AlertTriangle,
  "machine-utilization": Gauge,
  "pending-qc": ClipboardCheck,
  "production-delays": Timer,
};

export function ProductionQualityDashboard({
  data,
  view,
}: {
  data: ProductionQualityOperationsData;
  view: ProductionQualityView;
}) {
  return (
    <div className="space-y-6">
      <ManufacturingHeader asOf={data.asOf} view={view} />
      <WidgetGrid data={data} />
      <AiInsightsCard data={data} />
      {view === "production" ? <ProductionWorkspace data={data} /> : <QualityWorkspace data={data} />}
      <WorkflowIntegration data={data} />
    </div>
  );
}

function ManufacturingHeader({
  asOf,
  view,
}: {
  asOf: string;
  view: ProductionQualityView;
}) {
  const isProduction = view === "production";

  return (
    <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p className="text-sm text-muted-foreground">Manufacturing operations</p>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          {isProduction ? "ASTRA Production Management" : "ASTRA Quality Management"}
        </h1>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
          {isProduction
            ? "BOM governance, work orders, production planning, material issue, finished-goods receipts, job work, line utilization, and variance control."
            : "Incoming, in-process, and final inspection with rejection tracking, NCR governance, quality holds, and approval workflow."}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <WorkspaceLink
            active={isProduction}
            href="/dashboard/operations/production"
            icon={Factory}
            label="Production"
          />
          <WorkspaceLink
            active={!isProduction}
            href="/dashboard/operations/quality"
            icon={ClipboardCheck}
            label="Quality"
          />
          <span className="text-xs text-muted-foreground">
            Demo snapshot {formatDate(asOf)}
          </span>
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

function WidgetGrid({ data }: { data: ProductionQualityOperationsData }) {
  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {data.widgets.map((widget) => (
        <StatCard
          key={widget.key}
          label={widget.label}
          value={widget.value}
          change={widget.change}
          trend={widget.trend}
          icon={widgetIcons[widget.key] ?? Boxes}
        />
      ))}
    </section>
  );
}

function AiInsightsCard({ data }: { data: ProductionQualityOperationsData }) {
  return (
    <section>
      <SectionHeading
        badge="AI monitored"
        description="Delay, shortage, quality, rejection, and efficiency recommendations for plant teams."
        title="ASTRA AI manufacturing insights"
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

function ProductionWorkspace({ data }: { data: ProductionQualityOperationsData }) {
  return (
    <>
      <CapabilityGrid
        badge={`${data.productionCapabilities.length} capabilities`}
        capabilities={data.productionCapabilities}
        description="Connected production workspaces with ownership, controls, and execution volume."
        title="Production operations"
      />
      <WorkOrdersCard data={data} />
      <section className="grid gap-4 xl:grid-cols-12">
        <div className="xl:col-span-7">
          <ProductionPlansCard data={data} />
        </div>
        <div className="xl:col-span-5">
          <MachineUtilizationCard data={data} />
        </div>
      </section>
      <section className="grid gap-4 xl:grid-cols-12">
        <div className="xl:col-span-5">
          <BomManagementCard data={data} />
        </div>
        <div className="xl:col-span-7">
          <MaterialFlowCard data={data} />
        </div>
      </section>
      <section className="grid gap-4 xl:grid-cols-12">
        <div className="xl:col-span-6">
          <JobWorkCard data={data} />
        </div>
        <div className="xl:col-span-6">
          <VarianceCard data={data} />
        </div>
      </section>
    </>
  );
}

function QualityWorkspace({ data }: { data: ProductionQualityOperationsData }) {
  return (
    <>
      <CapabilityGrid
        badge={`${data.qualityCapabilities.length} controls`}
        capabilities={data.qualityCapabilities}
        description="Inspection, rejection, NCR, and release workflows with accountable ownership."
        title="Quality operations"
      />
      <QualityChecksCard data={data} />
      <section className="grid gap-4 xl:grid-cols-12">
        <div className="xl:col-span-6">
          <RejectionTrackingCard data={data} />
        </div>
        <div className="xl:col-span-6">
          <NcrReportsCard data={data} />
        </div>
      </section>
      <QualityApprovalWorkflowCard data={data} />
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
  capabilities: ManufacturingCapability[];
  description: string;
  title: string;
}) {
  return (
    <section>
      <SectionHeading badge={badge} description={description} title={title} />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {capabilities.map((capability) => (
          <div key={capability.key} className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">{capability.label}</p>
                <p className="mt-1 text-xs text-muted-foreground">{capability.description}</p>
              </div>
              <Badge variant={statusVariant(capability.status)}>
                {formatStatus(capability.status)}
              </Badge>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              {formatCompact(capability.openItems)} open | Owner {capability.ownerRole}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function WorkOrdersCard({ data }: { data: ProductionQualityOperationsData }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wrench className="h-4 w-4 text-primary" />
          Work orders
        </CardTitle>
        <CardDescription>Released manufacturing work with progress, line, rejection, and due-date state</CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full min-w-[980px] text-left text-xs">
          <thead className="text-muted-foreground">
            <tr className="border-b border-border">
              <th className="pb-2 pr-4 font-medium">Work order</th>
              <th className="pb-2 pr-4 font-medium">Product</th>
              <th className="pb-2 pr-4 font-medium">Line / owner</th>
              <th className="pb-2 pr-4 font-medium">Progress</th>
              <th className="pb-2 pr-4 text-right font-medium">Rejected</th>
              <th className="pb-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {data.workOrders.map((order) => (
              <tr key={order.id} className="border-b border-border/70 last:border-0">
                <td className="py-3 pr-4">
                  <p className="font-semibold">{order.workOrderNumber}</p>
                  <p className="mt-1 text-muted-foreground">Due {formatDate(order.dueAt)}</p>
                </td>
                <td className="py-3 pr-4">
                  <p className="font-medium">{order.productName}</p>
                  <p className="mt-1 text-muted-foreground">{order.productSku}</p>
                </td>
                <td className="py-3 pr-4 text-muted-foreground">
                  {order.lineCode} | {order.owner}
                </td>
                <td className="py-3 pr-4">
                  <ProgressBar
                    label={`${order.completedQuantity} / ${order.plannedQuantity} EA`}
                    value={percent(order.completedQuantity, order.plannedQuantity)}
                  />
                </td>
                <td className="py-3 pr-4 text-right font-medium">{order.rejectedQuantity}</td>
                <td className="py-3">
                  <Badge variant={statusVariant(order.status)}>{formatStatus(order.status)}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

function ProductionPlansCard({ data }: { data: ProductionQualityOperationsData }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GitBranch className="h-4 w-4 text-primary" />
          Production planning
        </CardTitle>
        <CardDescription>Weekly release, capacity load, and material readiness</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {data.plans.map((plan) => (
          <div key={plan.id} className="rounded-lg border border-border p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">{plan.productName}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {plan.planNumber} | {plan.period}
                </p>
              </div>
              <Badge variant={statusVariant(plan.status)}>{formatStatus(plan.status)}</Badge>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <Metric label="Released" value={`${plan.releasedQuantity} / ${plan.plannedQuantity}`} />
              <Metric label="Capacity load" value={`${plan.capacityLoad}%`} />
              <Metric label="Material ready" value={`${plan.materialReadiness}%`} />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function MachineUtilizationCard({ data }: { data: ProductionQualityOperationsData }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gauge className="h-4 w-4 text-primary" />
          Machine and line utilization
        </CardTitle>
        <CardDescription>Shift loading, OEE, output, and downtime</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {data.machines.map((machine) => (
          <div key={machine.id} className="rounded-lg border border-border p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">{machine.lineName}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {machine.lineCode} | {machine.plant} | Shift {machine.shift}
                </p>
              </div>
              <Badge variant={statusVariant(machine.status)}>
                {machine.utilizationPercent}%
              </Badge>
            </div>
            <div className="mt-3">
              <ProgressBar label={`${machine.oeePercent}% OEE`} value={machine.utilizationPercent} />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {machine.outputUnits} EA output | {machine.downtimeMinutes} min downtime
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function BomManagementCard({ data }: { data: ProductionQualityOperationsData }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Boxes className="h-4 w-4 text-primary" />
          BOM management
        </CardTitle>
        <CardDescription>Versioned structures, costing, yield, and engineering approval</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {data.boms.map((bom) => (
          <div key={bom.id} className="rounded-lg border border-border p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">{bom.productName}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {bom.bomNumber} | v{bom.version} | {bom.productSku}
                </p>
              </div>
              <Badge variant={statusVariant(bom.status)}>{formatStatus(bom.status)}</Badge>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {bom.componentCount} components | Yield {bom.yieldQuantity} | {formatInr(bom.standardCost)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Approval: {bom.approvedBy}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function MaterialFlowCard({ data }: { data: ProductionQualityOperationsData }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowRightLeft className="h-4 w-4 text-primary" />
          Material issue and finished goods receipt
        </CardTitle>
        <CardDescription>Warehouse-linked material postings against production execution</CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-xs">
          <thead className="text-muted-foreground">
            <tr className="border-b border-border">
              <th className="pb-2 pr-4 font-medium">Reference</th>
              <th className="pb-2 pr-4 font-medium">Item</th>
              <th className="pb-2 pr-4 font-medium">Warehouse link</th>
              <th className="pb-2 pr-4 text-right font-medium">Quantity</th>
              <th className="pb-2 pr-4 text-right font-medium">Value</th>
              <th className="pb-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {data.materialFlows.map((flow) => (
              <tr key={flow.id} className="border-b border-border/70 last:border-0">
                <td className="py-3 pr-4">
                  <p className="font-semibold">{flow.reference}</p>
                  <p className="mt-1 text-muted-foreground">
                    {formatStatus(flow.flowType)} | {flow.workOrderNumber}
                  </p>
                </td>
                <td className="py-3 pr-4">
                  <p className="font-medium">{flow.itemName}</p>
                  <p className="mt-1 text-muted-foreground">{flow.itemSku}</p>
                </td>
                <td className="py-3 pr-4 text-muted-foreground">{flow.location}</td>
                <td className="py-3 pr-4 text-right font-medium">
                  {formatCompact(flow.quantity)} {flow.uom}
                </td>
                <td className="py-3 pr-4 text-right font-medium">{formatInr(flow.value)}</td>
                <td className="py-3">
                  <Badge variant={statusVariant(flow.status)}>{formatStatus(flow.status)}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

function JobWorkCard({ data }: { data: ProductionQualityOperationsData }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UsersRound className="h-4 w-4 text-primary" />
          Job work tracking
        </CardTitle>
        <CardDescription>Subcontract issue, receipt, due date, and vendor exposure</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {data.jobWorks.map((job) => (
          <div key={job.id} className="rounded-lg border border-border p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">{job.jobWorkNumber}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {job.vendorName} | {job.operation}
                </p>
              </div>
              <Badge variant={statusVariant(job.status)}>{formatStatus(job.status)}</Badge>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {job.itemName} | {job.receivedQuantity} / {job.issuedQuantity} received |{" "}
              {formatInr(job.value)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Due {formatDate(job.dueAt)}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function VarianceCard({ data }: { data: ProductionQualityOperationsData }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          Production variance
        </CardTitle>
        <CardDescription>Cycle-time, yield, labor, and financial deviation controls</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {data.variances.map((variance) => (
          <div key={variance.id} className="rounded-lg border border-border p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">{variance.reference}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {variance.workOrderNumber} | {variance.productName}
                </p>
              </div>
              <Badge variant={statusVariant(variance.status)}>
                {variance.variancePercent > 0 ? "+" : ""}
                {variance.variancePercent}%
              </Badge>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {formatStatus(variance.varianceType)} | Standard {variance.standardValue} | Actual{" "}
              {variance.actualValue} | Impact {formatInr(variance.impact)}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function QualityChecksCard({ data }: { data: ProductionQualityOperationsData }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClipboardCheck className="h-4 w-4 text-primary" />
          Inspection control tower
        </CardTitle>
        <CardDescription>Incoming QC, in-process gates, and final inspection release state</CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full min-w-[980px] text-left text-xs">
          <thead className="text-muted-foreground">
            <tr className="border-b border-border">
              <th className="pb-2 pr-4 font-medium">Inspection</th>
              <th className="pb-2 pr-4 font-medium">Reference</th>
              <th className="pb-2 pr-4 font-medium">Item</th>
              <th className="pb-2 pr-4 text-right font-medium">Sample</th>
              <th className="pb-2 pr-4 text-right font-medium">Accepted / rejected</th>
              <th className="pb-2 pr-4 font-medium">Defect</th>
              <th className="pb-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {data.qualityChecks.map((check) => (
              <tr key={check.id} className="border-b border-border/70 last:border-0">
                <td className="py-3 pr-4">
                  <p className="font-semibold">{check.inspectionNumber}</p>
                  <p className="mt-1 text-muted-foreground">{formatStatus(check.inspectionType)}</p>
                </td>
                <td className="py-3 pr-4 text-muted-foreground">
                  {check.reference}
                  <p className="mt-1">Due {formatDate(check.dueAt)}</p>
                </td>
                <td className="py-3 pr-4">
                  <p className="font-medium">{check.itemName}</p>
                  <p className="mt-1 text-muted-foreground">{check.inspector}</p>
                </td>
                <td className="py-3 pr-4 text-right">{check.sampleSize}</td>
                <td className="py-3 pr-4 text-right font-medium">
                  {check.acceptedQuantity} / {check.rejectedQuantity}
                </td>
                <td className="py-3 pr-4 text-muted-foreground">{check.defectType}</td>
                <td className="py-3">
                  <Badge variant={statusVariant(check.status)}>{formatStatus(check.status)}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

function RejectionTrackingCard({ data }: { data: ProductionQualityOperationsData }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-primary" />
          Rejection tracking
        </CardTitle>
        <CardDescription>Defect class, source, rate, and disposition visibility</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {data.rejections.map((rejection) => (
          <div key={rejection.id} className="rounded-lg border border-border p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">{rejection.itemName}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {rejection.reference} | {rejection.source}
                </p>
              </div>
              <Badge variant={statusVariant(rejection.status)}>{rejection.rejectionRate}%</Badge>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Qty {rejection.quantity} | {rejection.defectType} | {rejection.disposition}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function NcrReportsCard({ data }: { data: ProductionQualityOperationsData }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileWarning className="h-4 w-4 text-primary" />
          NCR reports
        </CardTitle>
        <CardDescription>Non-conformance, root cause, CAPA, and closure controls</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {data.ncrs.map((ncr) => (
          <div key={ncr.id} className="rounded-lg border border-border p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">{ncr.ncrNumber}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {ncr.source} | {ncr.linkedReference}
                </p>
              </div>
              <Badge variant={statusVariant(ncr.status)}>{formatStatus(ncr.status)}</Badge>
            </div>
            <p className="mt-2 text-xs font-medium">{ncr.issue}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {ncr.rootCause} | Owner {ncr.ownerRole} | Due {formatDate(ncr.dueAt)}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function QualityApprovalWorkflowCard({ data }: { data: ProductionQualityOperationsData }) {
  const qualityApprovals = data.approvals.filter((approval) =>
    ["Incoming QC release", "Final inspection"].includes(approval.workflow),
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" />
          Quality approval workflow
        </CardTitle>
        <CardDescription>Human release decisions for inspection holds and dispositions</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2">
        {qualityApprovals.map((approval) => (
          <div key={approval.id} className="rounded-lg border border-border p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">{approval.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {approval.reference} | Owner {approval.ownerRole}
                </p>
              </div>
              <Badge variant={statusVariant(approval.status)}>
                {formatStatus(approval.status)}
              </Badge>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {approval.impact} | Due {formatDate(approval.dueAt)}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function WorkflowIntegration({ data }: { data: ProductionQualityOperationsData }) {
  return (
    <>
      <section>
        <SectionHeading
          badge="Workflow linked"
          description="Approvals, inventory, finance, party linkage, and evidence embedded in execution."
          title="Enterprise workflow integration"
        />
        <div className="grid gap-4 xl:grid-cols-12">
          <div className="xl:col-span-7">
            <ApprovalQueue data={data} />
          </div>
          <div className="xl:col-span-5">
            <FinanceImpactCard data={data} />
          </div>
        </div>
      </section>
      <section className="grid gap-4 xl:grid-cols-12">
        <div className="xl:col-span-7">
          <InventoryLinkageCard data={data} />
        </div>
        <div className="xl:col-span-5">
          <PartyLinkageCard data={data} />
        </div>
      </section>
      <AuditLogCard data={data} />
    </>
  );
}

function ApprovalQueue({ data }: { data: ProductionQualityOperationsData }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GitBranch className="h-4 w-4 text-primary" />
          Manufacturing approval queue
        </CardTitle>
        <CardDescription>Quality, engineering, variance, and shortage decisions</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {data.approvals.map((approval) => (
          <div key={approval.id} className="rounded-lg border border-border p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">{approval.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {approval.reference} | {approval.workflow} | Owner {approval.ownerRole}
                </p>
              </div>
              <Badge variant={statusVariant(approval.status)}>
                {formatStatus(approval.status)}
              </Badge>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {approval.impact} | Due {formatDate(approval.dueAt)}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function FinanceImpactCard({ data }: { data: ProductionQualityOperationsData }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CircleDollarSign className="h-4 w-4 text-primary" />
          Finance impact
        </CardTitle>
        <CardDescription>Output value, variance, quality hold, and job-work exposure</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {data.financeImpacts.map((impact) => (
          <div key={impact.id} className="rounded-lg border border-border p-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium">{impact.label}</p>
              <Badge variant={impact.tone}>{formatInr(impact.amount)}</Badge>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{impact.context}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function InventoryLinkageCard({ data }: { data: ProductionQualityOperationsData }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PackageSearch className="h-4 w-4 text-primary" />
          Inventory linkage
        </CardTitle>
        <CardDescription>Raw-material demand, issue, finished-goods receipt, and quality hold state</CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-xs">
          <thead className="text-muted-foreground">
            <tr className="border-b border-border">
              <th className="pb-2 pr-4 font-medium">Item</th>
              <th className="pb-2 pr-4 font-medium">Linkage</th>
              <th className="pb-2 pr-4 text-right font-medium">Required</th>
              <th className="pb-2 pr-4 text-right font-medium">Available</th>
              <th className="pb-2 pr-4 font-medium">Warehouse</th>
              <th className="pb-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {data.inventoryLinks.map((link) => (
              <tr key={link.id} className="border-b border-border/70 last:border-0">
                <td className="py-3 pr-4">
                  <p className="font-semibold">{link.itemName}</p>
                  <p className="mt-1 text-muted-foreground">{link.itemSku}</p>
                </td>
                <td className="py-3 pr-4 text-muted-foreground">
                  {formatStatus(link.linkageType)} | {link.reference}
                </td>
                <td className="py-3 pr-4 text-right">
                  {link.requiredQuantity} {link.uom}
                </td>
                <td className="py-3 pr-4 text-right font-medium">
                  {link.availableQuantity} {link.uom}
                </td>
                <td className="py-3 pr-4 text-muted-foreground">{link.warehouse}</td>
                <td className="py-3">
                  <Badge variant={statusVariant(link.status)}>{formatStatus(link.status)}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

function PartyLinkageCard({ data }: { data: ProductionQualityOperationsData }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UsersRound className="h-4 w-4 text-primary" />
          Vendor and customer linkage
        </CardTitle>
        <CardDescription>External commitments tied to quality, job work, and output</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {data.partyLinks.map((party) => (
          <div key={party.id} className="rounded-lg border border-border p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">{party.partyName}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {party.partyType.toLowerCase()} | {party.partyCode} | {party.reference}
                </p>
              </div>
              <Badge variant={statusVariant(party.status)}>{formatStatus(party.status)}</Badge>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {party.linkage} | {formatInr(party.value)}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function AuditLogCard({ data }: { data: ProductionQualityOperationsData }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-4 w-4 text-primary" />
          Manufacturing audit logs
        </CardTitle>
        <CardDescription>Control evidence from plant teams, quality teams, and ASTRA AI</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {data.auditLogs.map((log) => (
          <div key={log.id} className="rounded-lg border border-border p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="truncate text-sm font-semibold">{formatStatus(log.action)}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {log.resource} | {log.reference}
                </p>
              </div>
              <Badge variant={severityVariant(log.severity)}>{log.severity.toLowerCase()}</Badge>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {log.actor} | {formatDate(log.createdAt)}
            </p>
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
    <div className="rounded-md bg-muted/60 p-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  );
}

function ProgressBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="min-w-32">
      <div className="mb-1 flex items-center justify-between gap-2 text-xs">
        <span>{label}</span>
        <span className="text-muted-foreground">{value}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full", value >= 90 ? "bg-emerald-500" : "bg-primary")}
          style={{ width: `${Math.min(100, value)}%` }}
        />
      </div>
    </div>
  );
}

function statusVariant(status: string): BadgeVariant {
  if (
    [
      "ACTIVE",
      "CLOSED",
      "COMPLETED",
      "DISPATCH_READY",
      "ISSUED",
      "PASSED",
      "POSTED",
      "RECEIVED",
      "RELEASED",
    ].includes(status)
  ) {
    return "success";
  }
  if (
    [
      "APPROVAL_PENDING",
      "ATTENTION",
      "CAPA_PENDING",
      "CLOSURE_PENDING",
      "DELAY_RISK",
      "IN_PROGRESS",
      "INVESTIGATION",
      "OPEN",
      "PENDING",
      "QC_PENDING",
      "REVISION_PENDING",
      "REVIEW",
      "REWORK",
    ].includes(status)
  ) {
    return "warning";
  }
  if (["BLOCKED", "QC_HOLD", "QUALITY_HOLD", "QUALITY_REVIEW", "SHORTAGE"].includes(status)) {
    return "danger";
  }
  return "info";
}

function severityVariant(severity: string): BadgeVariant {
  if (severity === "CRITICAL" || severity === "HIGH") return "danger";
  if (severity === "MEDIUM") return "warning";
  if (severity === "LOW") return "success";
  return "info";
}

function percent(value: number, total: number): number {
  return total === 0 ? 0 : Math.round((value / total) * 100);
}

function formatStatus(value: string): string {
  return value
    .toLowerCase()
    .replaceAll(".", " ")
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatInr(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
    notation: Math.abs(amount) >= 1000000 ? "compact" : "standard",
  }).format(amount);
}

function formatCompact(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 1,
    notation: Math.abs(value) >= 1000 ? "compact" : "standard",
  }).format(value);
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}
