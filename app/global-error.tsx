"use client";

import { useEffect } from "react";
import { RotateCcw, TriangleAlert } from "lucide-react";

export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error("[global-error]", error);
  }, [error]);

  const showMessage = process.env.NODE_ENV !== "production";

  return (
    <html lang="en" className="h-full">
      <body className="min-h-full bg-background text-foreground">
        <main className="flex min-h-screen items-center justify-center p-6">
          <div className="w-full max-w-lg rounded-lg border border-border bg-card p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-danger/10 text-danger">
                <TriangleAlert className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg font-semibold">AI ERP OS could not recover</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  A global runtime error interrupted the app shell. Retry the request, or share the digest with support.
                </p>
                {showMessage ? (
                  <p className="mt-3 rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
                    {error.message}
                  </p>
                ) : null}
                {error.digest ? (
                  <p className="mt-3 rounded-lg bg-muted px-3 py-2 font-mono text-xs text-muted-foreground">
                    Digest {error.digest}
                  </p>
                ) : null}
                <button
                  type="button"
                  onClick={() => unstable_retry()}
                  className="mt-4 inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <RotateCcw className="h-4 w-4" />
                  Try again
                </button>
              </div>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
