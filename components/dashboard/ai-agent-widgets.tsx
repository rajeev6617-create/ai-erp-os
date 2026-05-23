import { AlertTriangle, BadgeCheck, BrainCircuit, Landmark } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";
import type {
  AiAgentInsight,
  AiAgentSeverity,
  AuditorAiAgentResult,
  CfoAiAgentResult,
  ComplianceAiAgentResult,
} from "@/lib/ai-agents/types";

export function AiAgentWidgets({
  cfo,
  auditor,
  compliance,
}: {
  cfo: CfoAiAgentResult;
  auditor: AuditorAiAgentResult;
  compliance: ComplianceAiAgentResult;
}) {
  return (
    <section className="grid gap-4 xl:grid-cols-3">
      <AgentWidget
        title="CFO AI insights"
        description="Cash, budget, risk, and approval intelligence"
        icon={Landmark}
        badge={`${countCfo(cfo)} insight(s)`}
        insights={[
          ...cfo.financeRiskSummary,
          ...cfo.cashFlowInsights,
          ...cfo.budgetVarianceAlerts,
          ...cfo.approvalRecommendations,
        ]}
      />
      <AgentWidget
        title="Auditor AI alerts"
        description="Audit trail, unusual approvals, and evidence checks"
        icon={AlertTriangle}
        badge={`${countAuditor(auditor)} alert(s)`}
        insights={[
          ...auditor.unusualApprovalActivity,
          ...auditor.missingDocumentationAlerts,
          ...auditor.complianceRiskSignals,
          ...auditor.auditTrailReview,
        ]}
      />
      <AgentWidget
        title="Compliance AI reminders"
        description="GST/TDS reminders, filing risk, and statutory deadlines"
        icon={BadgeCheck}
        badge={`${countCompliance(compliance)} reminder(s)`}
        insights={[
          ...compliance.statutoryDeadlineWarnings,
          ...compliance.gstTdsReminderInsights,
          ...compliance.filingRiskAlerts,
        ]}
      />
    </section>
  );
}

function AgentWidget({
  title,
  description,
  icon: Icon,
  badge,
  insights,
}: {
  title: string;
  description: string;
  icon: typeof BrainCircuit;
  badge: string;
  insights: AiAgentInsight[];
}) {
  const topInsights = insights.slice(0, 4);

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Icon className="h-4 w-4 text-primary" />
              {title}
            </CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <Badge variant="info">{badge}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {topInsights.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
            No AI signal generated.
          </div>
        ) : (
          topInsights.map((item) => (
            <div key={item.id} className="rounded-lg border border-border p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="line-clamp-1 text-sm font-medium">{item.title}</p>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                    {item.description}
                  </p>
                </div>
                <SeverityBadge severity={item.severity}>{item.severity}</SeverityBadge>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                <span>{item.confidence}% confidence</span>
                {item.evidence.slice(0, 1).map((evidence) => (
                  <span key={evidence} className="line-clamp-1">
                    {evidence}
                  </span>
                ))}
              </div>
              <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
                {item.recommendation}
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
  severity: AiAgentSeverity;
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

function countCfo(data: CfoAiAgentResult): number {
  return (
    data.cashFlowInsights.length +
    data.budgetVarianceAlerts.length +
    data.financeRiskSummary.length +
    data.approvalRecommendations.length
  );
}

function countAuditor(data: AuditorAiAgentResult): number {
  return (
    data.auditTrailReview.length +
    data.unusualApprovalActivity.length +
    data.complianceRiskSignals.length +
    data.missingDocumentationAlerts.length
  );
}

function countCompliance(data: ComplianceAiAgentResult): number {
  return (
    data.gstTdsReminderInsights.length +
    data.filingRiskAlerts.length +
    data.statutoryDeadlineWarnings.length
  );
}
