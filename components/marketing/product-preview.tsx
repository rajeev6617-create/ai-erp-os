import { Badge } from "@/components/ui/badge";

const rows = [
  ["Vendor payment", "CFO approval", "High", "₹12.5L"],
  ["GST invoice", "Finance review", "Medium", "₹6.8L"],
  ["Expense claim", "Manager queue", "Low", "₹48K"],
] as const;

export function ProductPreview({ compact = false }: { compact?: boolean }) {
  return (
    <div className="rounded-lg border border-border bg-card/95 p-3 shadow-xl shadow-slate-900/10 dark:shadow-black/30">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div>
          <p className="text-xs text-muted-foreground">ASTRA</p>
          <p className="text-sm font-semibold">Finance command center</p>
        </div>
        <Badge variant="success">Live demo</Badge>
      </div>
      <div className="grid gap-3 py-3 sm:grid-cols-3">
        {[
          ["Pending approvals", "18"],
          ["SLA risk", "4"],
          ["GST liability", "₹5.72L"],
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg border border-border bg-background p-3">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-1 text-xl font-semibold">{value}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-lg border border-border bg-background">
          <div className="border-b border-border px-3 py-2 text-xs font-medium">
            AI approval queue
          </div>
          <div className="divide-y divide-border">
            {rows.map(([name, owner, severity, amount]) => (
              <div key={name} className="grid grid-cols-[1fr_auto] gap-3 px-3 py-3 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium">{name}</p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">{owner}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{amount}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{severity} risk</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-lg border border-border bg-background p-3">
          <p className="text-xs font-medium">Automation status</p>
          <div className="mt-3 space-y-3">
            {[
              ["Email reminders", 86],
              ["WhatsApp queue", 64],
              ["Audit coverage", 98],
            ].map(([label, progress]) => (
              <div key={label}>
                <div className="mb-1 flex justify-between text-xs">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-medium">{progress}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          {!compact ? (
            <div className="mt-4 rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
              AI recommends escalating two high-value payments before SLA breach.
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
