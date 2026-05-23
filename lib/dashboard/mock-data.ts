import type { SystemRoleSlug } from "@/lib/auth/constants";

export interface DashboardUser {
  name: string;
  email: string;
  role: SystemRoleSlug;
  organization: string;
  avatarInitials: string;
}

export const demoUsers: Record<SystemRoleSlug, DashboardUser> = {
  "super-admin": {
    name: "Priya Sharma",
    email: "superadmin@platform.local",
    role: "super-admin",
    organization: "AI ERP Platform",
    avatarInitials: "PS",
  },
  "organization-admin": {
    name: "Rajiv Mehta",
    email: "admin@acme-india.local",
    role: "organization-admin",
    organization: "Acme India Pvt Ltd",
    avatarInitials: "RM",
  },
  manager: {
    name: "Meera Rao",
    email: "manager@acme-india.local",
    role: "manager",
    organization: "Acme India Pvt Ltd",
    avatarInitials: "MR",
  },
  cfo: {
    name: "Anita Desai",
    email: "cfo@acme-india.local",
    role: "cfo",
    organization: "Acme India Pvt Ltd",
    avatarInitials: "AD",
  },
  "finance-manager": {
    name: "Vikram Patel",
    email: "finance@acme-india.local",
    role: "finance-manager",
    organization: "Acme India Pvt Ltd",
    avatarInitials: "VP",
  },
  auditor: {
    name: "Kavita Nair",
    email: "auditor@acme-india.local",
    role: "auditor",
    organization: "Acme India Pvt Ltd",
    avatarInitials: "KN",
  },
  employee: {
    name: "Arjun Singh",
    email: "employee@acme-india.local",
    role: "employee",
    organization: "Acme India Pvt Ltd",
    avatarInitials: "AS",
  },
  "ai-agent": {
    name: "ERP Assistant",
    email: "agent@acme-india.local",
    role: "ai-agent",
    organization: "Acme India Pvt Ltd",
    avatarInitials: "AI",
  },
};

export const workflowStats = {
  active: 24,
  pending: 8,
  completedToday: 42,
  failed: 2,
  avgCompletionMins: 18,
};

export const financeSummary = {
  revenueMtd: 28475000,
  expensesMtd: 19230000,
  outstandingInvoices: 4560000,
  pendingPayments: 12,
  gstLiability: 2145000,
  budgetUtilization: 68,
};

export const approvals = [
  {
    id: "1",
    title: "Vendor payment — TCS Ltd",
    type: "Payment",
    amount: 1250000,
    requester: "Vikram Patel",
    priority: "high" as const,
    dueIn: "2h",
  },
  {
    id: "2",
    title: "Expense claim — Mumbai travel",
    type: "Expense",
    amount: 48500,
    requester: "Arjun Singh",
    priority: "medium" as const,
    dueIn: "1d",
  },
  {
    id: "3",
    title: "Purchase order — IT equipment",
    type: "Procurement",
    amount: 890000,
    requester: "IT Department",
    priority: "low" as const,
    dueIn: "3d",
  },
  {
    id: "4",
    title: "Invoice discount approval",
    type: "Invoice",
    amount: 320000,
    requester: "Sales Team",
    priority: "medium" as const,
    dueIn: "6h",
  },
];

export const auditAlerts = [
  {
    id: "1",
    severity: "critical" as const,
    message: "3 failed login attempts from unusual IP (Mumbai → Singapore)",
    time: "12 min ago",
  },
  {
    id: "2",
    severity: "warning" as const,
    message: "GST return filing due in 5 days — Q4 FY25-26",
    time: "1h ago",
  },
  {
    id: "3",
    severity: "info" as const,
    message: "Role permissions updated for Finance Manager",
    time: "3h ago",
  },
  {
    id: "4",
    severity: "warning" as const,
    message: "Workflow execution timeout — Payroll processing",
    time: "5h ago",
  },
];

export const notifications = [
  {
    id: "1",
    title: "Approval required",
    body: "Vendor payment pending your sign-off",
    time: "10m",
    unread: true,
  },
  {
    id: "2",
    title: "AI workflow completed",
    body: "Invoice reconciliation finished with 98% match",
    time: "1h",
    unread: true,
  },
  {
    id: "3",
    title: "Compliance reminder",
    body: "TDS filing deadline approaching",
    time: "2h",
    unread: false,
  },
];

export const aiSuggestions = [
  "Summarize pending approvals for this week",
  "Forecast cash flow for Q1 FY26",
  "Draft GST reconciliation report",
  "Identify overdue invoices > ₹1L",
];

export function formatInr(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}
