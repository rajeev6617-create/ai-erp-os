"use client";

import { roleDashboardConfig, roleLabel } from "@/lib/dashboard/role-config";
import type { HomeDashboardSnapshot } from "@/lib/dashboard/home";
import type { DashboardUser } from "@/lib/dashboard/mock-data";
import { Badge } from "@/components/ui/badge";
import { WorkflowSummary } from "@/components/dashboard/workflow-summary";
import { FinanceSummary } from "@/components/dashboard/finance-summary";
import { ApprovalQueue } from "@/components/dashboard/approval-queue";
import { AuditAlerts } from "@/components/dashboard/audit-alerts";
import { AiAssistantPanel } from "@/components/dashboard/ai-assistant-panel";
import { EnterpriseAiWorkflowIntelligence } from "@/components/dashboard/enterprise-ai-workflow-intelligence";
import { DashboardReportActions } from "@/components/reports/dashboard-report-actions";

export function RoleDashboard({
  user,
  snapshot,
}: {
  user: DashboardUser;
  snapshot: HomeDashboardSnapshot;
}) {
  const config = roleDashboardConfig[user.role];

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            Good {getGreeting()}, {user.name.split(" ")[0]}
          </p>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {config.greeting}
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            {config.subtitle}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:items-end">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="info">{roleLabel(user.role)}</Badge>
            {config.kpiHighlight && (
              <Badge variant="success">{config.kpiHighlight}</Badge>
            )}
          </div>
          {(config.showWorkflows || config.showApprovals) && <DashboardReportActions />}
        </div>
      </header>

      {config.showWorkflows && <WorkflowSummary stats={snapshot.workflowStats} />}

      {(config.showWorkflows || config.showApprovals || config.showFinance) && (
        <EnterpriseAiWorkflowIntelligence />
      )}

      <div className="grid gap-4 lg:grid-cols-12">
        {config.showFinance && (
          <div className="lg:col-span-4">
            <FinanceSummary summary={snapshot.financeSummary} />
          </div>
        )}
        {config.showApprovals && (
          <div className={config.showFinance ? "lg:col-span-4" : "lg:col-span-6"}>
            <ApprovalQueue items={snapshot.approvals} />
          </div>
        )}
        {config.showAudit && (
          <div className={config.showFinance ? "lg:col-span-4" : "lg:col-span-6"}>
            <AuditAlerts alerts={snapshot.auditAlerts} />
          </div>
        )}
        {config.showAiPanel && (
          <div
            className={
              config.showFinance && config.showApprovals
                ? "lg:col-span-12 xl:col-span-5"
                : "lg:col-span-6"
            }
          >
            <AiAssistantPanel />
          </div>
        )}
      </div>

      {!config.showFinance &&
        !config.showApprovals &&
        !config.showAudit &&
        config.showAiPanel && (
          <div className="max-w-2xl">
            <AiAssistantPanel />
          </div>
        )}
    </div>
  );
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}
