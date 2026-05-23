"use client";

import { cn } from "@/lib/utils/cn";
import type { ApprovalTab } from "@/lib/workflows/types";

const tabs: { id: ApprovalTab; label: string }[] = [
  { id: "pending", label: "Pending" },
  { id: "rejected", label: "Rejected" },
  { id: "completed", label: "Completed" },
];

interface ApprovalQueueTabsProps {
  active: ApprovalTab;
  counts: Record<ApprovalTab, number>;
  onChange: (tab: ApprovalTab) => void;
}

export function ApprovalQueueTabs({
  active,
  counts,
  onChange,
}: ApprovalQueueTabsProps) {
  return (
    <div className="flex gap-1 rounded-lg border border-border bg-muted/30 p-1">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
            active === tab.id
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {tab.label}
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-xs",
              active === tab.id ? "bg-primary/10 text-primary" : "bg-muted",
            )}
          >
            {counts[tab.id]}
          </span>
        </button>
      ))}
    </div>
  );
}
