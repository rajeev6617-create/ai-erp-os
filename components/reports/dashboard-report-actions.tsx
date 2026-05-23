"use client";

import { useState } from "react";
import { BellRing, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/providers/toast-provider";
import {
  apiFetch,
  downloadAuthenticatedFile,
  getApiErrorMessage,
} from "@/lib/api/client";
import type { ReminderResult } from "@/lib/notifications/reminders";

export function DashboardReportActions() {
  const [loading, setLoading] = useState<"workflow" | "finance" | "reminder" | null>(null);
  const { showToast } = useToast();

  async function downloadReport(kind: "workflow" | "finance") {
    setLoading(kind);
    const path =
      kind === "workflow"
        ? "/api/reports/workflows/excel"
        : "/api/reports/finance/excel";

    try {
      const result = await downloadAuthenticatedFile(path);
      if (!result.success || !result.data) {
        showToast({
          variant: "error",
          message: getApiErrorMessage(result, "Unable to export report."),
        });
        return;
      }

      const url = URL.createObjectURL(result.data.blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = result.data.fileName || fallbackFileName(kind);
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      showToast({
        variant: "success",
        message:
          kind === "workflow"
            ? "Workflow MIS export started."
            : "Finance MIS export started.",
      });
    } catch {
      showToast({ variant: "error", message: "Unable to export report." });
    } finally {
      setLoading(null);
    }
  }

  async function sendReminder() {
    setLoading("reminder");
    const res = await apiFetch<ReminderResult>("/api/automation/send-reminder", {
      method: "POST",
      body: JSON.stringify({}),
    });
    setLoading(null);

    if (!res.success || !res.data) {
      showToast({
        variant: "error",
        message: getApiErrorMessage(res, "Unable to send reminder."),
      });
      return;
    }

    showToast({
      variant: "success",
      message: `Reminder queued for ${res.data.approvalsMatched} approval(s).`,
    });
  }

  return (
    <div className="flex flex-col gap-2 sm:items-end">
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          onClick={() => downloadReport("workflow")}
          disabled={loading !== null}
        >
          {loading === "workflow" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          Export Workflow MIS
        </Button>
        <Button
          variant="outline"
          onClick={() => downloadReport("finance")}
          disabled={loading !== null}
        >
          {loading === "finance" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          Export Finance MIS
        </Button>
        <Button onClick={sendReminder} disabled={loading !== null}>
          {loading === "reminder" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <BellRing className="h-4 w-4" />
          )}
          Send Reminder
        </Button>
      </div>
    </div>
  );
}

function fallbackFileName(kind: "workflow" | "finance"): string {
  return `ai-erp-${kind}-mis.xls`;
}
