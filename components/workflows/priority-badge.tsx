import { Badge } from "@/components/ui/badge";

const map = {
  low: "default" as const,
  medium: "info" as const,
  high: "warning" as const,
  critical: "danger" as const,
};

export function PriorityBadge({ priority }: { priority: keyof typeof map }) {
  return (
    <Badge variant={map[priority]} className="capitalize">
      {priority}
    </Badge>
  );
}
