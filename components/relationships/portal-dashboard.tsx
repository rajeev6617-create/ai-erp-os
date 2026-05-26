import { BrainCircuit, ClipboardCheck, LogOut, TicketCheck, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import type { CustomerPortalData, VendorPortalData } from "@/lib/relationships/types";

export function CustomerPortalDashboard({ data }: { data: CustomerPortalData }) {
  return (
    <PortalFrame title="Customer portal" subtitle={data.customer.name}>
      <section className="grid gap-4 md:grid-cols-3">
        <PortalMetric label="Outstanding" value={formatInr(data.customer.outstandingAmount)} />
        <PortalMetric label="Credit limit" value={data.customer.creditLimit == null ? "Not set" : formatInr(data.customer.creditLimit)} />
        <PortalMetric label="Open tickets" value={String(data.tickets.filter((ticket) => !["RESOLVED", "CLOSED"].includes(ticket.status)).length)} />
      </section>
      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <PortalCard title="Sales pipeline" description="Active opportunities and commercial milestones" icon={TrendingUp}>
          {data.opportunities.length === 0 ? (
            <EmptyState title="No active opportunities" description="Commercial updates will appear here." />
          ) : (
            data.opportunities.map((item) => (
              <PortalRow key={item.id} title={item.name} detail={`${item.opportunityNumber} | ${formatStatus(item.stage)}`} badge={formatInr(item.amount)} />
            ))
          )}
        </PortalCard>
        <AiPortalCard insights={data.insights} />
      </section>
      <PortalTickets tickets={data.tickets} />
    </PortalFrame>
  );
}

export function VendorPortalDashboard({ data }: { data: VendorPortalData }) {
  return (
    <PortalFrame title="Vendor portal" subtitle={data.vendor.name}>
      <section className="grid gap-4 md:grid-cols-3">
        <PortalMetric label="Vendor status" value={formatStatus(data.vendor.status)} />
        <PortalMetric label="Payment terms" value={`${data.vendor.paymentTermsDays} days`} />
        <PortalMetric label="Open tickets" value={String(data.tickets.filter((ticket) => !["RESOLVED", "CLOSED"].includes(ticket.status)).length)} />
      </section>
      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <PortalCard title="Vendor onboarding" description="Qualification status and open evidence steps" icon={ClipboardCheck}>
          {data.onboardings.length === 0 ? (
            <EmptyState title="No onboarding records" description="Supplier onboarding activity will appear here." />
          ) : (
            data.onboardings.map((item) => (
              <PortalRow key={item.id} title={item.supplierName} detail={`${item.onboardingNumber} | ${item.currentStep}`} badge={formatStatus(item.status)} />
            ))
          )}
        </PortalCard>
        <AiPortalCard insights={data.insights} />
      </section>
      <PortalTickets tickets={data.tickets} />
    </PortalFrame>
  );
}

function PortalFrame({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-col gap-4 rounded-lg border border-border bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">ASTRA secure portal</p>
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          </div>
          <form action="/api/portal/auth/logout" method="post">
            <button className="inline-flex h-9 items-center gap-2 rounded-lg border border-border px-3 text-sm font-medium hover:bg-muted" type="submit">
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </form>
        </header>
        {children}
      </div>
    </main>
  );
}

function PortalMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
    </div>
  );
}

function PortalCard({
  title,
  description,
  icon: Icon,
  children,
}: {
  title: string;
  description: string;
  icon: typeof TicketCheck;
  children: React.ReactNode;
}) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-primary" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">{children}</CardContent>
    </Card>
  );
}

function PortalRow({ title, detail, badge }: { title: string; detail: string; badge: string }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border border-border p-3">
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
      </div>
      <Badge variant="info">{badge}</Badge>
    </div>
  );
}

function AiPortalCard({ insights }: { insights: CustomerPortalData["insights"] }) {
  return (
    <PortalCard title="AI insights" description="Risk, service, and next-action guidance" icon={BrainCircuit}>
      {insights.length === 0 ? (
        <EmptyState title="No AI insights" description="Portal-specific signals will appear here." />
      ) : (
        insights.map((insight) => (
          <div key={insight.id} className="rounded-lg border border-border p-3">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-semibold">{insight.title}</p>
              <Badge variant={insight.severity === "HIGH" || insight.severity === "CRITICAL" ? "danger" : "warning"}>
                {insight.severity.toLowerCase()}
              </Badge>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{insight.description}</p>
          </div>
        ))
      )}
    </PortalCard>
  );
}

function PortalTickets({ tickets }: { tickets: CustomerPortalData["tickets"] }) {
  return (
    <PortalCard title="Support tickets" description="Ticketing foundation for portal collaboration" icon={TicketCheck}>
      {tickets.length === 0 ? (
        <EmptyState title="No support tickets" description="Raised tickets will appear here." />
      ) : (
        tickets.map((ticket) => (
          <PortalRow
            key={ticket.id}
            title={ticket.subject}
            detail={`${ticket.ticketNumber} | ${formatStatus(ticket.status)}`}
            badge={formatStatus(ticket.priority)}
          />
        ))
      )}
    </PortalCard>
  );
}

function formatStatus(value: string): string {
  return value
    .toLowerCase()
    .replaceAll("_", " ")
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatInr(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
    notation: Math.abs(amount) >= 1000000 ? "compact" : "standard",
  }).format(amount);
}
