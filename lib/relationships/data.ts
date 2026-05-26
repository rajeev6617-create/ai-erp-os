import { prisma } from "@/lib/db/prisma";
import type {
  CrmDashboardData,
  CustomerPortalData,
  CustomerView,
  RelationshipAiInsightView,
  RelationshipAuditView,
  SalesOpportunityView,
  SrmDashboardData,
  SupportTicketView,
  VendorOnboardingView,
  VendorPortalData,
  VendorView,
} from "@/lib/relationships/types";

export async function getCrmDashboard(organizationId: string): Promise<CrmDashboardData> {
  const [customers, leads, opportunities, tickets, insights, auditLogs] = await Promise.all([
    prisma.customer.findMany({
      where: { organizationId, deletedAt: null },
      orderBy: { outstandingAmount: "desc" },
      take: 12,
    }),
    prisma.crmLead.findMany({
      where: { organizationId },
      orderBy: [{ score: "desc" }, { updatedAt: "desc" }],
      take: 12,
    }),
    prisma.salesOpportunity.findMany({
      where: { organizationId },
      include: { customer: { select: { name: true } } },
      orderBy: [{ expectedCloseAt: "asc" }, { amount: "desc" }],
      take: 12,
    }),
    prisma.supportTicket.findMany({
      where: { organizationId, customerId: { not: null } },
      orderBy: [{ priority: "desc" }, { updatedAt: "desc" }],
      take: 8,
    }),
    prisma.relationshipAiInsight.findMany({
      where: { organizationId, module: { in: ["CRM", "CUSTOMER_PORTAL"] }, status: "OPEN" },
      orderBy: [{ severity: "desc" }, { createdAt: "desc" }],
      take: 8,
    }),
    prisma.auditLog.findMany({
      where: { organizationId, resource: { in: ["crm", "portal"] } },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
  ]);

  const pipeline = opportunities.reduce((sum, item) => sum + decimalToNumber(item.amount), 0);
  const weightedPipeline = opportunities.reduce(
    (sum, item) => sum + (decimalToNumber(item.amount) * item.probability) / 100,
    0,
  );

  return {
    stats: [
      {
        label: "Customers",
        value: String(customers.length),
        change: `${customers.filter((item) => item.status === "ACTIVE").length} active`,
        trend: "up",
      },
      {
        label: "Open leads",
        value: String(leads.filter((item) => !["CONVERTED", "LOST"].includes(item.status)).length),
        change: `${leads.filter((item) => item.score >= 80).length} high score`,
        trend: "neutral",
      },
      {
        label: "Pipeline",
        value: formatInr(pipeline),
        change: `${formatInr(weightedPipeline)} weighted`,
        trend: "up",
      },
      {
        label: "Support tickets",
        value: String(tickets.filter((item) => !["RESOLVED", "CLOSED"].includes(item.status)).length),
        change: `${tickets.filter((item) => item.priority === "HIGH" || item.priority === "CRITICAL").length} high priority`,
        trend: "down",
      },
    ],
    customers: customers.map(mapCustomer),
    leads: leads.map((lead) => ({
      id: lead.id,
      leadNumber: lead.leadNumber,
      companyName: lead.companyName,
      contactName: lead.contactName,
      source: lead.source,
      status: lead.status,
      score: lead.score,
      estimatedValue: decimalToNumberOrNull(lead.estimatedValue),
      nextAction: lead.nextAction,
      dueAt: lead.dueAt?.toISOString() ?? null,
    })),
    opportunities: opportunities.map(mapOpportunity),
    tickets: tickets.map(mapTicket),
    insights: insights.map(mapInsight),
    auditLogs: auditLogs.map(mapAuditLog),
  };
}

export async function getSrmDashboard(organizationId: string): Promise<SrmDashboardData> {
  const [vendors, onboardings, tickets, insights, auditLogs] = await Promise.all([
    prisma.vendor.findMany({
      where: { organizationId, deletedAt: null },
      orderBy: { updatedAt: "desc" },
      take: 12,
    }),
    prisma.vendorOnboarding.findMany({
      where: { organizationId },
      orderBy: [{ riskScore: "desc" }, { updatedAt: "desc" }],
      take: 12,
    }),
    prisma.supportTicket.findMany({
      where: { organizationId, vendorId: { not: null } },
      orderBy: [{ priority: "desc" }, { updatedAt: "desc" }],
      take: 8,
    }),
    prisma.relationshipAiInsight.findMany({
      where: { organizationId, module: { in: ["SRM", "VENDOR_PORTAL"] }, status: "OPEN" },
      orderBy: [{ severity: "desc" }, { createdAt: "desc" }],
      take: 8,
    }),
    prisma.auditLog.findMany({
      where: { organizationId, resource: { in: ["srm", "portal"] } },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
  ]);

  return {
    stats: [
      {
        label: "Vendors",
        value: String(vendors.length),
        change: `${vendors.filter((item) => item.status === "ACTIVE").length} active`,
        trend: "up",
      },
      {
        label: "Onboarding",
        value: String(onboardings.filter((item) => !["APPROVED", "REJECTED"].includes(item.status)).length),
        change: `${onboardings.filter((item) => item.riskScore >= 75).length} high risk`,
        trend: "down",
      },
      {
        label: "Vendor tickets",
        value: String(tickets.filter((item) => !["RESOLVED", "CLOSED"].includes(item.status)).length),
        change: `${tickets.filter((item) => item.priority === "HIGH" || item.priority === "CRITICAL").length} high priority`,
        trend: "neutral",
      },
      {
        label: "AI insights",
        value: String(insights.length),
        change: `${insights.filter((item) => item.severity === "HIGH" || item.severity === "CRITICAL").length} escalated`,
        trend: "down",
      },
    ],
    vendors: vendors.map(mapVendor),
    onboardings: onboardings.map(mapOnboarding),
    tickets: tickets.map(mapTicket),
    insights: insights.map(mapInsight),
    auditLogs: auditLogs.map(mapAuditLog),
  };
}

export async function getCustomerPortalDashboard(
  organizationId: string,
  customerId: string,
): Promise<CustomerPortalData | null> {
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, organizationId, deletedAt: null },
  });
  if (!customer) return null;

  const [opportunities, tickets, insights] = await Promise.all([
    prisma.salesOpportunity.findMany({
      where: { organizationId, customerId },
      include: { customer: { select: { name: true } } },
      orderBy: { expectedCloseAt: "asc" },
      take: 8,
    }),
    prisma.supportTicket.findMany({
      where: { organizationId, customerId },
      orderBy: { updatedAt: "desc" },
      take: 8,
    }),
    prisma.relationshipAiInsight.findMany({
      where: { organizationId, module: { in: ["CRM", "CUSTOMER_PORTAL"] }, status: "OPEN" },
      orderBy: { createdAt: "desc" },
      take: 4,
    }),
  ]);

  return {
    customer: mapCustomer(customer),
    opportunities: opportunities.map(mapOpportunity),
    tickets: tickets.map(mapTicket),
    insights: insights.map(mapInsight),
  };
}

export async function getVendorPortalDashboard(
  organizationId: string,
  vendorId: string,
): Promise<VendorPortalData | null> {
  const vendor = await prisma.vendor.findFirst({
    where: { id: vendorId, organizationId, deletedAt: null },
  });
  if (!vendor) return null;

  const [onboardings, tickets, insights] = await Promise.all([
    prisma.vendorOnboarding.findMany({
      where: { organizationId, vendorId },
      orderBy: { updatedAt: "desc" },
      take: 8,
    }),
    prisma.supportTicket.findMany({
      where: { organizationId, vendorId },
      orderBy: { updatedAt: "desc" },
      take: 8,
    }),
    prisma.relationshipAiInsight.findMany({
      where: { organizationId, module: { in: ["SRM", "VENDOR_PORTAL"] }, status: "OPEN" },
      orderBy: { createdAt: "desc" },
      take: 4,
    }),
  ]);

  return {
    vendor: mapVendor(vendor),
    onboardings: onboardings.map(mapOnboarding),
    tickets: tickets.map(mapTicket),
    insights: insights.map(mapInsight),
  };
}

function mapCustomer(customer: {
  id: string;
  code: string;
  name: string;
  industry: string | null;
  segment: string | null;
  status: string;
  creditLimit: unknown;
  outstandingAmount: unknown;
}): CustomerView {
  return {
    id: customer.id,
    code: customer.code,
    name: customer.name,
    industry: customer.industry,
    segment: customer.segment,
    status: customer.status,
    creditLimit: decimalToNumberOrNull(customer.creditLimit),
    outstandingAmount: decimalToNumber(customer.outstandingAmount),
  };
}

function mapVendor(vendor: {
  id: string;
  code: string;
  name: string;
  vendorType: string;
  status: string;
  paymentTermsDays: number;
  metadata: unknown;
}): VendorView {
  const metadata = isRecord(vendor.metadata) ? vendor.metadata : {};
  return {
    id: vendor.id,
    code: vendor.code,
    name: vendor.name,
    vendorType: vendor.vendorType,
    status: vendor.status,
    paymentTermsDays: vendor.paymentTermsDays,
    riskTier: typeof metadata.riskTier === "string" ? metadata.riskTier : null,
  };
}

function mapOpportunity(opportunity: {
  id: string;
  opportunityNumber: string;
  name: string;
  stage: string;
  amount: unknown;
  probability: number;
  expectedCloseAt: Date | null;
  customer: { name: string };
}): SalesOpportunityView {
  return {
    id: opportunity.id,
    opportunityNumber: opportunity.opportunityNumber,
    name: opportunity.name,
    customerName: opportunity.customer.name,
    stage: opportunity.stage,
    amount: decimalToNumber(opportunity.amount),
    probability: opportunity.probability,
    expectedCloseAt: opportunity.expectedCloseAt?.toISOString() ?? null,
  };
}

function mapOnboarding(onboarding: {
  id: string;
  onboardingNumber: string;
  supplierName: string;
  contactName: string | null;
  status: string;
  riskScore: number;
  currentStep: string;
  submittedAt: Date | null;
}): VendorOnboardingView {
  return {
    id: onboarding.id,
    onboardingNumber: onboarding.onboardingNumber,
    supplierName: onboarding.supplierName,
    contactName: onboarding.contactName,
    status: onboarding.status,
    riskScore: onboarding.riskScore,
    currentStep: onboarding.currentStep,
    submittedAt: onboarding.submittedAt?.toISOString() ?? null,
  };
}

function mapTicket(ticket: {
  id: string;
  ticketNumber: string;
  subject: string;
  description: string | null;
  status: string;
  priority: string;
  channel: string;
  ownerRole: string | null;
  dueAt: Date | null;
}): SupportTicketView {
  return {
    id: ticket.id,
    ticketNumber: ticket.ticketNumber,
    subject: ticket.subject,
    description: ticket.description,
    status: ticket.status,
    priority: ticket.priority,
    channel: ticket.channel,
    ownerRole: ticket.ownerRole,
    dueAt: ticket.dueAt?.toISOString() ?? null,
  };
}

function mapInsight(insight: {
  id: string;
  module: string;
  title: string;
  description: string;
  severity: RelationshipAiInsightView["severity"];
  confidence: unknown;
}): RelationshipAiInsightView {
  return {
    id: insight.id,
    module: insight.module,
    title: insight.title,
    description: insight.description,
    severity: insight.severity,
    confidence: decimalToNumberOrNull(insight.confidence),
  };
}

function mapAuditLog(log: {
  id: string;
  action: string;
  resource: string;
  severity: string;
  createdAt: Date;
}): RelationshipAuditView {
  return {
    id: log.id,
    action: log.action,
    resource: log.resource,
    severity: log.severity,
    createdAt: log.createdAt.toISOString(),
  };
}

function decimalToNumber(value: unknown): number {
  return decimalToNumberOrNull(value) ?? 0;
}

function decimalToNumberOrNull(value: unknown): number | null {
  if (value == null) return null;
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value) || 0;
  if (typeof value === "object" && "toString" in value) {
    const parsed = Number(value.toString());
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function formatInr(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
    notation: Math.abs(amount) >= 1000000 ? "compact" : "standard",
  }).format(amount);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
