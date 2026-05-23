import { prisma } from "@/lib/db/prisma";
import { getOperationsDashboard } from "@/lib/workflows/queries";
import type { FinanceAnomalyAlert } from "@/lib/workflows/types";

const OPEN_INVOICE_STATUSES = ["ISSUED", "SENT", "OVERDUE", "PARTIALLY_PAID"] as const;
const PENDING_PAYMENT_STATUSES = ["PENDING", "PROCESSING"] as const;
const FINANCE_APPROVAL_ENTITY_TYPES = ["invoice", "expense", "payment", "procurement"] as const;

export interface FinanceDashboardData {
  kpis: {
    revenueMtd: number;
    expensesMtd: number;
    netPositionMtd: number;
    outstandingInvoices: number;
    overdueInvoices: number;
    pendingPayments: number;
    budgetUtilization: number;
  };
  gstSummary: {
    taxableAmount: number;
    outputGstAmount: number;
    inputGstAmount: number;
    cgstAmount: number;
    sgstAmount: number;
    igstAmount: number;
    cessAmount: number;
    tdsAmount: number;
    netLiability: number;
    activeConfigurations: number;
  };
  outstandingInvoices: Array<{
    id: string;
    invoiceNumber: string;
    buyerName: string;
    status: string;
    dueAt: string | null;
    totalAmount: number;
    paidAmount: number;
    balanceAmount: number;
  }>;
  outstandingPayments: {
    amount: number;
    count: number;
    overdueAmount: number;
    overdueCount: number;
    records: Array<{
      id: string;
      paymentNumber: string;
      vendorName: string;
      status: string;
      method: string;
      amount: number;
      updatedAt: string;
    }>;
  };
  expenseAnalytics: {
    totalMtd: number;
    gstInputMtd: number;
    tdsMtd: number;
    categories: Array<{
      category: string;
      amount: number;
      count: number;
      share: number;
    }>;
  };
  budgetTracking: {
    allocated: number;
    consumed: number;
    remaining: number;
    utilization: number;
    overBudgetCount: number;
    budgets: Array<{
      id: string;
      name: string;
      category: string;
      departmentName: string;
      allocated: number;
      consumed: number;
      utilization: number;
      remaining: number;
    }>;
  };
  vendors: Array<{
    id: string;
    code: string;
    name: string;
    gstin: string | null;
    status: string;
    paymentTermsDays: number;
    outstandingInvoices: number;
    pendingPayments: number;
    expensesMtd: number;
  }>;
  financeApprovalHistory: Array<{
    id: string;
    title: string;
    entityType: string;
    status: string;
    amount: number;
    dueAt: string | null;
    completedAt: string | null;
    requesterName: string;
    assigneeName: string;
    workflowName: string;
  }>;
  enterpriseWidgets: Array<{
    id: string;
    label: string;
    value: string;
    detail: string;
    severity: "low" | "medium" | "high" | "critical";
  }>;
  financeAnomalies: FinanceAnomalyAlert[];
}

export async function getFinanceDashboard(
  organizationId: string,
): Promise<FinanceDashboardData> {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const [
    paidInvoicesMtd,
    expensesMtd,
    previousExpenses,
    openInvoices,
    pendingPaymentAgg,
    pendingPaymentRows,
    gstInvoiceAgg,
    expenseTaxAgg,
    activeTaxConfigurations,
    expenseRows,
    vendorRows,
    vendorExpenseRows,
    vendorPaymentRows,
    budgetRows,
    financeApprovalRows,
    operationsDashboard,
  ] = await Promise.all([
    prisma.invoice.aggregate({
      where: { organizationId, status: "PAID", issueDate: { gte: monthStart } },
      _sum: { totalAmount: true },
    }),
    prisma.expense.aggregate({
      where: { organizationId, deletedAt: null, expenseDate: { gte: monthStart } },
      _sum: { amount: true, gstAmount: true, tdsAmount: true },
    }),
    prisma.expense.aggregate({
      where: {
        organizationId,
        deletedAt: null,
        expenseDate: { gte: previousMonthStart, lt: monthStart },
      },
      _sum: { amount: true },
    }),
    prisma.invoice.findMany({
      where: { organizationId, status: { in: [...OPEN_INVOICE_STATUSES] } },
      select: {
        id: true,
        vendorId: true,
        invoiceNumber: true,
        status: true,
        dueDate: true,
        issueDate: true,
        totalAmount: true,
        buyerDetails: true,
        payments: { select: { amount: true } },
        vendor: { select: { name: true } },
      },
      orderBy: [{ dueDate: "asc" }, { issueDate: "desc" }],
    }),
    prisma.payment.aggregate({
      where: { organizationId, status: { in: [...PENDING_PAYMENT_STATUSES] } },
      _sum: { amount: true },
      _count: { id: true },
    }),
    prisma.payment.findMany({
      where: { organizationId, status: { in: [...PENDING_PAYMENT_STATUSES] } },
      select: {
        id: true,
        vendorId: true,
        paymentNumber: true,
        status: true,
        method: true,
        amount: true,
        updatedAt: true,
        vendor: { select: { name: true } },
      },
      orderBy: [{ amount: "desc" }, { updatedAt: "desc" }],
      take: 8,
    }),
    prisma.invoice.aggregate({
      where: { organizationId, issueDate: { gte: monthStart } },
      _sum: {
        taxableAmount: true,
        cgstAmount: true,
        sgstAmount: true,
        igstAmount: true,
        cessAmount: true,
        tdsAmount: true,
      },
    }),
    prisma.expense.aggregate({
      where: { organizationId, deletedAt: null, expenseDate: { gte: monthStart } },
      _sum: { gstAmount: true, tdsAmount: true },
    }),
    prisma.taxConfiguration.count({
      where: {
        organizationId,
        isActive: true,
        effectiveFrom: { lte: now },
        OR: [{ effectiveTo: null }, { effectiveTo: { gte: now } }],
      },
    }),
    prisma.expense.findMany({
      where: { organizationId, deletedAt: null, expenseDate: { gte: monthStart } },
      select: { category: true, amount: true },
      orderBy: { expenseDate: "desc" },
      take: 500,
    }),
    prisma.vendor.findMany({
      where: { organizationId, deletedAt: null },
      select: {
        id: true,
        code: true,
        name: true,
        gstin: true,
        status: true,
        paymentTermsDays: true,
      },
      orderBy: [{ status: "asc" }, { name: "asc" }],
      take: 20,
    }),
    prisma.expense.groupBy({
      by: ["vendorId"],
      where: {
        organizationId,
        deletedAt: null,
        vendorId: { not: null },
        expenseDate: { gte: monthStart },
      },
      _sum: { amount: true },
    }),
    prisma.payment.groupBy({
      by: ["vendorId"],
      where: {
        organizationId,
        vendorId: { not: null },
        status: { in: [...PENDING_PAYMENT_STATUSES] },
      },
      _sum: { amount: true },
    }),
    prisma.budget.findMany({
      where: { organizationId },
      include: { department: { select: { name: true } } },
      orderBy: [{ updatedAt: "desc" }, { name: "asc" }],
      take: 12,
    }),
    prisma.approval.findMany({
      where: {
        organizationId,
        entityType: { in: [...FINANCE_APPROVAL_ENTITY_TYPES] },
      },
      select: {
        id: true,
        title: true,
        entityType: true,
        status: true,
        dueAt: true,
        completedAt: true,
        metadata: true,
        requester: { select: { firstName: true, lastName: true, email: true } },
        execution: { select: { workflow: { select: { name: true } } } },
        steps: {
          select: {
            assignee: { select: { firstName: true, lastName: true, email: true } },
          },
          orderBy: { sequence: "asc" },
          take: 1,
        },
      },
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
      take: 8,
    }),
    getOperationsDashboard(organizationId),
  ]);

  const revenueMtd = decimalToNumber(paidInvoicesMtd._sum.totalAmount);
  const expensesMtdAmount = decimalToNumber(expensesMtd._sum.amount);
  const expenseCategories = buildExpenseCategories(expenseRows);
  const budgetTracking = buildBudgetTracking(budgetRows);
  const invoiceBalances = openInvoices.map((invoice) => {
    const paidAmount = invoice.payments.reduce(
      (sum, allocation) => sum + decimalToNumber(allocation.amount),
      0,
    );
    const totalAmount = decimalToNumber(invoice.totalAmount);
    const balanceAmount = Math.max(0, totalAmount - paidAmount);

    return {
      ...invoice,
      totalAmount,
      paidAmount,
      balanceAmount,
    };
  });
  const overdueInvoiceBalances = invoiceBalances.filter(
    (invoice) => invoice.dueDate && invoice.dueDate < now && invoice.balanceAmount > 0,
  );
  const vendorOutstandingInvoices = buildVendorOutstandingMap(invoiceBalances);
  const vendorPendingPayments = new Map(
    vendorPaymentRows.map((row) => [row.vendorId, decimalToNumber(row._sum.amount)]),
  );
  const vendorExpenses = new Map(
    vendorExpenseRows.map((row) => [row.vendorId, decimalToNumber(row._sum.amount)]),
  );
  const outputGstAmount =
    decimalToNumber(gstInvoiceAgg._sum.cgstAmount) +
    decimalToNumber(gstInvoiceAgg._sum.sgstAmount) +
    decimalToNumber(gstInvoiceAgg._sum.igstAmount) +
    decimalToNumber(gstInvoiceAgg._sum.cessAmount);
  const inputGstAmount = decimalToNumber(expenseTaxAgg._sum.gstAmount);
  const gstSummary = {
    taxableAmount: decimalToNumber(gstInvoiceAgg._sum.taxableAmount),
    outputGstAmount,
    inputGstAmount,
    cgstAmount: decimalToNumber(gstInvoiceAgg._sum.cgstAmount),
    sgstAmount: decimalToNumber(gstInvoiceAgg._sum.sgstAmount),
    igstAmount: decimalToNumber(gstInvoiceAgg._sum.igstAmount),
    cessAmount: decimalToNumber(gstInvoiceAgg._sum.cessAmount),
    tdsAmount:
      decimalToNumber(gstInvoiceAgg._sum.tdsAmount) +
      decimalToNumber(expenseTaxAgg._sum.tdsAmount),
    netLiability: Math.max(0, outputGstAmount - inputGstAmount),
    activeConfigurations: activeTaxConfigurations,
  };
  const overduePaymentInvoices = overdueInvoiceBalances.filter((invoice) => invoice.vendorId);

  return {
    kpis: {
      revenueMtd,
      expensesMtd: expensesMtdAmount,
      netPositionMtd: revenueMtd - expensesMtdAmount,
      outstandingInvoices: invoiceBalances.reduce(
        (sum, invoice) => sum + invoice.balanceAmount,
        0,
      ),
      overdueInvoices: overdueInvoiceBalances.length,
      pendingPayments: pendingPaymentAgg._count.id,
      budgetUtilization: budgetTracking.utilization,
    },
    gstSummary,
    outstandingInvoices: invoiceBalances.slice(0, 8).map((invoice) => ({
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      buyerName: invoice.vendor?.name ?? buyerNameFromDetails(invoice.buyerDetails),
      status: invoice.status,
      dueAt: invoice.dueDate?.toISOString() ?? null,
      totalAmount: invoice.totalAmount,
      paidAmount: invoice.paidAmount,
      balanceAmount: invoice.balanceAmount,
    })),
    outstandingPayments: {
      amount: decimalToNumber(pendingPaymentAgg._sum.amount),
      count: pendingPaymentAgg._count.id,
      overdueAmount: overduePaymentInvoices.reduce(
        (sum, invoice) => sum + invoice.balanceAmount,
        0,
      ),
      overdueCount: overduePaymentInvoices.length,
      records: pendingPaymentRows.map((payment) => ({
        id: payment.id,
        paymentNumber: payment.paymentNumber,
        vendorName: payment.vendor?.name ?? "Unassigned party",
        status: payment.status,
        method: payment.method,
        amount: decimalToNumber(payment.amount),
        updatedAt: payment.updatedAt.toISOString(),
      })),
    },
    expenseAnalytics: {
      totalMtd: expensesMtdAmount,
      gstInputMtd: decimalToNumber(expensesMtd._sum.gstAmount),
      tdsMtd: decimalToNumber(expensesMtd._sum.tdsAmount),
      categories: expenseCategories,
    },
    budgetTracking,
    vendors: vendorRows.map((vendor) => ({
      id: vendor.id,
      code: vendor.code,
      name: vendor.name,
      gstin: vendor.gstin,
      status: vendor.status,
      paymentTermsDays: vendor.paymentTermsDays,
      outstandingInvoices: vendorOutstandingInvoices.get(vendor.id) ?? 0,
      pendingPayments: vendorPendingPayments.get(vendor.id) ?? 0,
      expensesMtd: vendorExpenses.get(vendor.id) ?? 0,
    })),
    financeApprovalHistory: financeApprovalRows.map((approval) => ({
      id: approval.id,
      title: approval.title,
      entityType: approval.entityType,
      status: approval.status,
      amount: amountFromMetadata(approval.metadata),
      dueAt: approval.dueAt?.toISOString() ?? null,
      completedAt: approval.completedAt?.toISOString() ?? null,
      requesterName: userName(approval.requester),
      assigneeName: userName(approval.steps[0]?.assignee),
      workflowName: approval.execution?.workflow.name ?? "Finance workflow",
    })),
    enterpriseWidgets: buildEnterpriseWidgets({
      overdueCount: overdueInvoiceBalances.length,
      overdueAmount: overdueInvoiceBalances.reduce(
        (sum, invoice) => sum + invoice.balanceAmount,
        0,
      ),
      previousExpenses: decimalToNumber(previousExpenses._sum.amount),
      expensesMtd: expensesMtdAmount,
      gstLiability: gstSummary.netLiability,
      pendingPaymentAmount: decimalToNumber(pendingPaymentAgg._sum.amount),
      pendingPayments: pendingPaymentAgg._count.id,
      budgetUtilization: budgetTracking.utilization,
      anomalyCount: operationsDashboard.intelligence.financeAnomalies.length,
      vendorCount: vendorRows.length,
    }),
    financeAnomalies: operationsDashboard.intelligence.financeAnomalies,
  };
}

function buildExpenseCategories(
  expenses: Array<{ category: string; amount: unknown }>,
): FinanceDashboardData["expenseAnalytics"]["categories"] {
  const total = expenses.reduce((sum, expense) => sum + decimalToNumber(expense.amount), 0);
  const map = new Map<string, { amount: number; count: number }>();

  for (const expense of expenses) {
    const current = map.get(expense.category) ?? { amount: 0, count: 0 };
    current.amount += decimalToNumber(expense.amount);
    current.count += 1;
    map.set(expense.category, current);
  }

  return [...map.entries()]
    .map(([category, value]) => ({
      category,
      amount: value.amount,
      count: value.count,
      share: total > 0 ? Math.round((value.amount / total) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 6);
}

function buildBudgetTracking(
  budgets: Array<{
    id: string;
    name: string;
    category: string;
    allocated: unknown;
    consumed: unknown;
    department: { name: string } | null;
  }>,
): FinanceDashboardData["budgetTracking"] {
  const budgetItems = budgets.map((budget) => {
    const allocated = decimalToNumber(budget.allocated);
    const consumed = decimalToNumber(budget.consumed);

    return {
      id: budget.id,
      name: budget.name,
      category: budget.category,
      departmentName: budget.department?.name ?? "Organization",
      allocated,
      consumed,
      utilization: allocated > 0 ? Math.round((consumed / allocated) * 100) : 0,
      remaining: allocated - consumed,
    };
  });
  const allocated = budgetItems.reduce((sum, budget) => sum + budget.allocated, 0);
  const consumed = budgetItems.reduce((sum, budget) => sum + budget.consumed, 0);

  return {
    allocated,
    consumed,
    remaining: allocated - consumed,
    utilization: allocated > 0 ? Math.round((consumed / allocated) * 100) : 0,
    overBudgetCount: budgetItems.filter((budget) => budget.consumed > budget.allocated).length,
    budgets: budgetItems,
  };
}

function buildVendorOutstandingMap(
  invoices: Array<{ vendorId: string | null; balanceAmount: number }>,
): Map<string, number> {
  const map = new Map<string, number>();
  for (const invoice of invoices) {
    if (!invoice.vendorId || invoice.balanceAmount <= 0) continue;
    map.set(invoice.vendorId, (map.get(invoice.vendorId) ?? 0) + invoice.balanceAmount);
  }
  return map;
}

function buildEnterpriseWidgets(params: {
  overdueCount: number;
  overdueAmount: number;
  previousExpenses: number;
  expensesMtd: number;
  gstLiability: number;
  pendingPaymentAmount: number;
  pendingPayments: number;
  budgetUtilization: number;
  anomalyCount: number;
  vendorCount: number;
}): FinanceDashboardData["enterpriseWidgets"] {
  const expenseChange =
    params.previousExpenses > 0
      ? Math.round(((params.expensesMtd - params.previousExpenses) / params.previousExpenses) * 100)
      : 0;

  return [
    {
      id: "collections-risk",
      label: "Collections risk",
      value: formatShortCurrency(params.overdueAmount),
      detail: `${params.overdueCount} overdue invoice${params.overdueCount === 1 ? "" : "s"}`,
      severity: params.overdueCount > 5 ? "high" : params.overdueCount > 0 ? "medium" : "low",
    },
    {
      id: "expense-velocity",
      label: "Expense velocity",
      value: `${expenseChange >= 0 ? "+" : ""}${expenseChange}%`,
      detail: "Compared with previous month",
      severity: expenseChange > 20 ? "high" : expenseChange > 5 ? "medium" : "low",
    },
    {
      id: "gst-liability",
      label: "GST liability",
      value: formatShortCurrency(params.gstLiability),
      detail: "Output GST less input GST credit",
      severity: params.gstLiability > 1_000_000 ? "medium" : "low",
    },
    {
      id: "payment-control",
      label: "Payment control",
      value: formatShortCurrency(params.pendingPaymentAmount),
      detail: `${params.pendingPayments} payment${params.pendingPayments === 1 ? "" : "s"} pending release`,
      severity: params.pendingPayments > 5 ? "high" : params.pendingPayments > 0 ? "medium" : "low",
    },
    {
      id: "budget-control",
      label: "Budget control",
      value: `${params.budgetUtilization}%`,
      detail: `${params.vendorCount} active vendor record${params.vendorCount === 1 ? "" : "s"}`,
      severity: params.budgetUtilization > 95 ? "critical" : params.budgetUtilization > 80 ? "medium" : "low",
    },
    {
      id: "approval-control",
      label: "Finance controls",
      value: String(params.anomalyCount),
      detail: "AI anomaly signals linked to approvals",
      severity: params.anomalyCount > 2 ? "high" : params.anomalyCount > 0 ? "medium" : "low",
    },
  ];
}

function buyerNameFromDetails(value: unknown): string {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return "Unassigned buyer";
  }

  const record = value as Record<string, unknown>;
  const name = record.name ?? record.legalName ?? record.companyName;
  return typeof name === "string" && name.length > 0 ? name : "Unassigned buyer";
}

function amountFromMetadata(value: unknown): number {
  if (!value || typeof value !== "object" || Array.isArray(value)) return 0;
  const amount = (value as Record<string, unknown>).amountInr;
  return decimalToNumber(amount);
}

function userName(
  user: { firstName: string | null; lastName: string | null; email: string } | null | undefined,
): string {
  if (!user) return "Unassigned";
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ");
  return fullName || user.email;
}

function decimalToNumber(value: unknown): number {
  if (value == null) return 0;
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value) || 0;
  if (typeof value === "object" && "toString" in value) {
    const parsed = Number(value.toString());
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function formatShortCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
    notation: "compact",
  }).format(amount);
}
