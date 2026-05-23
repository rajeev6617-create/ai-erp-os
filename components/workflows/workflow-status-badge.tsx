import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";

const statusStyles: Record<string, "default" | "success" | "warning" | "danger" | "info"> = {
  PENDING: "warning",
  RUNNING: "info",
  WAITING_APPROVAL: "warning",
  APPROVED: "success",
  REJECTED: "danger",
  ESCALATED: "info",
  COMPLETED: "success",
  FAILED: "danger",
  CANCELLED: "default",
  PAUSED: "default",
};

export function WorkflowStatusBadge({
  status,
  label,
}: {
  status: string;
  label: string;
}) {
  const variant = statusStyles[status] ?? "default";
  return (
    <Badge variant={variant} className={cn("shrink-0")}>
      {label}
    </Badge>
  );
}
