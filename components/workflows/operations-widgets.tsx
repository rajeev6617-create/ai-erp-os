"use client";

import { Activity, BrainCircuit, CheckCircle2, Clock, XCircle } from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatInr } from "@/lib/dashboard/mock-data";
import { cn } from "@/lib/utils/cn";
import type { OperationsDashboardData } from "@/lib/workflows/types";

export function OperationsWidgets({
  stats,
  financeSummary,
  intelligence,
  auditAlerts,
  notifications,
}: Pick<
  OperationsDashboardData,
  "stats" | "financeSummary" | "intelligence" | "auditAlerts" | "notifications"
>) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Active workflows"
          value={String(stats.active)}
          change={`${stats.waitingApproval} awaiting approval`}
          trend="neutral"
          icon={Activity}
        />
        <StatCard
          label="Pending"
          value={String(stats.pending)}
          trend="neutral"
          icon={Clock}
        />
        <StatCard
          label="Completed today"
          value={String(stats.completedToday)}
          change={`~${stats.avgCompletionMins} min avg`}
          trend="up"
          icon={CheckCircle2}
        />
        <StatCard
          label="Failed"
          value={String(stats.failed)}
          trend="down"
          icon={XCircle}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <FinanceSummaryCompact summary={financeSummary} />
        <WorkflowIntelligenceCompact intelligence={intelligence} />
        <AuditAlertsCompact alerts={auditAlerts} />
      </div>

      <NotificationsStrip notifications={notifications} />
    </div>
  );
}

function WorkflowIntelligenceCompact({
  intelligence,
}: {
  intelligence: OperationsDashboardData["intelligence"];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <BrainCircuit className="h-4 w-4 text-primary" />
          Workflow intelligence
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-2 text-sm">
        {intelligence.widgets.map((widget) => (
          <div key={widget.id} className="flex items-center justify-between gap-3">
            <span className="min-w-0">
              <span className="block text-muted-foreground">{widget.label}</span>
              <span className="block truncate text-xs text-muted-foreground">
                {widget.detail}
              </span>
            </span>
            <span
              className={cn(
                "shrink-0 rounded-md px-2 py-1 text-sm font-semibold",
                widget.severity === "critical" &&
                  "bg-red-500/10 text-red-600 dark:text-red-400",
                widget.severity === "high" &&
                  "bg-red-500/10 text-red-600 dark:text-red-400",
                widget.severity === "medium" &&
                  "bg-amber-500/10 text-amber-600 dark:text-amber-400",
                widget.severity === "low" &&
                  "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
              )}
            >
              {widget.value}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function FinanceSummaryCompact({
  summary,
}: {
  summary: OperationsDashboardData["financeSummary"];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Finance snapshot</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-2 text-sm">
        <Row label="Revenue MTD" value={formatInr(summary.revenueMtd)} />
        <Row label="Expenses MTD" value={formatInr(summary.expensesMtd)} />
        <Row label="Outstanding" value={formatInr(summary.outstandingInvoices)} />
        <Row label="Pending payments" value={String(summary.pendingPayments)} />
      </CardContent>
    </Card>
  );
}

function AuditAlertsCompact({
  alerts,
}: {
  alerts: OperationsDashboardData["auditAlerts"];
}) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-sm">Audit alerts</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {alerts.map((a) => (
          <p key={a.id} className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">[{a.severity}]</span>{" "}
            {a.message} · {a.time}
          </p>
        ))}
      </CardContent>
    </Card>
  );
}

function NotificationsStrip({
  notifications,
}: {
  notifications: OperationsDashboardData["notifications"];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Recent notifications</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        {notifications.map((n) => (
          <span
            key={n.id}
            className="rounded-full border border-border bg-muted/50 px-3 py-1 text-xs"
          >
            {n.unread && (
              <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-primary" />
            )}
            {n.title} · {n.time}
          </span>
        ))}
      </CardContent>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
