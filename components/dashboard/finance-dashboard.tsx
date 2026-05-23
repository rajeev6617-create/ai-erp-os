import {
  AlertTriangle,
  BarChart3,
  Building2,
  ClipboardCheck,
  FileText,
  IndianRupee,
  Landmark,
  PieChart,
  Receipt,
  Wallet,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardReportActions } from "@/components/reports/dashboard-report-actions";
import { StatCard } from "@/components/ui/stat-card";
import { cn } from "@/lib/utils/cn";
import type { FinanceDashboardData } from "@/lib/dashboard/finance";

export function FinanceDashboard({ data }: { data: FinanceDashboardData }) {
  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Enterprise finance</p>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Finance command center
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Revenue, GST, invoices, expenses, budgets, and finance-control signals.
          </p>
        </div>
        <DashboardReportActions />
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Revenue MTD"
          value={formatInr(data.kpis.revenueMtd)}
          change={`${formatInr(data.kpis.netPositionMtd)} net position`}
          trend={data.kpis.netPositionMtd >= 0 ? "up" : "down"}
          icon={IndianRupee}
        />
        <StatCard
          label="Expenses MTD"
          value={formatInr(data.kpis.expensesMtd)}
          change={`${data.expenseAnalytics.categories.length} active categories`}
          trend="neutral"
          icon={Wallet}
        />
        <StatCard
          label="Outstanding invoices"
          value={formatInr(data.kpis.outstandingInvoices)}
          change={`${data.kpis.overdueInvoices} overdue`}
          trend={data.kpis.overdueInvoices > 0 ? "down" : "neutral"}
          icon={Receipt}
        />
        <StatCard
          label="Budget utilization"
          value={`${data.kpis.budgetUtilization}%`}
          change={`${formatInr(data.budgetTracking.remaining)} remaining`}
          trend={data.kpis.budgetUtilization > 90 ? "down" : "up"}
          icon={PieChart}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <GstSummary data={data} />
        <ExpenseAnalytics data={data} />
        <EnterpriseFinanceWidgets data={data} />
      </section>

      <section className="grid gap-4 xl:grid-cols-12">
        <div className="xl:col-span-7">
          <OutstandingInvoices data={data} />
        </div>
        <div className="xl:col-span-5">
          <BudgetTracking data={data} />
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-12">
        <div className="xl:col-span-5">
          <OutstandingPayments data={data} />
        </div>
        <div className="xl:col-span-7">
          <VendorRecords data={data} />
        </div>
      </section>

      <FinanceApprovalHistory data={data} />

      <FinanceAnomalies data={data} />
    </div>
  );
}

function GstSummary({ data }: { data: FinanceDashboardData }) {
  const rows = [
    ["Taxable value", data.gstSummary.taxableAmount],
    ["CGST", data.gstSummary.cgstAmount],
    ["SGST", data.gstSummary.sgstAmount],
    ["IGST", data.gstSummary.igstAmount],
    ["CESS", data.gstSummary.cessAmount],
    ["Output GST", data.gstSummary.outputGstAmount],
    ["Input GST credit", -data.gstSummary.inputGstAmount],
    ["TDS payable", data.gstSummary.tdsAmount],
  ] as const;

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Landmark className="h-4 w-4 text-primary" />
          GST summary
        </CardTitle>
        <CardDescription>
          {data.gstSummary.activeConfigurations} active tax configuration(s)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="rounded-lg border border-border bg-muted/20 p-3">
          <p className="text-xs text-muted-foreground">Net GST liability</p>
          <p className="mt-1 text-2xl font-semibold">
            {formatInr(data.gstSummary.netLiability)}
          </p>
        </div>
        <div className="grid gap-2 text-sm">
          {rows.map(([label, value]) => (
            <div key={label} className="flex justify-between gap-3">
              <span className="text-muted-foreground">{label}</span>
              <span className="font-medium">{formatInr(value)}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ExpenseAnalytics({ data }: { data: FinanceDashboardData }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" />
          Expense analytics
        </CardTitle>
        <CardDescription>
          GST input {formatInr(data.expenseAnalytics.gstInputMtd)} | TDS{" "}
          {formatInr(data.expenseAnalytics.tdsMtd)}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {data.expenseAnalytics.categories.length === 0 ? (
          <EmptyState message="No expenses recorded this month." />
        ) : (
          data.expenseAnalytics.categories.map((category) => (
            <div key={category.category}>
              <div className="mb-1.5 flex justify-between gap-3 text-xs">
                <span className="font-medium">{category.category}</span>
                <span className="text-muted-foreground">
                  {formatInr(category.amount)} | {category.count}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${Math.min(100, category.share)}%` }}
                />
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function EnterpriseFinanceWidgets({ data }: { data: FinanceDashboardData }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Enterprise finance widgets</CardTitle>
        <CardDescription>Control signals for finance operations</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {data.enterpriseWidgets.map((widget) => (
          <div
            key={widget.id}
            className="flex items-start justify-between gap-3 rounded-lg border border-border p-3"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium">{widget.label}</p>
              <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                {widget.detail}
              </p>
            </div>
            <SeverityBadge severity={widget.severity}>{widget.value}</SeverityBadge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function OutstandingInvoices({ data }: { data: FinanceDashboardData }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          Outstanding invoices
        </CardTitle>
        <CardDescription>Open receivables and collection exposure</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {data.outstandingInvoices.length === 0 ? (
          <EmptyState message="No outstanding invoices." />
        ) : (
          data.outstandingInvoices.map((invoice) => (
            <div
              key={invoice.id}
              className="grid gap-3 rounded-lg border border-border p-3 sm:grid-cols-[1fr_auto]"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{invoice.invoiceNumber}</p>
                  <Badge variant={invoice.status === "OVERDUE" ? "danger" : "warning"}>
                    {formatStatus(invoice.status)}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {invoice.buyerName}
                  {invoice.dueAt ? ` | Due ${formatDate(invoice.dueAt)}` : ""}
                </p>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-sm font-semibold">{formatInr(invoice.balanceAmount)}</p>
                <p className="text-xs text-muted-foreground">
                  Paid {formatInr(invoice.paidAmount)} of {formatInr(invoice.totalAmount)}
                </p>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function OutstandingPayments({ data }: { data: FinanceDashboardData }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IndianRupee className="h-4 w-4 text-primary" />
          Outstanding payments
        </CardTitle>
        <CardDescription>
          {formatInr(data.outstandingPayments.amount)} pending |{" "}
          {formatInr(data.outstandingPayments.overdueAmount)} overdue AP
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {data.outstandingPayments.records.length === 0 ? (
          <EmptyState message="No pending payment releases." />
        ) : (
          data.outstandingPayments.records.map((payment) => (
            <div
              key={payment.id}
              className="grid gap-3 rounded-lg border border-border p-3 sm:grid-cols-[1fr_auto]"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{payment.paymentNumber}</p>
                  <Badge variant={payment.status === "PROCESSING" ? "warning" : "default"}>
                    {formatStatus(payment.status)}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {payment.vendorName} | {payment.method}
                </p>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-sm font-semibold">{formatInr(payment.amount)}</p>
                <p className="text-xs text-muted-foreground">
                  Updated {formatDate(payment.updatedAt)}
                </p>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function VendorRecords({ data }: { data: FinanceDashboardData }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-primary" />
          Vendor records
        </CardTitle>
        <CardDescription>GST vendors, terms, expenses, and payment exposure</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-2 md:grid-cols-2">
        {data.vendors.length === 0 ? (
          <EmptyState message="No vendor records configured." />
        ) : (
          data.vendors.slice(0, 8).map((vendor) => (
            <div key={vendor.id} className="rounded-lg border border-border p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="line-clamp-1 text-sm font-medium">{vendor.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {vendor.code} | {vendor.gstin ?? "GSTIN pending"}
                  </p>
                </div>
                <Badge variant={vendor.status === "ACTIVE" ? "success" : "default"}>
                  {formatStatus(vendor.status)}
                </Badge>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                <div>
                  <p className="text-muted-foreground">Terms</p>
                  <p className="font-medium">{vendor.paymentTermsDays}d</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Pending</p>
                  <p className="font-medium">{formatInr(vendor.pendingPayments)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">MTD spend</p>
                  <p className="font-medium">{formatInr(vendor.expensesMtd)}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function BudgetTracking({ data }: { data: FinanceDashboardData }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Budget tracking</CardTitle>
        <CardDescription>
          {formatInr(data.budgetTracking.consumed)} consumed of{" "}
          {formatInr(data.budgetTracking.allocated)}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <div className="mb-1.5 flex justify-between text-xs">
            <span className="text-muted-foreground">Overall utilization</span>
            <span className="font-medium">{data.budgetTracking.utilization}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${Math.min(100, data.budgetTracking.utilization)}%` }}
            />
          </div>
        </div>
        {data.budgetTracking.budgets.length === 0 ? (
          <EmptyState message="No active budgets configured." />
        ) : (
          data.budgetTracking.budgets.slice(0, 6).map((budget) => (
            <div key={budget.id} className="rounded-lg border border-border p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="line-clamp-1 text-sm font-medium">{budget.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {budget.departmentName} | {budget.category}
                  </p>
                </div>
                <SeverityBadge severity={budget.utilization > 95 ? "critical" : budget.utilization > 80 ? "medium" : "low"}>
                  {budget.utilization}%
                </SeverityBadge>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Remaining {formatInr(budget.remaining)}
              </p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function FinanceApprovalHistory({ data }: { data: FinanceDashboardData }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClipboardCheck className="h-4 w-4 text-primary" />
          Finance approval history
        </CardTitle>
        <CardDescription>Workflow-linked approvals across invoices, expenses, and payments</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {data.financeApprovalHistory.length === 0 ? (
          <EmptyState message="No finance approvals recorded." />
        ) : (
          data.financeApprovalHistory.map((approval) => (
            <div key={approval.id} className="rounded-lg border border-border p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="line-clamp-1 text-sm font-medium">{approval.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {approval.workflowName} | {formatStatus(approval.entityType)}
                  </p>
                </div>
                <Badge variant={approval.status === "REJECTED" ? "danger" : approval.status === "APPROVED" ? "success" : "warning"}>
                  {formatStatus(approval.status)}
                </Badge>
              </div>
              <div className="mt-3 grid gap-1 text-xs text-muted-foreground">
                <p>Amount {formatInr(approval.amount)}</p>
                <p>Assignee {approval.assigneeName}</p>
                <p>
                  {approval.completedAt
                    ? `Completed ${formatDate(approval.completedAt)}`
                    : approval.dueAt
                      ? `Due ${formatDate(approval.dueAt)}`
                      : "No due date"}
                </p>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function FinanceAnomalies({ data }: { data: FinanceDashboardData }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-primary" />
          Finance anomaly alerts
        </CardTitle>
        <CardDescription>AI workflow signals affecting finance control</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {data.financeAnomalies.length === 0 ? (
          <EmptyState message="No finance anomalies detected." />
        ) : (
          data.financeAnomalies.map((alert) => (
            <div key={alert.id} className="rounded-lg border border-border p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{alert.title}</p>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                    {alert.description}
                  </p>
                </div>
                <SeverityBadge severity={alert.severity}>{alert.severity}</SeverityBadge>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {alert.evidence.slice(0, 2).join(" | ")}
              </p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function SeverityBadge({
  severity,
  children,
}: {
  severity: "low" | "medium" | "high" | "critical";
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-md px-2 py-0.5 text-xs font-medium capitalize",
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

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
      {message}
    </div>
  );
}

function formatInr(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatStatus(status: string): string {
  return status
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
  }).format(new Date(iso));
}
