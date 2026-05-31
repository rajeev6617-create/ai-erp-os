import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatCard } from "@/components/ui/stat-card";

export interface ModuleStat {
  label: string;
  value: string;
  change: string;
  trend: "up" | "down" | "neutral";
}

interface ModuleDashboardShellProps {
  eyebrow: string;
  title: string;
  description: string;
  stats: ModuleStat[];
  statIcons: LucideIcon[];
  listTitle: string;
  listDescription: string;
  emptyIcon: LucideIcon;
  emptyTitle: string;
  emptyDescription: string;
  children: React.ReactNode;
}

export function ModuleDashboardShell({
  eyebrow,
  title,
  description,
  stats,
  statIcons,
  listTitle,
  listDescription,
  emptyIcon,
  emptyTitle,
  emptyDescription,
  children,
}: ModuleDashboardShellProps) {
  const hasItems = Boolean(children);

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-medium text-primary">{eyebrow}</p>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat, index) => (
          <StatCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            change={stat.change}
            trend={stat.trend}
            icon={statIcons[index] ?? statIcons[0]}
          />
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{listTitle}</CardTitle>
          <CardDescription>{listDescription}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {!hasItems ? (
            <EmptyState icon={emptyIcon} title={emptyTitle} description={emptyDescription} />
          ) : (
            children
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  const variant =
    normalized.includes("active") || normalized.includes("connected") || normalized === "completed"
      ? "success"
      : normalized.includes("error") || normalized.includes("non")
        ? "danger"
        : normalized.includes("pending") || normalized.includes("invited")
          ? "warning"
          : "default";

  return <Badge variant={variant}>{formatStatus(status)}</Badge>;
}

function formatStatus(status: string): string {
  return status.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}
