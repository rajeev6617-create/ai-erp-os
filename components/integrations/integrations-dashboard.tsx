import { AlertTriangle, Link2, Plug, RefreshCw } from "lucide-react";
import { StatusBadge, ModuleDashboardShell } from "@/components/platform/module-dashboard";
import type { IntegrationsDashboardData } from "@/lib/integrations/types";

export function IntegrationsDashboard({ data }: { data: IntegrationsDashboardData }) {
  return (
    <ModuleDashboardShell
      eyebrow="Connected systems"
      title="Integrations"
      description="Payment gateways, ledgers, GST portal, and collaboration tools with sync health and error visibility."
      stats={data.stats}
      statIcons={[Plug, Link2, RefreshCw, AlertTriangle]}
      listTitle="Integration catalog"
      listDescription="Tenant-scoped connectors and sync status"
      emptyIcon={Plug}
      emptyTitle="No integrations"
      emptyDescription="Configure Razorpay, Tally, GST portal, or Slack from seed or settings."
    >
      {data.integrations.length > 0 &&
        data.integrations.map((item) => (
          <div
            key={item.id}
            className="grid gap-2 rounded-lg border border-border p-3 md:grid-cols-[1fr_auto]"
          >
            <div>
              <p className="text-sm font-semibold">{item.name}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Provider: {item.provider}
                {item.lastSyncAt
                  ? ` · Last sync ${new Date(item.lastSyncAt).toLocaleString("en-IN")}`
                  : ""}
              </p>
              {item.lastError && (
                <p className="mt-1 text-xs text-destructive">{item.lastError}</p>
              )}
            </div>
            <StatusBadge status={item.status} />
          </div>
        ))}
    </ModuleDashboardShell>
  );
}
