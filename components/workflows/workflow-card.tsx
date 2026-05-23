"use client";

import { Clock, GitBranch, User } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { WorkflowStatusBadge } from "@/components/workflows/workflow-status-badge";
import { PriorityBadge } from "@/components/workflows/priority-badge";
import type { WorkflowCardData } from "@/lib/workflows/types";
import { cn } from "@/lib/utils/cn";

interface WorkflowCardProps {
  item: WorkflowCardData;
  selected?: boolean;
  onSelect?: (item: WorkflowCardData) => void;
}

function formatTimestamp(iso: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

export function WorkflowCard({ item, selected, onSelect }: WorkflowCardProps) {
  const amount = item.metadata?.amountInr as number | undefined;
  const latestEvent = item.timeline?.[0];

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={() => onSelect?.(item)}
      onKeyDown={(e) => e.key === "Enter" && onSelect?.(item)}
      className={cn(
        "cursor-pointer p-4 transition-all hover:border-primary/40 hover:shadow-md",
        selected && "border-primary ring-2 ring-primary/20",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-sm font-semibold">{item.title}</h3>
            <PriorityBadge priority={item.priority} />
          </div>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
            <GitBranch className="h-3.5 w-3.5" />
            {item.workflowName}
            <span className="text-border">|</span>
            {item.entityType}
          </p>
        </div>
        <WorkflowStatusBadge status={item.status} label={item.statusLabel} />
      </div>

      {item.description && (
        <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
          {item.description}
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <User className="h-3.5 w-3.5" />
          {item.assignee.name}
        </span>
        <span className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" />
          {formatTimestamp(item.updatedAt)}
        </span>
        {item.dueAt && (
          <span className="text-warning">Due {formatTimestamp(item.dueAt)}</span>
        )}
        {amount != null && (
          <span className="ml-auto font-medium text-foreground">
            {new Intl.NumberFormat("en-IN", {
              style: "currency",
              currency: "INR",
              maximumFractionDigits: 0,
            }).format(amount)}
          </span>
        )}
      </div>

      {latestEvent && (
        <p className="mt-3 line-clamp-1 rounded-md bg-muted px-2.5 py-2 text-xs text-muted-foreground">
          {latestEvent.label} by {latestEvent.actorName}
          {latestEvent.optimistic ? " (saving...)" : ""}
        </p>
      )}

      <div className="mt-3 flex items-center gap-2 border-t border-border pt-3">
        <Avatar initials={item.requester.initials} className="h-7 w-7 text-[10px]" />
        <span className="text-xs text-muted-foreground">
          Requested by <span className="font-medium text-foreground">{item.requester.name}</span>
        </span>
      </div>
    </Card>
  );
}
