"use client";

import { useEffect, useState } from "react";
import { BellRing, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiFetch, getAccessToken } from "@/lib/api/client";
import type { ReminderResult } from "@/lib/notifications/reminders";

type ToastState = {
  type: "success" | "error";
  message: string;
} | null;

export function DashboardReportActions() {
  const [loading, setLoading] = useState<"workflow" | "finance" | "reminder" | null>(null);
  const [toast, setToast] = useState<ToastState>(null);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  async function downloadReport(kind: "workflow" | "finance") {
    setLoading(kind);
    setToast(null);
    const path =
      kind === "workflow"
        ? "/api/reports/workflows/excel"
        : "/api/reports/finance/excel";

    try {
      const headers = new Headers();
      const token = getAccessToken();
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      const response = await fetch(path, {
        credentials: "include",
        headers,
      });

      if (!response.ok) {
        throw new Error(`Report request failed with ${response.status}`);
      }

      const blob = await response.blob();
      const fileName = fileNameFromDisposition(response.headers.get("Content-Disposition")) ??
        fallbackFileName(kind);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = fileName;
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      setToast({
        type: "success",
        message:
          kind === "workflow"
            ? "Workflow MIS export started."
            : "Finance MIS export started.",
      });
    } catch {
      setToast({ type: "error", message: "Unable to export report." });
    } finally {
      setLoading(null);
    }
  }

  async function sendReminder() {
    setLoading("reminder");
    setToast(null);
    const res = await apiFetch<ReminderResult>("/api/automation/send-reminder", {
      method: "POST",
      body: JSON.stringify({}),
    });
    setLoading(null);

    if (!res.success || !res.data) {
      setToast({
        type: "error",
        message: res.error?.message ?? "Unable to send reminder.",
      });
      return;
    }

    setToast({
      type: "success",
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
      <ActionToast toast={toast} />
    </div>
  );
}

function fileNameFromDisposition(value: string | null): string | null {
  if (!value) return null;
  const match = /filename="([^"]+)"/.exec(value);
  return match?.[1] ?? null;
}

function fallbackFileName(kind: "workflow" | "finance"): string {
  return `ai-erp-${kind}-mis.xls`;
}

function ActionToast({ toast }: { toast: ToastState }) {
  if (!toast) return null;

  return (
    <div
      role={toast.type === "error" ? "alert" : "status"}
      className={`fixed bottom-4 right-4 z-50 max-w-sm rounded-lg border px-4 py-3 text-sm font-medium shadow-lg ${
        toast.type === "success"
          ? "border-success/30 bg-success/10 text-success"
          : "border-danger/30 bg-danger/10 text-danger"
      }`}
    >
      {toast.message}
    </div>
  );
}
