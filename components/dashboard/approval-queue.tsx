import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { approvals, formatInr } from "@/lib/dashboard/mock-data";

const priorityVariant = {
  high: "danger" as const,
  medium: "warning" as const,
  low: "default" as const,
};

export function ApprovalQueue() {
  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle>Approval queue</CardTitle>
          <CardDescription>{approvals.length} items need attention</CardDescription>
        </div>
        <Button variant="ghost" size="sm">
          View all <ArrowRight className="ml-1 h-3.5 w-3.5" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {approvals.map((item) => (
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
