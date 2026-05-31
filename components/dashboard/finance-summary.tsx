import { IndianRupee, PieChart, Receipt, Wallet } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { HomeDashboardSnapshot } from "@/lib/dashboard/home";
import { formatInr } from "@/lib/dashboard/mock-data";

export function FinanceSummary({
  summary,
}: {
  summary: HomeDashboardSnapshot["financeSummary"];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Finance summary</CardTitle>
        <CardDescription>MTD · INR · GST-inclusive</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <FinanceRow
            icon={IndianRupee}
            label="Revenue MTD"
            value={formatInr(summary.revenueMtd)}
            accent="text-emerald-600 dark:text-emerald-400"
          />
          <FinanceRow
            icon={Wallet}
            label="Expenses MTD"
            value={formatInr(summary.expensesMtd)}
          />
          <FinanceRow
            icon={Receipt}
            label="Outstanding invoices"
            value={formatInr(summary.outstandingInvoices)}
          />
          <FinanceRow
            icon={PieChart}
            label="GST liability"
            value={formatInr(summary.gstLiability)}
          />
        </div>
        <div>
          <div className="mb-1.5 flex justify-between text-xs">
            <span className="text-muted-foreground">Budget utilization</span>
            <span className="font-medium">{summary.budgetUtilization}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${Math.min(100, summary.budgetUtilization)}%` }}
            />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          {summary.pendingPayments} payments pending approval
        </p>
      </CardContent>
    </Card>
  );
}

function FinanceRow({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof IndianRupee;
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent">
        <Icon className="h-4 w-4 text-accent-foreground" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`text-sm font-semibold ${accent ?? ""}`}>{value}</p>
      </div>
    </div>
  );
}
