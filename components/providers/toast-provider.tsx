"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { CheckCircle2, Info, TriangleAlert, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type ToastVariant = "success" | "error" | "info";

export interface ToastInput {
  title?: string;
  message: string;
  variant?: ToastVariant;
  durationMs?: number;
}

interface ToastRecord extends Required<Omit<ToastInput, "title">> {
  id: string;
  title?: string;
}

interface ToastContextValue {
  showToast: (toast: ToastInput) => string;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const variantConfig = {
  success: {
    icon: CheckCircle2,
    className: "border-success/30 bg-card text-success",
  },
  error: {
    icon: TriangleAlert,
    className: "border-danger/30 bg-card text-danger",
  },
  info: {
    icon: Info,
    className: "border-primary/30 bg-card text-foreground",
  },
} satisfies Record<ToastVariant, { icon: typeof CheckCircle2; className: string }>;

export function ToastProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (toast: ToastInput) => {
      const id = crypto.randomUUID();
      const durationMs = toast.durationMs ?? 4000;
      setToasts((current) => [
        ...current,
        {
          id,
          title: toast.title,
          message: toast.message,
          variant: toast.variant ?? "info",
          durationMs,
        },
      ]);

      window.setTimeout(() => dismissToast(id), durationMs);
      return id;
    },
    [dismissToast],
  );

  const value = useMemo(
    () => ({ showToast, dismissToast }),
    [showToast, dismissToast],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-relevant="additions"
        className="fixed bottom-4 right-4 z-[100] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-2 sm:w-full"
      >
        {toasts.map((toast) => {
          const config = variantConfig[toast.variant];
          const Icon = config.icon;
          return (
            <div
              key={toast.id}
              role={toast.variant === "error" ? "alert" : "status"}
              className={cn(
                "flex items-start gap-3 rounded-lg border px-4 py-3 text-sm shadow-lg",
                config.className,
              )}
            >
              <Icon className="mt-0.5 h-4 w-4 shrink-0" />
              <div className="min-w-0 flex-1">
                {toast.title ? (
                  <p className="font-semibold text-foreground">{toast.title}</p>
                ) : null}
                <p className={cn("leading-5", toast.title && "mt-0.5")}>
                  {toast.message}
                </p>
              </div>
              <button
                type="button"
                aria-label="Dismiss notification"
                onClick={() => dismissToast(toast.id)}
                className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}
