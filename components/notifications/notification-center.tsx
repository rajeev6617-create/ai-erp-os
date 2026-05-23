"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Bell, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/providers/toast-provider";
import { apiFetch, getApiErrorMessage } from "@/lib/api/client";
import { cn } from "@/lib/utils/cn";
import type { NotificationCenterData } from "@/lib/notifications/queries";

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();
  const [data, setData] = useState<NotificationCenterData>({
    unreadCount: 0,
    items: [],
  });

  const load = useCallback(async () => {
    setLoading(true);
    const res = await apiFetch<NotificationCenterData>("/api/notifications?take=20");
    setLoading(false);
    if (res.success && res.data) {
      setData(res.data);
      return;
    }
    showToast({
      variant: "error",
      message: getApiErrorMessage(res, "Unable to load notifications."),
    });
  }, [showToast]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function markAllRead() {
    const res = await apiFetch<{ updated: number }>("/api/notifications", {
      method: "PATCH",
      body: JSON.stringify({}),
    });
    if (res.success) {
      await load();
      showToast({ variant: "success", message: "Notifications marked read." });
      return;
    }
    showToast({
      variant: "error",
      message: getApiErrorMessage(res, "Unable to mark notifications read."),
    });
  }

  function toggleOpen() {
    const nextOpen = !open;
    setOpen(nextOpen);
    if (nextOpen) {
      void load();
    }
  }

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleOpen}
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {data.unreadCount > 0 && (
          <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
            {data.unreadCount > 9 ? "9+" : data.unreadCount}
          </span>
        )}
      </Button>
      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
            aria-label="Close notifications"
          />
          <div className="absolute right-0 z-50 mt-2 w-80 rounded-xl border border-border bg-card shadow-lg">
            <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
              <div>
                <p className="text-sm font-semibold">Notifications</p>
                <p className="text-xs text-muted-foreground">
                  {data.unreadCount} unread
                </p>
              </div>
              <button
                type="button"
                onClick={markAllRead}
                className="text-xs font-medium text-primary hover:underline"
              >
                Mark read
              </button>
            </div>
            <div className="max-h-80 overflow-y-auto p-2">
              {loading ? (
                <div className="flex items-center gap-2 px-3 py-8 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading notifications
                </div>
              ) : data.items.length === 0 ? (
                <p className="px-3 py-8 text-sm text-muted-foreground">
                  No notifications yet.
                </p>
              ) : (
                <ul className="space-y-1">
                  {data.items.map((notification) => {
                    const unread = !notification.readAt;
                    const content = (
                      <li
                        className={cn(
                          "rounded-lg px-3 py-2.5 text-sm",
                          unread && "bg-accent/50",
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-medium">{notification.title}</p>
                          {unread && (
                            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                          )}
                        </div>
                        {notification.body && (
                          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                            {notification.body}
                          </p>
                        )}
                        <p className="mt-1 text-[10px] text-muted-foreground">
                          {notification.channel} | {formatRelative(notification.createdAt)}
                        </p>
                      </li>
                    );

                    return notification.actionUrl ? (
                      <Link
                        key={notification.id}
                        href={notification.actionUrl}
                        onClick={() => setOpen(false)}
                      >
                        {content}
                      </Link>
                    ) : (
                      <div key={notification.id}>{content}</div>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
