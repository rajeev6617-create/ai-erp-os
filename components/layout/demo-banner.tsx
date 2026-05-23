import { Badge } from "@/components/ui/badge";
import type { DemoModeInfo } from "@/lib/demo/mode";

export function DemoBanner({ demo }: { demo: DemoModeInfo }) {
  if (!demo.enabled && !demo.sandbox) return null;

  return (
    <div className="border-b border-warning/30 bg-warning/10 px-4 py-2 text-xs text-warning">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="warning">{demo.sandbox ? "Sandbox" : "Demo"}</Badge>
          <span className="font-medium">{demo.tenantLabel}</span>
        </div>
        <span className="text-muted-foreground">
          Environment: {demo.environmentLabel}. External actions use placeholder or demo-safe services.
        </span>
      </div>
    </div>
  );
}
