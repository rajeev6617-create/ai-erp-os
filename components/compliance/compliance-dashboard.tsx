import { ClipboardCheck, Shield, ShieldAlert, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatCard } from "@/components/ui/stat-card";
import type { ComplianceDashboardData } from "@/lib/compliance/types";

export function ComplianceDashboard({ data }: { data: ComplianceDashboardData }) {
  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-medium text-primary">Enterprise controls</p>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Compliance command center</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          GST, TDS, DPDP obligations, control assessments, evidence tracking, and audit-ready status
          across your tenant.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {data.stats.map((stat, index) => (
          <StatCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            change={stat.change}
            trend={stat.trend}
            icon={[Shield, ClipboardCheck, ShieldCheck, ShieldAlert][index] ?? Shield}
          />
        ))}
      </div>

      <section className="grid gap-4 xl:grid-cols-12">
        <Card className="xl:col-span-5">
          <CardHeader>
            <CardTitle>Frameworks</CardTitle>
            <CardDescription>Active regulatory and policy frameworks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.frameworks.length === 0 ? (
              <EmptyState
                icon={Shield}
                title="No frameworks"
                description="Run db:seed to load demo compliance frameworks."
              />
            ) : (
              data.frameworks.map((fw) => (
                <div key={fw.id} className="rounded-lg border border-border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold">{fw.name}</p>
                    <Badge variant="info">{fw.code}</Badge>
                  </div>
                  {fw.description && (
                    <p className="mt-1 text-xs text-muted-foreground">{fw.description}</p>
                  )}
                  <p className="mt-2 text-xs text-muted-foreground">
                    {fw.requirementCount} obligations · {fw.openAssessments} open assessments
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="xl:col-span-7">
          <CardHeader>
            <CardTitle>Assessments</CardTitle>
            <CardDescription>Current period control and filing status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.assessments.length === 0 ? (
              <EmptyState
                icon={ClipboardCheck}
                title="No assessments"
                description="Assessments appear when frameworks are configured."
              />
            ) : (
              data.assessments.map((item) => (
                <div
                  key={item.id}
                  className="grid gap-2 rounded-lg border border-border p-3 md:grid-cols-[1fr_auto]"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold">
                        {item.requirementTitle ?? item.frameworkName}
                      </p>
                      <Badge variant={statusVariant(item.status)}>{formatStatus(item.status)}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {item.frameworkCode} · {item.periodStart} to {item.periodEnd} ·{" "}
                      {item.evidenceCount} evidence
                    </p>
                    {item.notes && (
                      <p className="mt-1 text-xs text-muted-foreground">{item.notes}</p>
                    )}
                  </div>
                  <div className="text-sm md:text-right">
                    <p className="font-semibold">
                      {item.score != null ? `${item.score}%` : "—"}
                    </p>
                    <p className="text-xs text-muted-foreground">Compliance score</p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function statusVariant(status: string): "default" | "success" | "warning" | "danger" | "info" {
  if (status === "COMPLIANT") return "success";
  if (status === "IN_PROGRESS") return "info";
  if (status === "NON_COMPLIANT") return "danger";
  return "warning";
}

function formatStatus(status: string): string {
  return status.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}
