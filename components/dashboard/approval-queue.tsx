import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { HomeDashboardSnapshot } from "@/lib/dashboard/home";
import { formatInr } from "@/lib/dashboard/mock-data";

const priorityVariant = {
  high: "danger" as const,
  medium: "warning" as const,
  low: "default" as const,
};

export function ApprovalQueue({
  items,
}: {
  items: HomeDashboardSnapshot["approvals"];
}) {
  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle>Approval queue</CardTitle>
          <CardDescription>{items.length} items need attention</CardDescription>
        </div>
        <Link
          href="/dashboard/approvals"
          className="inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-medium text-foreground hover:bg-muted"
        >
          View all <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.length === 0 && (
          <p className="text-sm text-muted-foreground">No pending approvals in your queue.</p>
        )}
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-start justify-between gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted/40"
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate text-sm font-medium">{item.title}</p>
                <Badge variant={priorityVariant[item.priority]}>{item.priority}</Badge>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {item.type} · {item.requester}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-sm font-semibold">{formatInr(item.amount)}</p>
              <p className="text-[10px] text-muted-foreground">Due in {item.dueIn}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
