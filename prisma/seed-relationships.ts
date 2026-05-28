import bcrypt from "bcryptjs";
import { Prisma, type PrismaClient } from "../app/generated/prisma/client";

const PORTAL_PASSWORD = process.env.SEED_PORTAL_PASSWORD ?? "PortalDemo@123";

type CustomerSeed = {
  code: string;
  name: string;
  legalName: string;
  industry: string;
  segment: string;
  gstin: string;
  pan: string;
  email: string;
  phone: string;
  creditLimit: number;
  outstandingAmount: number;
  metadata: Record<string, unknown>;
};

type VendorSeed = {
  code: string;
  name: string;
  legalName: string;
  vendorType: string;
  gstin: string;
  pan: string;
  email: string;
  phone: string;
  paymentTermsDays: number;
  status: string;
  metadata: Record<string, unknown>;
};

const CUSTOMERS: CustomerSeed[] = [
  {
    code: "CUST-NORTHSTAR",
    name: "Northstar Retail",
    legalName: "Northstar Retail Pvt Ltd",
    industry: "Retail",
    segment: "Enterprise",
    gstin: "27AAFCN4012K1Z5",
    pan: "AAFCN4012K",
    email: "customer.portal@northstar.example",
    phone: "+919810001001",
    creditLimit: 2500000,
    outstandingAmount: 940000,
    metadata: { region: "West", healthScore: 82, seedProfile: "crm-srm-portals" },
  },
  {
    code: "CUST-APEX",
    name: "Apex Distribution",
    legalName: "Apex Distribution Ltd",
    industry: "Distribution",
    segment: "Strategic",
    gstin: "29AADCA8899Q1Z2",
    pan: "AADCA8899Q",
    email: "finance@apex-distribution.example",
    phone: "+918020002002",
    creditLimit: 1800000,
    outstandingAmount: 1260000,
    metadata: { region: "South", healthScore: 68, seedProfile: "crm-srm-portals" },
  },
  {
    code: "CUST-METROFAB",
    name: "Metro Fabricators",
    legalName: "Metro Fabricators LLP",
    industry: "Manufacturing",
    segment: "Growth",
    gstin: "06AAHFM6721P1Z8",
    pan: "AAHFM6721P",
    email: "ops@metrofab.example",
    phone: "+911240003003",
    creditLimit: 1200000,
    outstandingAmount: 410000,
    metadata: { region: "North", healthScore: 76, seedProfile: "crm-srm-portals" },
  },
];

const VENDORS: VendorSeed[] = [
  {
    code: "VEN-TECHNOVA",
    name: "TechNova Systems",
    legalName: "TechNova Systems Pvt Ltd",
    vendorType: "SUPPLIER",
    gstin: "27AAACT1234F1Z7",
    pan: "AAACT1234F",
    email: "vendor.portal@technova.example",
    phone: "+912240004004",
    paymentTermsDays: 30,
    status: "ACTIVE",
    metadata: { riskTier: "LOW", category: "IT hardware", seedProfile: "crm-srm-portals" },
  },
  {
    code: "VEN-SHAKTI",
    name: "Shakti Industrial Supplies",
    legalName: "Shakti Industrial Supplies LLP",
    vendorType: "SUPPLIER",
    gstin: "24AAIFS4567J1Z3",
    pan: "AAIFS4567J",
    email: "accounts@shakti-supplies.example",
    phone: "+917940005005",
    paymentTermsDays: 45,
    status: "UNDER_REVIEW",
    metadata: { riskTier: "MEDIUM", category: "Industrial supplies", seedProfile: "crm-srm-portals" },
  },
  {
    code: "VEN-GREENLINE",
    name: "Greenline Logistics",
    legalName: "Greenline Logistics Pvt Ltd",
    vendorType: "SERVICE_PROVIDER",
    gstin: "29AAGCG9912R1Z1",
    pan: "AAGCG9912R",
    email: "partner@greenline.example",
    phone: "+918040006006",
    paymentTermsDays: 15,
    status: "ONBOARDING",
    metadata: { riskTier: "HIGH", category: "Logistics", seedProfile: "crm-srm-portals" },
  },
];

export async function seedRelationshipPortals(
  prisma: PrismaClient,
  organizationId: string,
  actorUserId: string,
) {
  if (process.env.NODE_ENV === "production" && PORTAL_PASSWORD === "PortalDemo@123") {
    throw new Error("SEED_PORTAL_PASSWORD must be set to a production-safe value.");
  }

  const passwordHash = await bcrypt.hash(
    PORTAL_PASSWORD,
    Number(process.env.SEED_BCRYPT_ROUNDS ?? 10),
  );

  const customers = new Map<string, string>();
  for (const item of CUSTOMERS) {
    const customer = await prisma.customer.upsert({
      where: { organizationId_code: { organizationId, code: item.code } },
      create: {
        organizationId,
        code: item.code,
        name: item.name,
        legalName: item.legalName,
        industry: item.industry,
        segment: item.segment,
        gstin: item.gstin,
        pan: item.pan,
        email: item.email,
        phone: item.phone,
        creditLimit: item.creditLimit,
        outstandingAmount: item.outstandingAmount,
        metadata: asJson(item.metadata),
      },
      update: {
        name: item.name,
        legalName: item.legalName,
        industry: item.industry,
        segment: item.segment,
        gstin: item.gstin,
        pan: item.pan,
        email: item.email,
        phone: item.phone,
        creditLimit: item.creditLimit,
        outstandingAmount: item.outstandingAmount,
        status: "ACTIVE",
        metadata: asJson(item.metadata),
        deletedAt: null,
      },
      select: { id: true },
    });
    customers.set(item.code, customer.id);
  }

  const vendors = new Map<string, string>();
  for (const item of VENDORS) {
    const vendor = await prisma.vendor.upsert({
      where: { organizationId_code: { organizationId, code: item.code } },
      create: {
        organizationId,
        code: item.code,
        name: item.name,
        legalName: item.legalName,
        vendorType: item.vendorType,
        gstin: item.gstin,
        pan: item.pan,
        email: item.email,
        phone: item.phone,
        paymentTermsDays: item.paymentTermsDays,
        status: item.status,
        metadata: asJson(item.metadata),
      },
      update: {
        name: item.name,
        legalName: item.legalName,
        vendorType: item.vendorType,
        gstin: item.gstin,
        pan: item.pan,
        email: item.email,
        phone: item.phone,
        paymentTermsDays: item.paymentTermsDays,
        status: item.status,
        metadata: asJson(item.metadata),
        deletedAt: null,
      },
      select: { id: true },
    });
    vendors.set(item.code, vendor.id);
  }

  await seedPortalAccount(prisma, {
    organizationId,
    accountType: "CUSTOMER",
    customerId: customers.get("CUST-NORTHSTAR") ?? null,
    vendorId: null,
    email: "customer.portal@northstar.example",
    displayName: "Northstar Retail Portal",
    passwordHash,
  });

  await seedPortalAccount(prisma, {
    organizationId,
    accountType: "VENDOR",
    customerId: null,
    vendorId: vendors.get("VEN-TECHNOVA") ?? null,
    email: "vendor.portal@technova.example",
    displayName: "TechNova Systems Portal",
    passwordHash,
  });

  await seedCrmRecords(prisma, organizationId, customers);
  await seedSrmRecords(prisma, organizationId, vendors);
  await seedRelationshipAudit(prisma, organizationId, actorUserId);

  console.log("  CRM/SRM: seeded portals, leads, pipeline, vendor onboarding, tickets, and AI insights");
}

async function seedPortalAccount(
  prisma: PrismaClient,
  params: {
    organizationId: string;
    accountType: "CUSTOMER" | "VENDOR";
    customerId: string | null;
    vendorId: string | null;
    email: string;
    displayName: string;
    passwordHash: string;
  },
) {
  await prisma.portalAccount.upsert({
    where: {
      organizationId_email: {
        organizationId: params.organizationId,
        email: params.email,
      },
    },
    create: {
      organizationId: params.organizationId,
      accountType: params.accountType,
      customerId: params.customerId,
      vendorId: params.vendorId,
      email: params.email,
      displayName: params.displayName,
      passwordHash: params.passwordHash,
      status: "ACTIVE",
      metadata: { seedProfile: "crm-srm-portals" },
    },
    update: {
      accountType: params.accountType,
      customerId: params.customerId,
      vendorId: params.vendorId,
      displayName: params.displayName,
      passwordHash: params.passwordHash,
      status: "ACTIVE",
      metadata: { seedProfile: "crm-srm-portals" },
      deletedAt: null,
    },
  });
}

async function seedCrmRecords(
  prisma: PrismaClient,
  organizationId: string,
  customers: Map<string, string>,
) {
  const leads = [
    ["CRM-LEAD-1001", "Orion Foods", "Neha Jain", "Website demo", "QUALIFIED", 86, 2200000, "Prepare commercial proposal"],
    ["CRM-LEAD-1002", "Veda Components", "Rahul Shah", "Partner referral", "NURTURING", 72, 1450000, "Schedule plant finance workshop"],
    ["CRM-LEAD-1003", "Kaveri Exports", "Meera Iyer", "Board MIS webinar", "NEW", 61, 980000, "Send discovery questionnaire"],
  ] as const;

  for (const [leadNumber, companyName, contactName, source, status, score, estimatedValue, nextAction] of leads) {
    await prisma.crmLead.upsert({
      where: { organizationId_leadNumber: { organizationId, leadNumber } },
      create: {
        organizationId,
        leadNumber,
        companyName,
        contactName,
        email: `${contactName.toLowerCase().replaceAll(" ", ".")}@example.com`,
        source,
        status,
        score,
        estimatedValue,
        ownerRole: "manager",
        nextAction,
        dueAt: hoursFromNow(24),
        metadata: { seedProfile: "crm-srm-portals" },
      },
      update: {
        companyName,
        contactName,
        source,
        status,
        score,
        estimatedValue,
        ownerRole: "manager",
        nextAction,
        dueAt: hoursFromNow(24),
        metadata: { seedProfile: "crm-srm-portals" },
      },
    });
  }

  const opportunities = [
    ["CRM-OPP-2401", "CUST-NORTHSTAR", "Northstar finance operations expansion", "NEGOTIATION", 1840000, 72],
    ["CRM-OPP-2402", "CUST-APEX", "Apex distributor portal rollout", "PROPOSAL", 1260000, 58],
    ["CRM-OPP-2403", "CUST-METROFAB", "Metro production analytics pilot", "DISCOVERY", 890000, 35],
  ] as const;

  for (const [opportunityNumber, customerCode, name, stage, amount, probability] of opportunities) {
    const customerId = customers.get(customerCode);
    if (!customerId) continue;
    await prisma.salesOpportunity.upsert({
      where: { organizationId_opportunityNumber: { organizationId, opportunityNumber } },
      create: {
        organizationId,
        customerId,
        opportunityNumber,
        name,
        stage,
        amount,
        probability,
        expectedCloseAt: hoursFromNow(24 * 21),
        ownerRole: "manager",
        metadata: { seedProfile: "crm-srm-portals" },
      },
      update: {
        customerId,
        name,
        stage,
        amount,
        probability,
        expectedCloseAt: hoursFromNow(24 * 21),
        ownerRole: "manager",
        metadata: { seedProfile: "crm-srm-portals" },
      },
    });
  }

  await seedTicket(prisma, organizationId, {
    ticketNumber: "SUP-CUST-5101",
    customerId: customers.get("CUST-NORTHSTAR") ?? null,
    vendorId: null,
    subject: "Invoice copy request for March services",
    description: "Customer portal user requested invoice evidence for internal close.",
    status: "IN_PROGRESS",
    priority: "MEDIUM",
    ownerRole: "finance-manager",
  });

  await seedTicket(prisma, organizationId, {
    ticketNumber: "SUP-CUST-5102",
    customerId: customers.get("CUST-APEX") ?? null,
    vendorId: null,
    subject: "Milestone acceptance dispute",
    description: "Customer raised a service milestone dispute blocking collection.",
    status: "OPEN",
    priority: "HIGH",
    ownerRole: "manager",
  });

  await seedInsight(prisma, organizationId, {
    module: "CRM",
    entityType: "sales_opportunity",
    title: "Renewal expansion likely to slip",
    description: "Northstar opportunity has high value but proposal age exceeds target by six days.",
    severity: "HIGH",
    confidence: 84.2,
  });

  await seedInsight(prisma, organizationId, {
    module: "CRM",
    entityType: "customer",
    title: "Customer churn risk",
    description: "Apex Distribution has elevated outstanding exposure and delayed milestone acceptance activity.",
    severity: "HIGH",
    confidence: 87.4,
  });

  await seedInsight(prisma, organizationId, {
    module: "CRM",
    entityType: "sales_opportunity",
    title: "Sales opportunity score",
    description: "Orion Foods lead score and Northstar pipeline probability indicate a strong expansion motion.",
    severity: "MEDIUM",
    confidence: 82.1,
  });

  await seedInsight(prisma, organizationId, {
    module: "CUSTOMER_PORTAL",
    entityType: "customer_profitability",
    title: "Customer profitability alert",
    description: "Apex collection friction may reduce account profitability if the disputed milestone remains unresolved.",
    severity: "MEDIUM",
    confidence: 78.6,
  });
}

async function seedSrmRecords(
  prisma: PrismaClient,
  organizationId: string,
  vendors: Map<string, string>,
) {
  const onboardings = [
    ["SRM-ONB-3001", "VEN-TECHNOVA", "TechNova Systems", "Amit Verma", "UNDER_REVIEW", 42, "Bank verification"],
    ["SRM-ONB-3002", "VEN-SHAKTI", "Shakti Industrial Supplies", "Dinesh Rao", "DOCUMENTS_PENDING", 68, "GST certificate pending"],
    ["SRM-ONB-3003", "VEN-GREENLINE", "Greenline Logistics", "Farah Khan", "UNDER_REVIEW", 81, "Risk review"],
  ] as const;

  for (const [onboardingNumber, vendorCode, supplierName, contactName, status, riskScore, currentStep] of onboardings) {
    await prisma.vendorOnboarding.upsert({
      where: { organizationId_onboardingNumber: { organizationId, onboardingNumber } },
      create: {
        organizationId,
        vendorId: vendors.get(vendorCode) ?? null,
        onboardingNumber,
        supplierName,
        contactName,
        email: `${supplierName.toLowerCase().replaceAll(" ", ".")}@example.com`,
        status,
        riskScore,
        currentStep,
        submittedAt: hoursFromNow(-36),
        metadata: { seedProfile: "crm-srm-portals" },
      },
      update: {
        vendorId: vendors.get(vendorCode) ?? null,
        supplierName,
        contactName,
        status,
        riskScore,
        currentStep,
        submittedAt: hoursFromNow(-36),
        metadata: { seedProfile: "crm-srm-portals" },
      },
    });
  }

  await seedTicket(prisma, organizationId, {
    ticketNumber: "SUP-VEN-6101",
    customerId: null,
    vendorId: vendors.get("VEN-TECHNOVA") ?? null,
    subject: "Bank account validation request",
    description: "Vendor submitted updated bank details for AP validation.",
    status: "IN_PROGRESS",
    priority: "MEDIUM",
    ownerRole: "finance-manager",
  });

  await seedTicket(prisma, organizationId, {
    ticketNumber: "SUP-VEN-6102",
    customerId: null,
    vendorId: vendors.get("VEN-GREENLINE") ?? null,
    subject: "Insurance certificate expiring",
    description: "Logistics partner certificate expires before next dispatch cycle.",
    status: "OPEN",
    priority: "HIGH",
    ownerRole: "auditor",
  });

  await seedInsight(prisma, organizationId, {
    module: "SRM",
    entityType: "vendor_onboarding",
    title: "Greenline requires risk review before approval",
    description: "Risk score is elevated due to missing insurance evidence and new logistics lane exposure.",
    severity: "HIGH",
    confidence: 88.6,
  });

  await seedInsight(prisma, organizationId, {
    module: "VENDOR_PORTAL",
    entityType: "support_ticket",
    title: "Vendor ticket nearing SLA breach",
    description: "Bank validation ticket has not received finance evidence review within the target window.",
    severity: "MEDIUM",
    confidence: 79.4,
  });

  await seedInsight(prisma, organizationId, {
    module: "SRM",
    entityType: "vendor",
    title: "Vendor reliability score",
    description: "TechNova remains reliable, while Greenline delivery readiness is constrained by missing insurance evidence.",
    severity: "MEDIUM",
    confidence: 81.2,
  });

  await seedInsight(prisma, organizationId, {
    module: "SRM",
    entityType: "delivery_performance",
    title: "Supplier delay prediction",
    description: "Greenline logistics onboarding risk and open compliance ticket may delay dispatch readiness.",
    severity: "HIGH",
    confidence: 86.5,
  });

  await seedInsight(prisma, organizationId, {
    module: "VENDOR_PORTAL",
    entityType: "supplier_profitability",
    title: "Supplier profitability alert",
    description: "Shakti payment terms and document gaps may increase purchase cycle cost if onboarding stalls.",
    severity: "MEDIUM",
    confidence: 75.9,
  });
}

async function seedTicket(
  prisma: PrismaClient,
  organizationId: string,
  item: {
    ticketNumber: string;
    customerId: string | null;
    vendorId: string | null;
    subject: string;
    description: string;
    status: "OPEN" | "IN_PROGRESS" | "WAITING_ON_CUSTOMER" | "RESOLVED" | "CLOSED";
    priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    ownerRole: string;
  },
) {
  await prisma.supportTicket.upsert({
    where: { organizationId_ticketNumber: { organizationId, ticketNumber: item.ticketNumber } },
    create: {
      organizationId,
      ...item,
      channel: "PORTAL",
      dueAt: hoursFromNow(18),
      metadata: { seedProfile: "crm-srm-portals" },
    },
    update: {
      ...item,
      channel: "PORTAL",
      dueAt: hoursFromNow(18),
      metadata: { seedProfile: "crm-srm-portals" },
    },
  });
}

async function seedInsight(
  prisma: PrismaClient,
  organizationId: string,
  item: {
    module: string;
    entityType: string;
    title: string;
    description: string;
    severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    confidence: number;
  },
) {
  const existing = await prisma.relationshipAiInsight.findFirst({
    where: { organizationId, module: item.module, title: item.title },
    select: { id: true },
  });

  const data = {
    organizationId,
    module: item.module,
    entityType: item.entityType,
    title: item.title,
    description: item.description,
    severity: item.severity,
    confidence: item.confidence,
    status: "OPEN",
    metadata: { seedProfile: "crm-srm-portals" },
  };

  if (existing) {
    await prisma.relationshipAiInsight.update({ where: { id: existing.id }, data });
    return;
  }

  await prisma.relationshipAiInsight.create({ data });
}

async function seedRelationshipAudit(
  prisma: PrismaClient,
  organizationId: string,
  actorUserId: string,
) {
  const events = [
    ["crm.lead.seeded", "crm", "CRM lead and pipeline seed completed"],
    ["crm.customer.payment_risk.flagged", "crm", "Customer payment risk signal linked to collections and profitability review"],
    ["crm.document.request.logged", "crm", "Customer invoice evidence request added to document tracking"],
    ["srm.vendor.onboarding.seeded", "srm", "SRM vendor onboarding seed completed"],
    ["srm.vendor.documents.requested", "srm", "Vendor GST, bank, and insurance documents linked to onboarding review"],
    ["srm.supplier.delay.predicted", "srm", "Supplier delay prediction linked to compliance evidence readiness"],
    ["portal.account.provisioned", "portal", "Customer and vendor portal accounts provisioned"],
  ] as const;

  for (const [action, resource, note] of events) {
    const existing = await prisma.auditLog.findFirst({
      where: { organizationId, action, resource, correlationId: "seed:crm-srm-portals" },
      select: { id: true },
    });
    if (existing) continue;

    await prisma.auditLog.create({
      data: {
        organizationId,
        userId: actorUserId,
        action,
        resource,
        severity: "INFO",
        after: { note, seedProfile: "crm-srm-portals" },
        metadata: { source: "seed" },
        correlationId: "seed:crm-srm-portals",
      },
    });
  }
}

function hoursFromNow(hours: number): Date {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}

function asJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value ?? {})) as Prisma.InputJsonValue;
}
