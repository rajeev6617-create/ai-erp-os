import { Activity, CheckCircle2, Clock, XCircle } from "lucide-react";
import { CardDescription, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import type { HomeDashboardSnapshot } from "@/lib/dashboard/home";

export function WorkflowSummary({
  stats,
}: {
  stats: HomeDashboardSnapshot["workflowStats"];
}) {
  return (
    <section>
      <div className="mb-3">
        <CardTitle>Workflow operations</CardTitle>
        <CardDescription>Real-time pipeline across departments</CardDescription>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Active runs"
          value={String(stats.active)}
          change={`${stats.pending} awaiting action`}
          trend="up"
          icon={Activity}
        />
        <StatCard
          label="Awaiting action"
          value={String(stats.pending)}
          change={`${stats.active} active runs`}
          trend="neutral"
          icon={Clock}
        />
        <StatCard
          label="Completed today"
          value={String(stats.completedToday)}
          change={`Avg ${stats.avgCompletionMins} min`}
          trend="up"
          icon={CheckCircle2}
        />
        <StatCard
          label="Failed"
          value={String(stats.failed)}
          change="Requires review"
          trend="down"
          icon={XCircle}
          iconClassName="bg-red-500/10"
        />
      </div>
    </section>
  );
}
