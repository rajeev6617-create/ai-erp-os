import {
  BrainCircuit,
  Building2,
  ClipboardCheck,
  FileClock,
  Handshake,
  ShieldCheck,
  Store,
  TicketCheck,
  TrendingUp,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatCard } from "@/components/ui/stat-card";
import type {
  CrmDashboardData,
  SrmDashboardData,
  SupportTicketView,
} from "@/lib/relationships/types";

export function CrmDashboard({ data }: { data: CrmDashboardData }) {
  return (
    <div className="space-y-6">
      <RelationshipHeader
        eyebrow="Customer operations"
        title="CRM command center"
        description="Lead management, sales pipeline, customer portal activity, support tickets, AI insights, and audit traceability."
      />
      <StatsGrid data={data.stats} icons={[Users, TrendingUp, Handshake, TicketCheck]} />
      <section className="grid gap-4 xl:grid-cols-12">
        <div className="xl:col-span-7">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Sales pipeline</CardTitle>
              <CardDescription>Customer opportunities with weighted revenue context</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.opportunities.length === 0 ? (
                <EmptyState icon={TrendingUp} title="No opportunities" description="Qualified pipeline will appear here." />
              ) : (
                data.opportunities.map((item) => (
                  <div key={item.id} className="grid gap-3 rounded-lg border border-border p-3 md:grid-cols-[1fr_auto]">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold">{item.name}</p>
                        <Badge variant={stageVariant(item.stage)}>{formatStatus(item.stage)}</Badge>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {item.customerName} | {item.opportunityNumber}
                      </p>
                    </div>
                    <div className="text-sm md:text-right">
                      <p className="font-semibold">{formatInr(item.amount)}</p>
                      <p className="text-xs text-muted-foreground">{item.probability}% probability</p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
        <div className="space-y-4 xl:col-span-5">
          <LeadsCard data={data.leads} />
          <AiInsightsCard data={data.insights} />
        </div>
      </section>
      <section className="grid gap-4 xl:grid-cols-12">
        <div className="xl:col-span-5">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Customer portal accounts</CardTitle>
              <CardDescription>Customer records available for portal-backed collaboration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.customers.length === 0 ? (
                <EmptyState icon={Building2} title="No customer records" description="Seeded or synced customers will appear here." />
              ) : (
                data.customers.map((customer) => (
                  <div key={customer.id} className="rounded-lg border border-border p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold">{customer.name}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {customer.code} | {customer.segment ?? "Unsegmented"}
                        </p>
                      </div>
                      <Badge variant={customer.status === "ACTIVE" ? "success" : "default"}>{customer.status.toLowerCase()}</Badge>
                    </div>
                    <p className="mt-3 text-xs text-muted-foreground">
                      Outstanding {formatInr(customer.outstandingAmount)} | Credit {customer.creditLimit == null ? "not set" : formatInr(customer.creditLimit)}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
        <div className="xl:col-span-7">
          <TicketsCard title="Customer support foundation" tickets={data.tickets} />
        </div>
      </section>
      <AuditCard data={data.auditLogs} />
    </div>
  );
}

export function SrmDashboard({ data }: { data: SrmDashboardData }) {
  return (
    <div className="space-y-6">
      <RelationshipHeader
        eyebrow="Supplier operations"
        title="SRM command center"
        description="Vendor onboarding, supplier portal activity, support tickets, AI risk signals, and procurement audit traceability."
      />
      <StatsGrid data={data.stats} icons={[Store, ClipboardCheck, TicketCheck, BrainCircuit]} />
      <section className="grid gap-4 xl:grid-cols-12">
        <div className="xl:col-span-7">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Vendor onboarding</CardTitle>
              <CardDescription>Supplier qualification, document readiness, and risk review</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.onboardings.length === 0 ? (
                <EmptyState icon={ClipboardCheck} title="No onboarding records" description="Vendor onboarding workflows will appear here." />
              ) : (
                data.onboardings.map((item) => (
                  <div key={item.id} className="grid gap-3 rounded-lg border border-border p-3 md:grid-cols-[1fr_auto]">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold">{item.supplierName}</p>
                        <Badge variant={statusVariant(item.status)}>{formatStatus(item.status)}</Badge>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {item.onboardingNumber} | {item.currentStep}
                      </p>
                    </div>
                    <div className="text-sm md:text-right">
                      <p className="font-semibold">Risk {item.riskScore}</p>
                      <p className="text-xs text-muted-foreground">{item.contactName ?? "No contact"}</p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
        <div className="space-y-4 xl:col-span-5">
          <Card>
            <CardHeader>
              <CardTitle>Vendor portal accounts</CardTitle>
              <CardDescription>Supplier master records linked to SRM collaboration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.vendors.length === 0 ? (
                <EmptyState icon={Store} title="No vendors" description="Supplier records will appear here." />
              ) : (
                data.vendors.map((vendor) => (
                  <div key={vendor.id} className="rounded-lg border border-border p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold">{vendor.name}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {vendor.code} | {formatStatus(vendor.vendorType)}
                        </p>
                      </div>
                      <Badge variant={vendor.status === "ACTIVE" ? "success" : "warning"}>{formatStatus(vendor.status)}</Badge>
                    </div>
                    <p className="mt-3 text-xs text-muted-foreground">
                      Terms {vendor.paymentTermsDays} days | Risk {vendor.riskTier ?? "unrated"}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
          <AiInsightsCard data={data.insights} />
        </div>
      </section>
      <TicketsCard title="Vendor support foundation" tickets={data.tickets} />
      <AuditCard data={data.auditLogs} />
    </div>
  );
}

function RelationshipHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <header>
      <p className="text-sm text-muted-foreground">{eyebrow}</p>
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
      <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{description}</p>
    </header>
  );
}

function StatsGrid({
  data,
  icons,
}: {
  data: CrmDashboardData["stats"];
  icons: Array<typeof Users>;
}) {
  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {data.map((item, index) => (
        <StatCard
          key={item.label}
          label={item.label}
          value={item.value}
          change={item.change}
          trend={item.trend}
          icon={icons[index] ?? FileClock}
        />
      ))}
    </section>
  );
}

function LeadsCard({ data }: { data: CrmDashboardData["leads"] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Lead management</CardTitle>
        <CardDescription>AI-scored demand intake and next actions</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {data.length === 0 ? (
          <EmptyState icon={Handshake} title="No leads" description="Inbound and partner leads will appear here." />
        ) : (
          data.map((lead) => (
            <div key={lead.id} className="rounded-lg border border-border p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">{lead.companyName}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{lead.source} | {lead.leadNumber}</p>
                </div>
                <Badge variant={statusVariant(lead.status)}>{formatStatus(lead.status)}</Badge>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Score {lead.score} | {lead.nextAction ?? "No next action"}
              </p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function TicketsCard({ title, tickets }: { title: string; tickets: SupportTicketView[] }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>Portal support queue for customer and supplier collaboration</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {tickets.length === 0 ? (
          <EmptyState icon={TicketCheck} title="No support tickets" description="Portal ticketing activity will appear here." />
        ) : (
          tickets.map((ticket) => (
            <div key={ticket.id} className="rounded-lg border border-border p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">{ticket.subject}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{ticket.ticketNumber} | {formatStatus(ticket.channel)}</p>
                </div>
                <Badge variant={priorityVariant(ticket.priority)}>{formatStatus(ticket.priority)}</Badge>
              </div>
              <p className="mt-3 line-clamp-2 text-xs text-muted-foreground">{ticket.description}</p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function AiInsightsCard({ data }: { data: CrmDashboardData["insights"] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BrainCircuit className="h-4 w-4 text-primary" />
          AI insights
        </CardTitle>
        <CardDescription>Relationship risk and next-action intelligence</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {data.length === 0 ? (
          <EmptyState icon={BrainCircuit} title="No AI insights" description="AI signals will appear after relationship activity is available." />
        ) : (
          data.map((insight) => (
            <div key={insight.id} className="rounded-lg border border-border p-3">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-semibold">{insight.title}</p>
                <Badge variant={severityVariant(insight.severity)}>{insight.severity.toLowerCase()}</Badge>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{insight.description}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                {insight.module}{insight.confidence == null ? "" : ` | ${Math.round(insight.confidence)}% confidence`}
              </p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function AuditCard({ data }: { data: CrmDashboardData["auditLogs"] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" />
          Audit logs
        </CardTitle>
        <CardDescription>Relationship and portal events captured for traceability</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {data.length === 0 ? (
          <EmptyState icon={ShieldCheck} title="No audit events" description="Portal and relationship audit activity will appear here." />
        ) : (
          data.map((event) => (
            <div key={event.id} className="rounded-lg border border-border p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">{formatStatus(event.action)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{event.resource} | {formatDate(event.createdAt)}</p>
                </div>
                <Badge variant={severityVariant(event.severity)}>{event.severity.toLowerCase()}</Badge>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function formatStatus(value: string): string {
  return value
    .toLowerCase()
    .replaceAll(".", " ")
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

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

function statusVariant(status: string): "default" | "success" | "warning" | "danger" | "info" {
  if (["CONVERTED", "WON", "APPROVED", "RESOLVED", "CLOSED"].includes(status)) return "success";
  if (["QUALIFIED", "PROPOSAL", "NEGOTIATION", "UNDER_REVIEW", "IN_PROGRESS"].includes(status)) return "warning";
  if (["LOST", "REJECTED", "OPEN"].includes(status)) return "danger";
  return "info";
}

function stageVariant(stage: string): "default" | "success" | "warning" | "danger" | "info" {
  if (stage === "WON") return "success";
  if (stage === "LOST") return "danger";
  if (stage === "NEGOTIATION") return "warning";
  return "info";
}

function priorityVariant(priority: string): "default" | "success" | "warning" | "danger" | "info" {
  if (priority === "CRITICAL" || priority === "HIGH") return "danger";
  if (priority === "MEDIUM") return "warning";
  return "info";
}

function severityVariant(severity: string): "default" | "success" | "warning" | "danger" | "info" {
  if (severity === "CRITICAL" || severity === "HIGH" || severity === "ERROR") return "danger";
  if (severity === "MEDIUM" || severity === "WARNING") return "warning";
  if (severity === "INFO") return "info";
  return "success";
}
