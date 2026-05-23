import type { Prisma, PrismaClient } from "../app/generated/prisma/client";

type SeedDb = PrismaClient | Prisma.TransactionClient;

type VendorSeed = {
  code: string;
  name: string;
  legalName: string;
  vendorType: string;
  gstin: string;
  pan: string;
  email: string;
  paymentTermsDays: number;
  city: string;
  stateCode: string;
  pinCode: string;
  contactName: string;
  bankName: string;
  ifsc: string;
  riskTier: "low" | "medium" | "high";
};

const vendors: VendorSeed[] = [
  {
    code: "V-TCS",
    name: "TCS Ltd",
    legalName: "Tata Consultancy Services Limited",
    vendorType: "SERVICE_PROVIDER",
    gstin: "27AAACR4849R1ZL",
    pan: "AAACR4849R",
    email: "enterprise.billing@tcs.example",
    paymentTermsDays: 15,
    city: "Mumbai",
    stateCode: "MH",
    pinCode: "400001",
    contactName: "Nikhil Rao",
    bankName: "HDFC Bank",
    ifsc: "HDFC0000240",
    riskTier: "medium",
  },
  {
    code: "V-CLOUD",
    name: "CloudServe India",
    legalName: "CloudServe India Private Limited",
    vendorType: "SERVICE_PROVIDER",
    gstin: "29AACCC1234F1Z8",
    pan: "AACCC1234F",
    email: "billing@cloudserve.example",
    paymentTermsDays: 10,
    city: "Bengaluru",
    stateCode: "KA",
    pinCode: "560103",
    contactName: "Priya Nair",
    bankName: "ICICI Bank",
    ifsc: "ICIC0001199",
    riskTier: "high",
  },
  {
    code: "V-TRAVEL",
    name: "TravelCo Business",
    legalName: "TravelCo Business Services LLP",
    vendorType: "CONTRACTOR",
    gstin: "07AAGFT1020P1Z9",
    pan: "AAGFT1020P",
    email: "accounts@travelco.example",
    paymentTermsDays: 7,
    city: "Delhi",
    stateCode: "DL",
    pinCode: "110001",
    contactName: "Vivek Malhotra",
    bankName: "Axis Bank",
    ifsc: "UTIB0000227",
    riskTier: "low",
  },
  {
    code: "V-FACILITY",
    name: "FacilityWorks",
    legalName: "FacilityWorks Services Private Limited",
    vendorType: "SUPPLIER",
    gstin: "29AACCF7788M1Z2",
    pan: "AACCF7788M",
    email: "finance@facilityworks.example",
    paymentTermsDays: 30,
    city: "Bengaluru",
    stateCode: "KA",
    pinCode: "560066",
    contactName: "Sneha Kulkarni",
    bankName: "State Bank of India",
    ifsc: "SBIN0003357",
    riskTier: "medium",
  },
  {
    code: "V-AUDIT",
    name: "AuditPro Advisors",
    legalName: "AuditPro Advisors LLP",
    vendorType: "SERVICE_PROVIDER",
    gstin: "27AANFA7711L1Z6",
    pan: "AANFA7711L",
    email: "partners@auditpro.example",
    paymentTermsDays: 20,
    city: "Pune",
    stateCode: "MH",
    pinCode: "411001",
    contactName: "Amit Deshpande",
    bankName: "Kotak Mahindra Bank",
    ifsc: "KKBK0000725",
    riskTier: "low",
  },
];

export async function seedFinanceData(
  prisma: PrismaClient,
  organizationId: string,
  requesterId: string,
  financeApproverId: string,
  cfoApproverId: string,
) {
  await prisma.$transaction(
    async (tx) => {
      const fiscalYear = await seedFiscalYear(tx, organizationId);
      const departments = await seedDepartments(tx, organizationId);
      const vendorRows = await seedVendors(tx, organizationId);
      await seedTaxConfiguration(tx, organizationId);
      await seedBudgets(tx, organizationId, fiscalYear.id, departments);
      const invoices = await seedInvoices(tx, organizationId, fiscalYear.id, vendorRows);
      const payments = await seedPayments(tx, organizationId, vendorRows, invoices);
      const expenses = await seedExpenses(tx, organizationId, vendorRows);
      await seedFinanceApprovals({
        tx,
        organizationId,
        requesterId,
        financeApproverId,
        cfoApproverId,
        payments,
        expenses,
        invoices,
      });
    },
    { timeout: 30_000 },
  );

  console.log("  Finance: seeded vendors, invoices, expenses, payments, budgets, and approvals");
}

async function seedFiscalYear(tx: SeedDb, organizationId: string) {
  const now = new Date();
  const fyStartYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  const label = `FY${fyStartYear}-${String(fyStartYear + 1).slice(-2)}`;

  await tx.fiscalYear.updateMany({
    where: { organizationId, isCurrent: true, label: { not: label } },
    data: { isCurrent: false },
  });

  return tx.fiscalYear.upsert({
    where: { organizationId_label: { organizationId, label } },
    create: {
      organizationId,
      label,
      startDate: new Date(fyStartYear, 3, 1),
      endDate: new Date(fyStartYear + 1, 2, 31),
      isCurrent: true,
    },
    update: { isCurrent: true },
  });
}

async function seedDepartments(tx: SeedDb, organizationId: string) {
  const items = [
    ["FIN", "Finance"],
    ["IT", "Information Technology"],
    ["OPS", "Operations"],
    ["SALES", "Sales"],
  ] as const;
  const rows = new Map<string, Awaited<ReturnType<typeof tx.department.upsert>>>();

  for (const [code, name] of items) {
    const department = await tx.department.upsert({
      where: { organizationId_code: { organizationId, code } },
      create: { organizationId, code, name },
      update: { name },
    });
    rows.set(code, department);
  }

  return rows;
}

async function seedVendors(tx: SeedDb, organizationId: string) {
  const rows = new Map<string, Awaited<ReturnType<typeof tx.vendor.upsert>>>();

  for (const vendor of vendors) {
    const row = await tx.vendor.upsert({
      where: { organizationId_code: { organizationId, code: vendor.code } },
      create: {
        organizationId,
        code: vendor.code,
        name: vendor.name,
        legalName: vendor.legalName,
        vendorType: vendor.vendorType,
        gstin: vendor.gstin,
        pan: vendor.pan,
        email: vendor.email,
        paymentTermsDays: vendor.paymentTermsDays,
        address: {
          city: vendor.city,
          stateCode: vendor.stateCode,
          pinCode: vendor.pinCode,
          country: "India",
        },
        bankDetails: {
          bankName: vendor.bankName,
          ifsc: vendor.ifsc,
          accountMasked: "XXXXXX4321",
        },
        status: "ACTIVE",
        metadata: {
          contactName: vendor.contactName,
          riskTier: vendor.riskTier,
          onboardingStatus: "verified",
        },
      },
      update: {
        name: vendor.name,
        legalName: vendor.legalName,
        vendorType: vendor.vendorType,
        gstin: vendor.gstin,
        pan: vendor.pan,
        email: vendor.email,
        paymentTermsDays: vendor.paymentTermsDays,
        address: {
          city: vendor.city,
          stateCode: vendor.stateCode,
          pinCode: vendor.pinCode,
          country: "India",
        },
        bankDetails: {
          bankName: vendor.bankName,
          ifsc: vendor.ifsc,
          accountMasked: "XXXXXX4321",
        },
        status: "ACTIVE",
        metadata: {
          contactName: vendor.contactName,
          riskTier: vendor.riskTier,
          onboardingStatus: "verified",
        },
      },
    });
    rows.set(vendor.code, row);
  }

  return rows;
}

async function seedTaxConfiguration(tx: SeedDb, organizationId: string) {
  const configs = [
    { name: "GST 18 percent services", taxType: "GST", rate: 18, hsnSacCode: "9983", cgstRate: 9, sgstRate: 9 },
    { name: "GST 5 percent travel", taxType: "GST", rate: 5, hsnSacCode: "9964", cgstRate: 2.5, sgstRate: 2.5 },
    { name: "TDS professional services", taxType: "TDS", rate: 10, hsnSacCode: null, cgstRate: null, sgstRate: null },
  ];

  for (const config of configs) {
    const existing = await tx.taxConfiguration.findFirst({
      where: { organizationId, name: config.name },
    });
    const data = {
      organizationId,
      name: config.name,
      taxType: config.taxType,
      rate: config.rate,
      hsnSacCode: config.hsnSacCode,
      cgstRate: config.cgstRate,
      sgstRate: config.sgstRate,
      effectiveFrom: new Date(2025, 3, 1),
      isActive: true,
    };
    if (existing) {
      await tx.taxConfiguration.update({ where: { id: existing.id }, data });
    } else {
      await tx.taxConfiguration.create({ data });
    }
  }
}

async function seedBudgets(
  tx: SeedDb,
  organizationId: string,
  fiscalYearId: string,
  departments: Map<string, { id: string }>,
) {
  const budgets = [
    ["IT", "Cloud and Infrastructure", "Cloud Services", 3_600_000, 2_920_000],
    ["OPS", "Facilities and Admin", "Facilities", 1_800_000, 1_145_000],
    ["SALES", "Travel and Customer Meetings", "Travel", 1_200_000, 735_000],
    ["FIN", "Audit and Compliance", "Professional Fees", 1_500_000, 1_020_000],
  ] as const;

  for (const [departmentCode, name, category, allocated, consumed] of budgets) {
    const existing = await tx.budget.findFirst({
      where: { organizationId, fiscalYearId, name },
    });
    const data = {
      organizationId,
      fiscalYearId,
      departmentId: departments.get(departmentCode)?.id ?? null,
      name,
      category,
      allocated,
      consumed,
      metadata: { source: "enterprise_seed" },
    };
    if (existing) {
      await tx.budget.update({ where: { id: existing.id }, data });
    } else {
      await tx.budget.create({ data });
    }
  }
}

async function seedInvoices(
  tx: SeedDb,
  organizationId: string,
  fiscalYearId: string,
  vendorRows: Map<string, { id: string; name: string; gstin: string | null }>,
) {
  const now = new Date();
  const invoices = [
    {
      invoiceNumber: "AR-2026-0001",
      status: "PAID" as const,
      issueDate: daysAgo(18),
      dueDate: daysAgo(3),
      buyerDetails: { name: "Bharat Retail Network", gstin: "29AAFCB2234L1Z4" },
      subtotal: 1_000_000,
      taxableAmount: 1_000_000,
      cgstAmount: 90_000,
      sgstAmount: 90_000,
      igstAmount: 0,
      tdsAmount: 100_000,
      totalAmount: 1_180_000,
      vendorId: null,
    },
    {
      invoiceNumber: "AR-2026-0002",
      status: "SENT" as const,
      issueDate: daysAgo(7),
      dueDate: daysFromNow(18),
      buyerDetails: { name: "NexGen Manufacturing", gstin: "27AAFCN4498Q1Z2" },
      subtotal: 2_000_000,
      taxableAmount: 2_000_000,
      cgstAmount: 0,
      sgstAmount: 0,
      igstAmount: 360_000,
      tdsAmount: 200_000,
      totalAmount: 2_360_000,
      vendorId: null,
    },
    {
      invoiceNumber: "AR-2026-0003",
      status: "PARTIALLY_PAID" as const,
      issueDate: daysAgo(34),
      dueDate: daysAgo(4),
      buyerDetails: { name: "West Coast Distribution", gstin: "27AAACW5021F1Z7" },
      subtotal: 1_250_000,
      taxableAmount: 1_250_000,
      cgstAmount: 112_500,
      sgstAmount: 112_500,
      igstAmount: 0,
      tdsAmount: 125_000,
      totalAmount: 1_475_000,
      vendorId: null,
    },
    {
      invoiceNumber: "AP-2026-0041",
      status: "ISSUED" as const,
      issueDate: daysAgo(5),
      dueDate: daysFromNow(5),
      buyerDetails: { name: "Acme India Pvt Ltd", gstin: "29AABCU9603R1ZM" },
      subtotal: 1_059_322,
      taxableAmount: 1_059_322,
      cgstAmount: 95_339,
      sgstAmount: 95_339,
      igstAmount: 0,
      tdsAmount: 105_932,
      totalAmount: 1_250_000,
      vendorId: vendorRows.get("V-TCS")?.id ?? null,
    },
    {
      invoiceNumber: "AP-2026-0042",
      status: "SENT" as const,
      issueDate: daysAgo(11),
      dueDate: daysFromNow(2),
      buyerDetails: { name: "Acme India Pvt Ltd", gstin: "29AABCU9603R1ZM" },
      subtotal: 576_271,
      taxableAmount: 576_271,
      cgstAmount: 51_864,
      sgstAmount: 51_864,
      igstAmount: 0,
      tdsAmount: 57_627,
      totalAmount: 680_000,
      vendorId: vendorRows.get("V-CLOUD")?.id ?? null,
    },
    {
      invoiceNumber: "AP-2026-0043",
      status: "OVERDUE" as const,
      issueDate: daysAgo(41),
      dueDate: daysAgo(9),
      buyerDetails: { name: "Acme India Pvt Ltd", gstin: "29AABCU9603R1ZM" },
      subtotal: 292_373,
      taxableAmount: 292_373,
      cgstAmount: 26_314,
      sgstAmount: 26_313,
      igstAmount: 0,
      tdsAmount: 29_237,
      totalAmount: 345_000,
      vendorId: vendorRows.get("V-FACILITY")?.id ?? null,
    },
    {
      invoiceNumber: "AR-2026-0004",
      status: "ISSUED" as const,
      issueDate: daysAgo(3),
      dueDate: daysFromNow(12),
      buyerDetails: { name: "Northstar Healthcare Systems", gstin: "06AABCN9821C1Z1" },
      subtotal: 875_000,
      taxableAmount: 875_000,
      cgstAmount: 0,
      sgstAmount: 0,
      igstAmount: 157_500,
      tdsAmount: 87_500,
      totalAmount: 1_032_500,
      vendorId: null,
    },
  ];
  const rows = new Map<string, Awaited<ReturnType<typeof tx.invoice.upsert>>>();

  for (const invoice of invoices) {
    const row = await tx.invoice.upsert({
      where: { organizationId_invoiceNumber: { organizationId, invoiceNumber: invoice.invoiceNumber } },
      create: {
        organizationId,
        fiscalYearId,
        vendorId: invoice.vendorId,
        invoiceNumber: invoice.invoiceNumber,
        status: invoice.status,
        issueDate: invoice.issueDate,
        dueDate: invoice.dueDate,
        buyerDetails: invoice.buyerDetails,
        sellerDetails: { name: invoice.vendorId ? vendorName(vendorRows, invoice.vendorId) : "Acme India Pvt Ltd" },
        buyerGstin: invoice.buyerDetails.gstin,
        placeOfSupply: "KA",
        subtotal: invoice.subtotal,
        taxableAmount: invoice.taxableAmount,
        cgstAmount: invoice.cgstAmount,
        sgstAmount: invoice.sgstAmount,
        igstAmount: invoice.igstAmount,
        tdsAmount: invoice.tdsAmount,
        totalAmount: invoice.totalAmount,
        irn: invoice.status === "PAID" ? `IRN-${invoice.invoiceNumber}` : null,
        ackNumber: invoice.status === "PAID" ? `ACK-${now.getFullYear()}-${invoice.invoiceNumber}` : null,
        ackDate: invoice.status === "PAID" ? invoice.issueDate : null,
        metadata: { source: "enterprise_seed" },
      },
      update: {
        vendorId: invoice.vendorId,
        status: invoice.status,
        issueDate: invoice.issueDate,
        dueDate: invoice.dueDate,
        buyerDetails: invoice.buyerDetails,
        sellerDetails: { name: invoice.vendorId ? vendorName(vendorRows, invoice.vendorId) : "Acme India Pvt Ltd" },
        buyerGstin: invoice.buyerDetails.gstin,
        subtotal: invoice.subtotal,
        taxableAmount: invoice.taxableAmount,
        cgstAmount: invoice.cgstAmount,
        sgstAmount: invoice.sgstAmount,
        igstAmount: invoice.igstAmount,
        tdsAmount: invoice.tdsAmount,
        totalAmount: invoice.totalAmount,
      },
    });
    await tx.invoiceLineItem.deleteMany({ where: { invoiceId: row.id } });
    await tx.invoiceLineItem.create({
      data: {
        invoiceId: row.id,
        description: invoice.vendorId ? "Enterprise vendor services" : "ERP platform services",
        hsnSacCode: "9983",
        quantity: 1,
        unit: "LOT",
        unitPrice: invoice.taxableAmount,
        taxableValue: invoice.taxableAmount,
        cgstRate: invoice.cgstAmount > 0 ? 9 : 0,
        sgstRate: invoice.sgstAmount > 0 ? 9 : 0,
        igstRate: invoice.igstAmount > 0 ? 18 : 0,
        cgstAmount: invoice.cgstAmount,
        sgstAmount: invoice.sgstAmount,
        igstAmount: invoice.igstAmount,
        lineTotal: invoice.totalAmount,
      },
    });
    rows.set(invoice.invoiceNumber, row);
  }

  return rows;
}

async function seedPayments(
  tx: SeedDb,
  organizationId: string,
  vendorRows: Map<string, { id: string; name: string }>,
  invoices: Map<string, { id: string }>,
) {
  const payments = [
    { paymentNumber: "PAY-2026-0101", status: "COMPLETED" as const, method: "NEFT" as const, amount: 1_180_000, paidAt: daysAgo(2), vendorCode: null, invoiceNumber: "AR-2026-0001" },
    { paymentNumber: "PAY-2026-0102", status: "COMPLETED" as const, method: "RTGS" as const, amount: 500_000, paidAt: daysAgo(1), vendorCode: null, invoiceNumber: "AR-2026-0003" },
    { paymentNumber: "PAY-2026-0201", status: "PENDING" as const, method: "NEFT" as const, amount: 1_250_000, paidAt: null, vendorCode: "V-TCS", invoiceNumber: null },
    { paymentNumber: "PAY-2026-0202", status: "PENDING" as const, method: "UPI" as const, amount: 680_000, paidAt: null, vendorCode: "V-CLOUD", invoiceNumber: null },
    { paymentNumber: "PAY-2026-0203", status: "PROCESSING" as const, method: "RTGS" as const, amount: 345_000, paidAt: null, vendorCode: "V-FACILITY", invoiceNumber: null },
    { paymentNumber: "PAY-2026-0204", status: "PENDING" as const, method: "NEFT" as const, amount: 220_000, paidAt: null, vendorCode: "V-AUDIT", invoiceNumber: null },
  ];
  const rows = new Map<string, Awaited<ReturnType<typeof tx.payment.upsert>>>();

  for (const payment of payments) {
    const vendor = payment.vendorCode ? vendorRows.get(payment.vendorCode) : null;
    const row = await tx.payment.upsert({
      where: { organizationId_paymentNumber: { organizationId, paymentNumber: payment.paymentNumber } },
      create: {
        organizationId,
        vendorId: vendor?.id ?? null,
        paymentNumber: payment.paymentNumber,
        status: payment.status,
        method: payment.method,
        amount: payment.amount,
        paidAt: payment.paidAt,
        reference: payment.paidAt ? `UTR${payment.paymentNumber.replace(/\D/g, "")}` : null,
        partyDetails: vendor ? { vendorCode: payment.vendorCode, name: vendor.name } : { customer: "Enterprise customer" },
        metadata: { source: "enterprise_seed" },
      },
      update: {
        vendorId: vendor?.id ?? null,
        status: payment.status,
        method: payment.method,
        amount: payment.amount,
        paidAt: payment.paidAt,
        partyDetails: vendor ? { vendorCode: payment.vendorCode, name: vendor.name } : { customer: "Enterprise customer" },
      },
    });
    await tx.paymentAllocation.deleteMany({ where: { paymentId: row.id } });
    if (payment.invoiceNumber) {
      const invoice = invoices.get(payment.invoiceNumber);
      if (invoice) {
        await tx.paymentAllocation.create({
          data: { paymentId: row.id, invoiceId: invoice.id, amount: payment.amount },
        });
      }
    }
    rows.set(payment.paymentNumber, row);
  }

  return rows;
}

async function seedExpenses(
  tx: SeedDb,
  organizationId: string,
  vendorRows: Map<string, { id: string }>,
) {
  const expenses = [
    { expenseNumber: "EXP-2026-0001", vendorCode: "V-TRAVEL", category: "Travel", amount: 48_500, gstAmount: 2_310, tdsAmount: 0, status: "SUBMITTED", receiptDocId: "receipt-mumbai-sales.pdf", description: "Mumbai sales leadership travel" },
    { expenseNumber: "EXP-2026-0002", vendorCode: "V-CLOUD", category: "Cloud Services", amount: 680_000, gstAmount: 103_729, tdsAmount: 68_000, status: "APPROVED", receiptDocId: "cloudserve-may.pdf", description: "Cloud infrastructure monthly commitment" },
    { expenseNumber: "EXP-2026-0003", vendorCode: "V-FACILITY", category: "Facilities", amount: 345_000, gstAmount: 52_627, tdsAmount: 34_500, status: "APPROVED", receiptDocId: "facilityworks-may.pdf", description: "Facility management services" },
    { expenseNumber: "EXP-2026-0004", vendorCode: "V-AUDIT", category: "Professional Fees", amount: 220_000, gstAmount: 33_559, tdsAmount: 22_000, status: "SUBMITTED", receiptDocId: null, description: "Internal audit readiness support" },
  ];
  const rows = new Map<string, Awaited<ReturnType<typeof tx.expense.upsert>>>();

  for (const expense of expenses) {
    const row = await tx.expense.upsert({
      where: { organizationId_expenseNumber: { organizationId, expenseNumber: expense.expenseNumber } },
      create: {
        organizationId,
        vendorId: vendorRows.get(expense.vendorCode)?.id ?? null,
        expenseNumber: expense.expenseNumber,
        category: expense.category,
        amount: expense.amount,
        expenseDate: daysAgo(expense.expenseNumber === "EXP-2026-0004" ? 32 : 6),
        description: expense.description,
        receiptDocId: expense.receiptDocId,
        gstAmount: expense.gstAmount,
        tdsAmount: expense.tdsAmount,
        status: expense.status,
        metadata: { vendorCode: expense.vendorCode, source: "enterprise_seed" },
      },
      update: {
        vendorId: vendorRows.get(expense.vendorCode)?.id ?? null,
        category: expense.category,
        amount: expense.amount,
        expenseDate: daysAgo(expense.expenseNumber === "EXP-2026-0004" ? 32 : 6),
        description: expense.description,
        receiptDocId: expense.receiptDocId,
        gstAmount: expense.gstAmount,
        tdsAmount: expense.tdsAmount,
        status: expense.status,
        metadata: { vendorCode: expense.vendorCode, source: "enterprise_seed" },
      },
    });
    rows.set(expense.expenseNumber, row);
  }

  return rows;
}

async function seedFinanceApprovals(params: {
  tx: SeedDb;
  organizationId: string;
  requesterId: string;
  financeApproverId: string;
  cfoApproverId: string;
  payments: Map<string, { id: string; amount: unknown }>;
  expenses: Map<string, { id: string; amount: unknown }>;
  invoices: Map<string, { id: string; totalAmount: unknown }>;
}) {
  const workflow = await params.tx.workflow.findFirstOrThrow({
    where: { organizationId: params.organizationId, slug: "vendor-payment", version: 1 },
  });
  const expenseWorkflow = await params.tx.workflow.findFirstOrThrow({
    where: { organizationId: params.organizationId, slug: "expense-claim", version: 1 },
  });
  const now = new Date();

  const approvals = [
    {
      key: "PAY-2026-0201",
      workflowId: workflow.id,
      title: "Vendor payment - TCS Ltd",
      description: "Quarterly services invoice linked to payment record PAY-2026-0201.",
      entityType: "payment",
      entityId: params.payments.get("PAY-2026-0201")?.id,
      amount: 1_250_000,
      status: "PENDING" as const,
      dueAt: hoursFromNow(3),
      assigneeId: params.cfoApproverId,
      priorityScore: 88,
    },
    {
      key: "PAY-2026-0202",
      workflowId: workflow.id,
      title: "Cloud services renewal payment",
      description: "CloudServe renewal payment linked to pending payment record.",
      entityType: "payment",
      entityId: params.payments.get("PAY-2026-0202")?.id,
      amount: 680_000,
      status: "PENDING" as const,
      dueAt: hoursFromNow(8),
      assigneeId: params.financeApproverId,
      priorityScore: 72,
    },
    {
      key: "EXP-2026-0001",
      workflowId: expenseWorkflow.id,
      title: "Expense claim - Mumbai travel",
      description: "Employee travel expense linked to expense record EXP-2026-0001.",
      entityType: "expense",
      entityId: params.expenses.get("EXP-2026-0001")?.id,
      amount: 48_500,
      status: "PENDING" as const,
      dueAt: daysFromNow(1),
      assigneeId: params.financeApproverId,
      priorityScore: 46,
    },
    {
      key: "AR-2026-0003",
      workflowId: workflow.id,
      title: "Invoice discount approval",
      description: "Discount approval linked to partially paid invoice AR-2026-0003.",
      entityType: "invoice",
      entityId: params.invoices.get("AR-2026-0003")?.id,
      amount: 1_475_000,
      status: "PENDING" as const,
      dueAt: hoursFromNow(4),
      assigneeId: params.cfoApproverId,
      priorityScore: 78,
    },
    {
      key: "PAY-2026-0101",
      workflowId: workflow.id,
      title: "Customer receipt reconciliation approved",
      description: "Approved reconciliation for customer receipt PAY-2026-0101.",
      entityType: "payment",
      entityId: params.payments.get("PAY-2026-0101")?.id,
      amount: 1_180_000,
      status: "APPROVED" as const,
      dueAt: daysAgo(2),
      assigneeId: params.financeApproverId,
      priorityScore: 38,
    },
    {
      key: "EXP-2026-0004",
      workflowId: expenseWorkflow.id,
      title: "Audit readiness expense rejected",
      description: "Rejected because supporting engagement letter was missing.",
      entityType: "expense",
      entityId: params.expenses.get("EXP-2026-0004")?.id,
      amount: 220_000,
      status: "REJECTED" as const,
      dueAt: daysAgo(1),
      assigneeId: params.financeApproverId,
      priorityScore: 64,
    },
  ];

  for (const item of approvals) {
    if (!item.entityId) continue;

    const existing = await params.tx.approval.findFirst({
      where: {
        organizationId: params.organizationId,
        entityType: item.entityType,
        entityId: item.entityId,
      },
      include: { execution: true, steps: true },
    });
    const execution =
      existing?.execution ??
      (await params.tx.workflowExecution.create({
        data: {
          organizationId: params.organizationId,
          workflowId: item.workflowId,
          status:
            item.status === "PENDING"
              ? "WAITING_APPROVAL"
              : item.status === "APPROVED"
                ? "COMPLETED"
                : "FAILED",
          priority: item.priorityScore,
          triggeredBy: params.requesterId,
          triggerSource: "finance_seed",
          startedAt: daysAgo(2),
          completedAt: item.status === "PENDING" ? null : daysAgo(1),
          context: {
            financeEntityType: item.entityType,
            financeEntityId: item.entityId,
            amountInr: item.amount,
            source: "enterprise_seed",
          },
        },
      }));

    const approval =
      existing ??
      (await params.tx.approval.create({
        data: {
          organizationId: params.organizationId,
          executionId: execution.id,
          requesterId: params.requesterId,
          title: item.title,
          description: item.description,
          entityType: item.entityType,
          entityId: item.entityId,
          status: item.status,
          dueAt: item.dueAt,
          completedAt: item.status === "PENDING" ? null : daysAgo(1),
          metadata: {
            amountInr: item.amount,
            priorityScore: item.priorityScore,
            financeRecordLinked: true,
            source: "enterprise_seed",
          },
        },
        include: { execution: true, steps: true },
      }));

    if (existing) {
      await params.tx.approval.update({
        where: { id: existing.id },
        data: {
          executionId: execution.id,
          title: item.title,
          description: item.description,
          status: item.status,
          dueAt: item.dueAt,
          completedAt: item.status === "PENDING" ? null : daysAgo(1),
          metadata: {
            amountInr: item.amount,
            priorityScore: item.priorityScore,
            financeRecordLinked: true,
            source: "enterprise_seed",
          },
        },
      });
      await params.tx.workflowExecution.update({
        where: { id: execution.id },
        data: {
          status:
            item.status === "PENDING"
              ? "WAITING_APPROVAL"
              : item.status === "APPROVED"
                ? "COMPLETED"
                : "FAILED",
          priority: item.priorityScore,
          completedAt: item.status === "PENDING" ? null : daysAgo(1),
          context: {
            financeEntityType: item.entityType,
            financeEntityId: item.entityId,
            amountInr: item.amount,
            source: "enterprise_seed",
          },
        },
      });
    }

    await params.tx.approvalStep.deleteMany({ where: { approvalId: approval.id } });
    await params.tx.approvalStep.create({
      data: {
        approvalId: approval.id,
        sequence: 1,
        assigneeId: item.assigneeId,
        status: item.status === "PENDING" ? "PENDING" : item.status,
        actedAt: item.status === "PENDING" ? null : daysAgo(1),
        comment:
          item.status === "APPROVED"
            ? "Approved after finance control checks"
            : item.status === "REJECTED"
              ? "Rejected due to missing finance documentation"
              : null,
        metadata: { financeEntityType: item.entityType, financeEntityId: item.entityId },
      },
    });

    await ensureApprovalHistory({
      tx: params.tx,
      organizationId: params.organizationId,
      actorUserId: item.status === "PENDING" ? params.requesterId : item.assigneeId,
      approvalId: approval.id,
      executionId: execution.id,
      title: item.title,
      status: item.status,
      amount: item.amount,
      now,
    });
  }
}

async function ensureApprovalHistory(params: {
  tx: SeedDb;
  organizationId: string;
  actorUserId: string;
  approvalId: string;
  executionId: string;
  title: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  amount: number;
  now: Date;
}) {
  const action =
    params.status === "APPROVED"
      ? "approval.approve"
      : params.status === "REJECTED"
        ? "approval.reject"
        : "approval.create";
  const existingAudit = await params.tx.auditLog.findFirst({
    where: { organizationId: params.organizationId, action, resource: "approval", resourceId: params.approvalId },
  });
  if (!existingAudit) {
    await params.tx.auditLog.create({
      data: {
        organizationId: params.organizationId,
        userId: params.actorUserId,
        action,
        resource: "approval",
        resourceId: params.approvalId,
        severity: params.status === "REJECTED" ? "WARNING" : "INFO",
        after: {
          status: params.status,
          amountInr: params.amount,
          financeRecordLinked: true,
        },
        metadata: {
          approvalTitle: params.title,
          source: "enterprise_seed",
        },
        correlationId: params.executionId,
      },
    });
  }

  const existingActivity = await params.tx.activityLog.findFirst({
    where: {
      organizationId: params.organizationId,
      entityType: "approval",
      entityId: params.approvalId,
      activityType:
        params.status === "APPROVED"
          ? "APPROVE"
          : params.status === "REJECTED"
            ? "REJECT"
            : "CREATE",
    },
  });
  if (!existingActivity) {
    await params.tx.activityLog.create({
      data: {
        organizationId: params.organizationId,
        userId: params.actorUserId,
        activityType:
          params.status === "APPROVED"
            ? "APPROVE"
            : params.status === "REJECTED"
              ? "REJECT"
              : "CREATE",
        entityType: "approval",
        entityId: params.approvalId,
        description:
          params.status === "PENDING"
            ? `Finance approval submitted: ${params.title}`
            : `Finance approval ${params.status.toLowerCase()}: ${params.title}`,
        metadata: {
          workflowState: params.status,
          amountInr: params.amount,
          source: "enterprise_seed",
        },
      },
    });
  }
}

function vendorName(vendorsByCode: Map<string, { id: string; name: string }>, vendorId: string) {
  return [...vendorsByCode.values()].find((vendor) => vendor.id === vendorId)?.name ?? "Vendor";
}

function daysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

function daysFromNow(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

function hoursFromNow(hours: number): Date {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}
