import { Prisma, type PrismaClient } from "../app/generated/prisma/client";

const FISCAL_YEAR_LABEL = "FY2025-26";

type VendorRef = { id: string; code: string; name: string };

export async function seedErpFinanceTransactions(
  prisma: PrismaClient,
  organizationId: string,
  actorUserId: string,
) {
  const vendors = await prisma.vendor.findMany({
    where: { organizationId, deletedAt: null },
    select: { id: true, code: true, name: true },
    take: 10,
  });
  if (vendors.length === 0) {
    console.log("  Finance ERP: skipped (no vendors — run relationship seed first)");
    return;
  }

  const vendorByCode = new Map(vendors.map((v) => [v.code, v]));
  const technova = vendorByCode.get("VEN-TECHNOVA") ?? vendors[0];
  const shakti = vendorByCode.get("VEN-SHAKTI") ?? vendors[1] ?? vendors[0];

  const fiscalYear = await prisma.fiscalYear.upsert({
    where: {
      organizationId_label: { organizationId, label: FISCAL_YEAR_LABEL },
    },
    create: {
      organizationId,
      label: FISCAL_YEAR_LABEL,
      startDate: new Date("2025-04-01"),
      endDate: new Date("2026-03-31"),
      isCurrent: true,
      isClosed: false,
    },
    update: { isCurrent: true, isClosed: false },
  });

  await prisma.fiscalYear.updateMany({
    where: { organizationId, id: { not: fiscalYear.id } },
    data: { isCurrent: false },
  });

  const financeDept = await upsertDepartment(prisma, organizationId, "FIN", "Finance");
  const opsDept = await upsertDepartment(prisma, organizationId, "OPS", "Operations");

  await seedTaxConfigurations(prisma, organizationId);
  await seedBudgets(prisma, organizationId, fiscalYear.id, financeDept.id, opsDept.id);
  await seedInvoicesAndPayments(prisma, organizationId, fiscalYear.id, technova, shakti);
  await seedExpenses(prisma, organizationId, technova, shakti, actorUserId);

  console.log("  Finance ERP: fiscal year, tax, budgets, invoices, payments, expenses");
}

async function upsertDepartment(
  prisma: PrismaClient,
  organizationId: string,
  code: string,
  name: string,
) {
  const company = await prisma.company.findFirst({
    where: { organizationId, status: "ACTIVE", deletedAt: null },
    select: { id: true },
    orderBy: { createdAt: "asc" },
  });
  if (!company) {
    throw new Error("Finance ERP seed requires an active company/legal entity");
  }

  const existing = await prisma.department.findFirst({
    where: { organizationId, departmentCode: code, deletedAt: null },
    select: { id: true },
  });
  if (existing) return existing;

  return prisma.department.create({
    data: {
      organizationId,
      companyId: company.id,
      departmentCode: code,
      departmentName: name,
      departmentType: "OTHER",
      status: "ACTIVE",
    },
    select: { id: true },
  });
}

async function seedTaxConfigurations(prisma: PrismaClient, organizationId: string) {
  const configs = [
    {
      name: "GST 18% — Standard",
      taxType: "GST",
      rate: 18,
      cgstRate: 9,
      sgstRate: 9,
      igstRate: 18,
      hsnSacCode: "998314",
      effectiveFrom: new Date("2025-04-01"),
    },
    {
      name: "TDS 194C — Contractors",
      taxType: "TDS",
      rate: 2,
      effectiveFrom: new Date("2025-04-01"),
    },
  ];

  for (const config of configs) {
    const existing = await prisma.taxConfiguration.findFirst({
      where: { organizationId, name: config.name },
      select: { id: true },
    });
    if (existing) continue;

    await prisma.taxConfiguration.create({
      data: {
        organizationId,
        name: config.name,
        taxType: config.taxType,
        rate: config.rate,
        cgstRate: config.cgstRate ?? null,
        sgstRate: config.sgstRate ?? null,
        igstRate: config.igstRate ?? null,
        hsnSacCode: config.hsnSacCode ?? null,
        effectiveFrom: config.effectiveFrom,
        isActive: true,
        metadata: { seedProfile: "erp-finance" },
      },
    });
  }
}

async function seedBudgets(
  prisma: PrismaClient,
  organizationId: string,
  fiscalYearId: string,
  financeDeptId: string,
  opsDeptId: string,
) {
  const budgets = [
    {
      name: "IT Capex FY26",
      category: "CAPEX",
      departmentId: financeDeptId,
      allocated: 2_500_000,
      consumed: 1_680_000,
    },
    {
      name: "Operations Opex FY26",
      category: "OPEX",
      departmentId: opsDeptId,
      allocated: 4_200_000,
      consumed: 2_940_000,
    },
    {
      name: "Marketing Programs",
      category: "OPEX",
      departmentId: null,
      allocated: 1_200_000,
      consumed: 720_000,
    },
  ];

  for (const budget of budgets) {
    const existing = await prisma.budget.findFirst({
      where: { organizationId, name: budget.name },
      select: { id: true },
    });
    if (existing) {
      await prisma.budget.update({
        where: { id: existing.id },
        data: {
          fiscalYearId,
          allocated: budget.allocated,
          consumed: budget.consumed,
        },
      });
      continue;
    }

    await prisma.budget.create({
      data: {
        organizationId,
        fiscalYearId,
        departmentId: budget.departmentId,
        name: budget.name,
        category: budget.category,
        allocated: budget.allocated,
        consumed: budget.consumed,
        metadata: { seedProfile: "erp-finance" },
      },
    });
  }
}

async function seedInvoicesAndPayments(
  prisma: PrismaClient,
  organizationId: string,
  fiscalYearId: string,
  technova: VendorRef,
  shakti: VendorRef,
) {
  const invoices: Array<{
    invoiceNumber: string;
    vendor: VendorRef;
    status: "ISSUED" | "SENT" | "OVERDUE" | "PAID" | "PARTIALLY_PAID";
    subtotal: number;
    taxable: number;
    cgst: number;
    sgst: number;
    total: number;
    issueDate: string;
    dueDate: string;
    paidFraction?: number;
  }> = [
    {
      invoiceNumber: "INV-SEED-1001",
      vendor: technova,
      status: "OVERDUE",
      subtotal: 750_000,
      taxable: 750_000,
      cgst: 67_500,
      sgst: 67_500,
      total: 885_000,
      issueDate: "2026-04-10",
      dueDate: "2026-05-10",
    },
    {
      invoiceNumber: "INV-SEED-1002",
      vendor: shakti,
      status: "ISSUED",
      subtotal: 420_000,
      taxable: 420_000,
      cgst: 37_800,
      sgst: 37_800,
      total: 495_600,
      issueDate: "2026-05-01",
      dueDate: "2026-05-31",
    },
    {
      invoiceNumber: "INV-SEED-1003",
      vendor: technova,
      status: "PAID",
      subtotal: 1_250_000,
      taxable: 1_250_000,
      cgst: 112_500,
      sgst: 112_500,
      total: 1_475_000,
      issueDate: "2026-05-05",
      dueDate: "2026-05-20",
      paidFraction: 1,
    },
    {
      invoiceNumber: "INV-SEED-1004",
      vendor: shakti,
      status: "PARTIALLY_PAID",
      subtotal: 320_000,
      taxable: 320_000,
      cgst: 28_800,
      sgst: 28_800,
      total: 377_600,
      issueDate: "2026-05-12",
      dueDate: "2026-06-12",
      paidFraction: 0.5,
    },
  ];

  for (const inv of invoices) {
    const invoice = await prisma.invoice.upsert({
      where: {
        organizationId_invoiceNumber: {
          organizationId,
          invoiceNumber: inv.invoiceNumber,
        },
      },
      create: buildInvoiceCreate(organizationId, fiscalYearId, inv),
      update: buildInvoiceUpdate(inv),
    });

    const lineExists = await prisma.invoiceLineItem.findFirst({
      where: { invoiceId: invoice.id },
      select: { id: true },
    });
    if (!lineExists) {
      await prisma.invoiceLineItem.create({
        data: {
          invoiceId: invoice.id,
          description: `Supply — ${inv.vendor.name}`,
          hsnSacCode: "847330",
          quantity: 1,
          unit: "LOT",
          unitPrice: inv.subtotal,
          taxableValue: inv.taxable,
          cgstRate: 9,
          sgstRate: 9,
          cgstAmount: inv.cgst,
          sgstAmount: inv.sgst,
          lineTotal: inv.total,
        },
      });
    }

    if (inv.paidFraction && inv.paidFraction > 0) {
      const paidAmount = Math.round(inv.total * inv.paidFraction);
      const paymentNumber = `PAY-${inv.invoiceNumber}`;
      const payment = await prisma.payment.upsert({
        where: {
          organizationId_paymentNumber: { organizationId, paymentNumber },
        },
        create: {
          organizationId,
          vendorId: inv.vendor.id,
          paymentNumber,
          status: inv.paidFraction >= 1 ? "COMPLETED" : "PROCESSING",
          method: "NEFT",
          amount: paidAmount,
          paidAt: inv.paidFraction >= 1 ? new Date() : null,
          reference: `UTR${inv.invoiceNumber.slice(-4)}`,
          metadata: { seedProfile: "erp-finance" },
        },
        update: {
          amount: paidAmount,
          status: inv.paidFraction >= 1 ? "COMPLETED" : "PROCESSING",
        },
      });

      await prisma.paymentAllocation.upsert({
        where: {
          paymentId_invoiceId: { paymentId: payment.id, invoiceId: invoice.id },
        },
        create: {
          paymentId: payment.id,
          invoiceId: invoice.id,
          amount: paidAmount,
        },
        update: { amount: paidAmount },
      });
    }
  }

  await prisma.payment.upsert({
    where: {
      organizationId_paymentNumber: {
        organizationId,
        paymentNumber: "PAY-SEED-PENDING-01",
      },
    },
    create: {
      organizationId,
      vendorId: technova.id,
      paymentNumber: "PAY-SEED-PENDING-01",
      status: "PENDING",
      method: "RTGS",
      amount: 625_000,
      metadata: { seedProfile: "erp-finance", note: "Awaiting CFO approval" },
    },
    update: { status: "PENDING", amount: 625_000 },
  });
}

function buildInvoiceCreate(
  organizationId: string,
  fiscalYearId: string,
  inv: {
    invoiceNumber: string;
    vendor: VendorRef;
    status: "ISSUED" | "SENT" | "OVERDUE" | "PAID" | "PARTIALLY_PAID";
    subtotal: number;
    taxable: number;
    cgst: number;
    sgst: number;
    total: number;
    issueDate: string;
    dueDate: string;
  },
) {
  return {
    organizationId,
    fiscalYearId,
    vendorId: inv.vendor.id,
    invoiceNumber: inv.invoiceNumber,
    status: inv.status,
    issueDate: new Date(inv.issueDate),
    dueDate: new Date(inv.dueDate),
    buyerDetails: { name: "Acme India Pvt Ltd" } as Prisma.InputJsonValue,
    sellerDetails: { name: inv.vendor.name } as Prisma.InputJsonValue,
    subtotal: inv.subtotal,
    taxableAmount: inv.taxable,
    cgstAmount: inv.cgst,
    sgstAmount: inv.sgst,
    totalAmount: inv.total,
    metadata: { seedProfile: "erp-finance" },
  };
}

function buildInvoiceUpdate(inv: {
  status: "ISSUED" | "SENT" | "OVERDUE" | "PAID" | "PARTIALLY_PAID";
  subtotal: number;
  taxable: number;
  cgst: number;
  sgst: number;
  total: number;
  issueDate: string;
  dueDate: string;
}) {
  return {
    status: inv.status,
    issueDate: new Date(inv.issueDate),
    dueDate: new Date(inv.dueDate),
    subtotal: inv.subtotal,
    taxableAmount: inv.taxable,
    cgstAmount: inv.cgst,
    sgstAmount: inv.sgst,
    totalAmount: inv.total,
  };
}

async function seedExpenses(
  prisma: PrismaClient,
  organizationId: string,
  technova: VendorRef,
  shakti: VendorRef,
  actorUserId: string,
) {
  const expenses = [
    {
      expenseNumber: "EXP-SEED-2001",
      category: "Travel",
      amount: 48_500,
      vendorId: null as string | null,
      gstAmount: 2_400,
      tdsAmount: 0,
      description: "Mumbai client visit — sales team",
      daysAgo: 3,
    },
    {
      expenseNumber: "EXP-SEED-2002",
      category: "Cloud & SaaS",
      amount: 186_000,
      vendorId: technova.id,
      gstAmount: 33_480,
      tdsAmount: 3_720,
      description: "Annual platform subscription",
      daysAgo: 8,
    },
    {
      expenseNumber: "EXP-SEED-2003",
      category: "Raw materials",
      amount: 920_000,
      vendorId: shakti.id,
      gstAmount: 165_600,
      tdsAmount: 18_400,
      description: "Production consumables — May batch",
      daysAgo: 12,
    },
    {
      expenseNumber: "EXP-SEED-2004",
      category: "Facilities",
      amount: 125_000,
      vendorId: null,
      gstAmount: 22_500,
      tdsAmount: 0,
      description: "Bangalore warehouse utilities",
      daysAgo: 18,
    },
  ];

  const today = new Date();
  for (const exp of expenses) {
    const expenseDate = new Date(today);
    expenseDate.setDate(today.getDate() - exp.daysAgo);

    await prisma.expense.upsert({
      where: {
        organizationId_expenseNumber: {
          organizationId,
          expenseNumber: exp.expenseNumber,
        },
      },
      create: {
        organizationId,
        vendorId: exp.vendorId,
        expenseNumber: exp.expenseNumber,
        category: exp.category,
        amount: exp.amount,
        expenseDate,
        employeeId: actorUserId,
        description: exp.description,
        gstAmount: exp.gstAmount,
        tdsAmount: exp.tdsAmount,
        status: "APPROVED",
        metadata: { seedProfile: "erp-finance" },
      },
      update: {
        amount: exp.amount,
        expenseDate,
        gstAmount: exp.gstAmount,
        tdsAmount: exp.tdsAmount,
        status: "APPROVED",
      },
    });
  }
}
