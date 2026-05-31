import { Building2, IndianRupee, MapPin, Settings2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import type { OrganizationDashboardData } from "@/lib/organization/types";

export function OrganizationDashboard({ data }: { data: OrganizationDashboardData }) {
  const org = data.organization;

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-medium text-primary">Tenant profile</p>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Organization</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Legal entity, statutory identifiers, departments, and platform configuration for{" "}
          {org.name}.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Status"
          value={org.status}
          change={`${org.tier} tier`}
          trend="neutral"
          icon={Building2}
        />
        <StatCard
          label="GSTIN"
          value={org.gstin ?? "—"}
          change="India statutory ID"
          trend="neutral"
          icon={IndianRupee}
        />
        <StatCard
          label="Timezone"
          value={org.timezone}
          change={`FY starts month ${org.fiscalYearStartMonth}`}
          trend="neutral"
          icon={MapPin}
        />
        <StatCard
          label="Departments"
          value={String(data.departments.length)}
          change={`Currency ${org.currency}`}
          trend="up"
          icon={Settings2}
        />
      </div>

      <section className="grid gap-4 xl:grid-cols-12">
        <Card className="xl:col-span-6">
          <CardHeader>
            <CardTitle>Entity details</CardTitle>
            <CardDescription>Registered organization profile</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <DetailRow label="Legal name" value={org.legalName ?? org.name} />
            <DetailRow label="Slug" value={org.slug} />
            <DetailRow label="PAN" value={org.pan ?? "—"} />
            <DetailRow label="GSTIN" value={org.gstin ?? "—"} />
          </CardContent>
        </Card>

        <Card className="xl:col-span-6">
          <CardHeader>
            <CardTitle>Platform settings</CardTitle>
            <CardDescription>Configuration applied to workflows and finance controls</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {data.settingsSummary.map((item) => (
              <DetailRow key={item.key} label={item.key} value={item.value} />
            ))}
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Departments</CardTitle>
          <CardDescription>Cost centers and team structure</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.departments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No departments configured yet.</p>
          ) : (
            data.departments.map((dept) => (
              <div
                key={dept.id}
                className="flex items-center justify-between rounded-lg border border-border p-3"
              >
                <div>
                  <p className="text-sm font-semibold">{dept.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {dept.code ?? "—"}
                    {dept.costCenterCode ? ` · CC ${dept.costCenterCode}` : ""}
                  </p>
                </div>
                <p className="text-sm font-medium">{dept.employeeCount} people</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border/60 py-2 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
