"use client";

import { useEffect, useState } from "react";
import {
  ArrowUpCircle,
  CheckCircle2,
  Clock3,
  HelpCircle,
  Loader2,
  MessageSquareText,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/providers/toast-provider";
import { apiFetch, getApiErrorMessage } from "@/lib/api/client";
import type {
  ApprovalActionResult,
  ApprovalActionType,
  ApprovalAuditHistory,
  WorkflowCardData,
  WorkflowTimelineEvent,
} from "@/lib/workflows/types";

type AuditErrorState = {
  approvalId: string;
  message: string;
} | null;

interface ApprovalActionsProps {
  item: WorkflowCardData | null;
  onActionStart?: (
    item: WorkflowCardData,
    action: ApprovalActionType,
    comment: string,
  ) => void;
  onActionSuccess?: (result: ApprovalActionResult) => void | Promise<void>;
  onActionError?: () => void;
}

export function ApprovalActions({
  item,
  onActionStart,
  onActionSuccess,
  onActionError,
}: ApprovalActionsProps) {
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState<ApprovalActionType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [auditHistory, setAuditHistory] = useState<ApprovalAuditHistory | null>(null);
  const [auditError, setAuditError] = useState<AuditErrorState>(null);
  const { showToast } = useToast();

  useEffect(() => {
    let cancelled = false;
    const approvalId = item?.approvalId;
    if (!approvalId) return;

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 10000);

    apiFetch<ApprovalAuditHistory>(`/api/approvals/${approvalId}/audit`, {
      signal: controller.signal,
    })
      .then((res) => {
        if (cancelled) return;
        if (res.success && res.data) {
          setAuditError(null);
          setAuditHistory(res.data);
          return;
        }

        setAuditError({
          approvalId,
          message: res.error?.message ?? "Unable to load audit history.",
        });
        setAuditHistory(createEmptyAuditHistory(approvalId, String(item.status)));
      })
      .catch(() => {
        if (!cancelled) {
          setAuditError({
            approvalId,
            message: "Unable to load audit history.",
          });
          setAuditHistory(createEmptyAuditHistory(approvalId, String(item.status)));
        }
      })
      .finally(() => {
        window.clearTimeout(timeout);
      });

    return () => {
      cancelled = true;
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [item?.approvalId, item?.status]);

  if (!item?.approvalId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Approval actions</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Select a pending approval to approve, reject, escalate, or request clarification.
          </p>
        </CardContent>
      </Card>
    );
  }

  const isPending = item.status === "PENDING";
  const selectedAuditHistory =
    auditHistory?.approvalId === item.approvalId ? auditHistory : null;
  const selectedAuditError =
    auditError?.approvalId === item.approvalId ? auditError.message : null;
  const auditLoading = !selectedAuditHistory && !selectedAuditError;
  const timeline = selectedAuditHistory?.timeline.length
    ? selectedAuditHistory.timeline
    : item.timeline ?? [];

  async function runAction(action: ApprovalActionType) {
    const trimmedComment = comment.trim();
    setLoading(action);
    setError(null);
    onActionStart?.(item!, action, trimmedComment);

    try {
      const res = await apiFetch<ApprovalActionResult>(
        `/api/approvals/${item!.approvalId}/actions`,
        {
          method: "POST",
          body: JSON.stringify({
            action,
            comment: trimmedComment || undefined,
          }),
        },
      );

      if (!res.success || !res.data) {
        onActionError?.();
        const message = getApiErrorMessage(res, "Action failed");
        setError(message);
        showToast({ variant: "error", message });
        return;
      }

      setComment("");
      showToast({ variant: "success", message: res.data.message });
      const result = res.data;
      if (result.timelineEvent) {
        setAuditHistory((current) =>
          current
            ? {
                ...current,
                workflowState: result.status,
                timeline: prependTimelineEvent(current.timeline, result.timelineEvent!),
              }
            : current,
        );
      }
      await onActionSuccess?.(result);
    } catch {
      onActionError?.();
      const message = "Action failed. Please try again.";
      setError(message);
      showToast({ variant: "error", message });
    } finally {
      setLoading(null);
    }
  }

  return (
    <Card>
        <CardHeader>
          <CardTitle className="text-base">Approval actions</CardTitle>
          <p className="line-clamp-1 text-xs text-muted-foreground">{item.title}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add a comment (optional)..."
              rows={3}
              className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
              disabled={!isPending}
            />
            {error && <p className="text-xs text-danger">{error}</p>}
            <div className="grid grid-cols-2 gap-2">
              <Button
                disabled={!isPending || loading !== null}
                onClick={() => runAction("approve")}
                className="col-span-1"
              >
                {loading === "approve" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                Approve
              </Button>
              <Button
                variant="danger"
                disabled={!isPending || loading !== null}
                onClick={() => runAction("reject")}
              >
                {loading === "reject" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                Reject
              </Button>
              <Button
                variant="outline"
                disabled={!isPending || loading !== null}
                onClick={() => runAction("escalate")}
              >
                {loading === "escalate" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ArrowUpCircle className="h-4 w-4" />
                )}
                Escalate
              </Button>
              <Button
                variant="secondary"
                disabled={!isPending || loading !== null}
                onClick={() => runAction("request_clarification")}
              >
                {loading === "request_clarification" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <HelpCircle className="h-4 w-4" />
                )}
                Clarify
              </Button>
            </div>
          </div>

          <div className="border-t border-border pt-4">
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground">
              <Clock3 className="h-3.5 w-3.5" />
              Workflow timeline
            </div>
            {auditLoading ? (
              <p className="text-xs text-muted-foreground">Loading audit history...</p>
            ) : selectedAuditError ? (
              <p className="text-xs text-danger">{selectedAuditError}</p>
            ) : timeline.length ? (
              <div className="space-y-3">
                {timeline.slice(0, 5).map((event) => (
                  <div key={event.id} className="flex gap-3 text-xs">
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                    <div className="min-w-0 space-y-0.5">
                      <p className="font-medium text-foreground">
                        {event.label}
                        {event.optimistic ? " (saving...)" : ""}
                      </p>
                      <p className="line-clamp-2 text-muted-foreground">
                        {event.description ?? `${event.actorName} updated this workflow.`}
                      </p>
                      <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <MessageSquareText className="h-3 w-3" />
                        {event.actorName} | {formatTimestamp(event.createdAt)}
                      </p>
                      {(event.workflowState || event.comment || event.ipAddress || event.device) && (
                        <p className="text-[11px] text-muted-foreground">
                          {[
                            event.workflowState ? `State: ${event.workflowState}` : null,
                            event.comment ? `Comment: ${event.comment}` : null,
                            event.ipAddress ? `IP: ${event.ipAddress}` : null,
                            event.device,
                          ]
                            .filter(Boolean)
                            .join(" | ")}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No workflow activity yet.</p>
            )}
          </div>

          {selectedAuditHistory && (
            <div className="border-t border-border pt-4">
              <div className="mb-3 text-xs font-semibold uppercase text-muted-foreground">
                Audit history
              </div>
              {selectedAuditHistory.auditTrail.length ? (
                <div className="space-y-2">
                  {selectedAuditHistory.auditTrail.slice(0, 4).map((entry) => (
                    <div key={entry.id} className="rounded-md bg-muted px-3 py-2 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-foreground">{entry.action}</span>
                        <span className="text-[11px] text-muted-foreground">
                          {formatTimestamp(entry.createdAt)}
                        </span>
                      </div>
                      <p className="mt-1 text-muted-foreground">
                        {entry.userName}
                        {entry.workflowState ? ` | ${entry.workflowState}` : ""}
                        {entry.comment ? ` | ${entry.comment}` : ""}
                      </p>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {[entry.ipAddress ? `IP: ${entry.ipAddress}` : null, entry.device]
                          .filter(Boolean)
                          .join(" | ") || "No device metadata captured"}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">No audit entries yet.</p>
              )}
            </div>
          )}

          {selectedAuditHistory?.aiRecommendations.length ? (
            <div className="border-t border-border pt-4">
              <div className="mb-3 text-xs font-semibold uppercase text-muted-foreground">
                AI recommendations
              </div>
              <div className="space-y-2">
                {selectedAuditHistory.aiRecommendations.map((item) => (
                  <div key={item.id} className="rounded-md border border-dashed border-border px-3 py-2">
                    <p className="text-xs font-medium text-foreground">{item.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </CardContent>
    </Card>
  );
}

function createEmptyAuditHistory(approvalId: string, workflowState: string): ApprovalAuditHistory {
  return {
    approvalId,
    workflowState,
    generatedAt: new Date().toISOString(),
    timeline: [],
    auditTrail: [],
    notifications: [],
    aiRecommendations: [],
  };
}

function prependTimelineEvent(
  timeline: WorkflowTimelineEvent[],
  event: WorkflowTimelineEvent,
): WorkflowTimelineEvent[] {
  return [event, ...timeline.filter((current) => current.id !== event.id)].slice(0, 20);
}

function formatTimestamp(iso: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}
