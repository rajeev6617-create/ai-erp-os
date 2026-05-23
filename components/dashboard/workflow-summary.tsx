import { Activity, CheckCircle2, Clock, XCircle } from "lucide-react";
import { CardDescription, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { workflowStats } from "@/lib/dashboard/mock-data";

export function WorkflowSummary() {
  return (
    <section>
      <div className="mb-3">
        <CardTitle>Workflow operations</CardTitle>
        <CardDescription>Real-time pipeline across departments</CardDescription>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Active runs"
          value={String(workflowStats.active)}
          change="+3 from yesterday"
          trend="up"
          icon={Activity}
        />
        <StatCard
          label="Awaiting action"
          value={String(workflowStats.pending)}
          change="5 need approval"
          trend="neutral"
          icon={Clock}
        />
        <StatCard
          label="Completed today"
          value={String(workflowStats.completedToday)}
          change="Avg 18 min"
          trend="up"
          icon={CheckCircle2}
        />
        <StatCard
          label="Failed"
          value={String(workflowStats.failed)}
          change="Requires review"
          trend="down"
          icon={XCircle}
          iconClassName="bg-red-500/10"
        />
      </div>
    </section>
  );
}
