"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error("[dashboard-error]", error);
  }, [error]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-danger" />
          Dashboard data could not be loaded
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="max-w-2xl text-sm text-muted-foreground">
          This dashboard segment failed while loading data or rendering a widget. Retry will re-fetch the current route.
        </p>
        {error.digest ? (
          <p className="rounded-lg bg-muted px-3 py-2 font-mono text-xs text-muted-foreground">
            Digest {error.digest}
          </p>
        ) : null}
        <Button onClick={() => unstable_retry()}>
          <RotateCcw className="h-4 w-4" />
          Retry dashboard
        </Button>
      </CardContent>
    </Card>
  );
}
