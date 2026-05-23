"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { GitBranch, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ApprovalQueueTabs } from "@/components/workflows/approval-queue-tabs";
import { WorkflowCard } from "@/components/workflows/workflow-card";
import { ApprovalActions } from "@/components/workflows/approval-actions";
import { AiWorkflowPanel } from "@/components/workflows/ai-workflow-panel";
import { OperationsWidgets } from "@/components/workflows/operations-widgets";
import { DashboardReportActions } from "@/components/reports/dashboard-report-actions";
import { apiFetch } from "@/lib/api/client";
import type {
  ApprovalActionType,
  ApprovalTab,
  OperationsDashboardData,
  WorkflowCardData,
  WorkflowTimelineEvent,
} from "@/lib/workflows/types";

interface OperationsDashboardProps {
  initialData: OperationsDashboardData;
}

export function OperationsDashboard({ initialData }: OperationsDashboardProps) {
  const [data, setData] = useState(initialData);
  const [tab, setTab] = useState<ApprovalTab>("pending");
  const [selected, setSelected] = useState<WorkflowCardData | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const optimisticSnapshot = useRef<{
    data: OperationsDashboardData;
    selected: WorkflowCardData | null;
  } | null>(null);

  const queueItems = useMemo(() => data.approvals[tab], [data, tab]);

  const counts = useMemo(
    () => ({
      pending: data.approvals.pending.length,
      rejected: data.approvals.rejected.length,
      completed: data.approvals.completed.length,
    }),
    [data],
  );

  const refresh = useCallback(async () => {
    setRefreshing(true);
    const res = await apiFetch<OperationsDashboardData>("/api/operations/dashboard");
    setRefreshing(false);
    if (res.success && res.data) {
      setData(res.data);
      setSelected(null);
    }
  }, []);

  const onActionComplete = useCallback(async () => {
    await refresh();
  }, [refresh]);

  const onActionStart = useCallback(
    (item: WorkflowCardData, action: ApprovalActionType, comment: string) => {
      optimisticSnapshot.current = { data, selected };
      const optimisticEvent = createOptimisticTimelineEvent(action, comment);
      const optimisticStatus = optimisticApprovalStatus(action);
      const optimisticExecutionStatus = optimisticWorkflowStatus(action);

      setData((current) =>
        applyOptimisticAction(
          current,
          item,
          optimisticStatus,
          optimisticExecutionStatus,
          optimisticEvent,
          action,
        ),
      );
      setSelected((current) =>
        current && matchesWorkflowItem(current, item)
          ? updateWorkflowItem(
              current,
              optimisticStatus,
              optimisticExecutionStatus,
              optimisticEvent,
              action,
              isExecutionItem(current) ? "execution" : "approval",
            )
          : current,
      );
    },
    [data, selected],
  );

  const onActionError = useCallback(() => {
    if (!optimisticSnapshot.current) return;
    setData(optimisticSnapshot.current.data);
    setSelected(optimisticSnapshot.current.selected);
    optimisticSnapshot.current = null;
  }, []);

  const onActionSuccess = useCallback(
    async () => {
      optimisticSnapshot.current = null;
      await onActionComplete();
    },
    [onActionComplete],
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <GitBranch className="h-4 w-4" />
            Workflow execution & approvals
          </p>
          <h1 className="text-2xl font-bold tracking-tight">Operations center</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={refresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <DashboardReportActions />
        </div>
      </header>

      <OperationsWidgets
        stats={data.stats}
        financeSummary={data.financeSummary}
        intelligence={data.intelligence}
        auditAlerts={data.auditAlerts}
        notifications={data.notifications}
      />

      <div className="grid gap-6 xl:grid-cols-12">
        <section className="space-y-4 xl:col-span-7">
          <ApprovalQueueTabs active={tab} counts={counts} onChange={setTab} />
          <div className="space-y-3">
            {queueItems.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                No {tab} approvals in this queue.
              </p>
            ) : (
              queueItems.map((item) => (
                <WorkflowCard
                  key={item.approvalId ?? item.id}
                  item={item}
                  selected={matchesWorkflowItem(selected, item)}
                  onSelect={setSelected}
                />
              ))
            )}
          </div>

          <div>
            <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
              Recent workflow executions
            </h2>
            <div className="space-y-3">
              {data.executions.slice(0, 5).map((ex) => (
                <WorkflowCard
                  key={ex.id}
                  item={ex}
                  selected={matchesWorkflowItem(selected, ex)}
                  onSelect={setSelected}
                />
              ))}
            </div>
          </div>
        </section>

        <aside className="space-y-4 xl:col-span-5">
          <ApprovalActions
            item={selected}
            onActionStart={onActionStart}
            onActionSuccess={onActionSuccess}
            onActionError={onActionError}
          />
          <AiWorkflowPanel intelligence={data.intelligence} />
        </aside>
      </div>
    </div>
  );
}

function applyOptimisticAction(
  data: OperationsDashboardData,
  item: WorkflowCardData,
  status: WorkflowCardData["status"],
  executionStatus: WorkflowCardData["status"] | null,
  event: WorkflowTimelineEvent,
  action: ApprovalActionType,
): OperationsDashboardData {
  const destination = destinationTab(action);
  const updatedItem = updateWorkflowItem(
    item,
    status,
    executionStatus,
    event,
    action,
    "approval",
  );
  const nextApprovals = {
    pending: data.approvals.pending.filter((approval) => !matchesWorkflowItem(approval, item)),
    rejected: data.approvals.rejected.filter((approval) => !matchesWorkflowItem(approval, item)),
    completed: data.approvals.completed.filter((approval) => !matchesWorkflowItem(approval, item)),
  };

  if (destination) {
    nextApprovals[destination] = [updatedItem, ...nextApprovals[destination]];
  } else {
    nextApprovals.pending = [updatedItem, ...nextApprovals.pending];
  }

  return {
    ...data,
    approvals: nextApprovals,
    executions: data.executions.map((execution) =>
      matchesWorkflowItem(execution, item)
        ? updateWorkflowItem(execution, status, executionStatus, event, action, "execution")
        : execution,
    ),
  };
}

function updateWorkflowItem(
  item: WorkflowCardData,
  status: WorkflowCardData["status"],
  executionStatus: WorkflowCardData["status"] | null,
  event: WorkflowTimelineEvent,
  action: ApprovalActionType,
  mode: "approval" | "execution",
): WorkflowCardData {
  const nextStatus = mode === "execution" ? executionStatus ?? item.status : status;
  const now = new Date().toISOString();

  return {
    ...item,
    status: nextStatus,
    statusLabel: formatStatus(nextStatus),
    assignee:
      mode === "approval" && action === "escalate"
        ? {
            id: null,
            name: "Escalated approver",
            email: null,
            initials: "EA",
          }
        : item.assignee,
    updatedAt: now,
    metadata: {
      ...(item.metadata ?? {}),
      lastAction: action,
      lastActionAt: now,
      optimistic: true,
    },
    timeline: [event, ...(item.timeline ?? [])],
  };
}

function isExecutionItem(item: WorkflowCardData): boolean {
  return ["RUNNING", "WAITING_APPROVAL", "COMPLETED", "FAILED", "CANCELLED", "TIMED_OUT"].includes(
    item.status,
  );
}

function matchesWorkflowItem(
  current: WorkflowCardData | null,
  target: WorkflowCardData,
): boolean {
  if (!current) return false;
  if (current.approvalId && target.approvalId) {
    return current.approvalId === target.approvalId;
  }
  return current.id === target.id;
}

function optimisticApprovalStatus(action: ApprovalActionType): WorkflowCardData["status"] {
  switch (action) {
    case "approve":
      return "APPROVED";
    case "reject":
      return "REJECTED";
    case "escalate":
      return "PENDING";
    case "request_clarification":
      return "PENDING";
  }
}

function optimisticWorkflowStatus(
  action: ApprovalActionType,
): WorkflowCardData["status"] | null {
  switch (action) {
    case "approve":
      return "RUNNING";
    case "reject":
      return "FAILED";
    case "escalate":
    case "request_clarification":
      return "WAITING_APPROVAL";
  }
}

function destinationTab(action: ApprovalActionType): ApprovalTab | null {
  switch (action) {
    case "approve":
      return "completed";
    case "reject":
      return "rejected";
    case "escalate":
    case "request_clarification":
      return null;
  }
}

function createOptimisticTimelineEvent(
  action: ApprovalActionType,
  comment: string,
): WorkflowTimelineEvent {
  const now = new Date().toISOString();

  return {
    id: `optimistic-${action}-${Date.now()}`,
    activityType: optimisticActivityType(action),
    label: optimisticActionLabel(action),
    description: comment || optimisticActionDescription(action),
    actorId: null,
    actorName: "You",
    createdAt: now,
    metadata: { action, comment: comment || null },
    optimistic: true,
  };
}

function optimisticActivityType(action: ApprovalActionType): string {
  if (action === "approve") return "APPROVE";
  if (action === "reject") return "REJECT";
  return "OTHER";
}

function optimisticActionLabel(action: ApprovalActionType): string {
  switch (action) {
    case "approve":
      return "Approved";
    case "reject":
      return "Rejected";
    case "escalate":
      return "Escalated";
    case "request_clarification":
      return "Clarification requested";
  }
}

function optimisticActionDescription(action: ApprovalActionType): string {
  switch (action) {
    case "approve":
      return "Approval is being saved.";
    case "reject":
      return "Rejection is being saved.";
    case "escalate":
      return "Escalation is being saved.";
    case "request_clarification":
      return "Clarification request is being saved.";
  }
}

function formatStatus(status: string): string {
  return status
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
