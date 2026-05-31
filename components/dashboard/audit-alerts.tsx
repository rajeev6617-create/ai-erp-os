import { AlertCircle, AlertTriangle, Info } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { HomeDashboardSnapshot } from "@/lib/dashboard/home";
import { cn } from "@/lib/utils/cn";

const config = {
  critical: {
    icon: AlertCircle,
    className: "border-red-500/30 bg-red-500/5 text-red-600 dark:text-red-400",
  },
  warning: {
    icon: AlertTriangle,
    className: "border-amber-500/30 bg-amber-500/5 text-amber-600 dark:text-amber-400",
  },
  info: {
    icon: Info,
    className: "border-blue-500/30 bg-blue-500/5 text-blue-600 dark:text-blue-400",
  },
};

export function AuditAlerts({
  alerts,
}: {
  alerts: HomeDashboardSnapshot["auditAlerts"];
}) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Audit & security alerts</CardTitle>
        <CardDescription>Compliance and access monitoring</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {alerts.length === 0 && (
          <p className="text-sm text-muted-foreground">No recent audit events.</p>
        )}
        {alerts.map((alert) => {
          const { icon: Icon, className } = config[alert.severity];
          return (
            <div
              key={alert.id}
              className={cn("flex gap-3 rounded-lg border p-3", className)}
            >
              <Icon className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="text-sm font-medium leading-snug">{alert.message}</p>
                <p className="mt-1 text-xs opacity-70">{alert.time}</p>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
