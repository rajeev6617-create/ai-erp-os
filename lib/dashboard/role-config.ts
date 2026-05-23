import type { SystemRoleSlug } from "@/lib/auth/constants";

export interface RoleDashboardConfig {
  greeting: string;
  subtitle: string;
  showFinance: boolean;
  showApprovals: boolean;
  showWorkflows: boolean;
  showAudit: boolean;
  showAiPanel: boolean;
  kpiHighlight?: string;
}

export const roleDashboardConfig: Record<SystemRoleSlug, RoleDashboardConfig> = {
  "super-admin": {
    greeting: "Platform overview",
    subtitle: "Cross-tenant health, security, and system operations",
    showFinance: true,
    showApprovals: true,
    showWorkflows: true,
    showAudit: true,
    showAiPanel: true,
    kpiHighlight: "12 tenants active",
  },
  "organization-admin": {
    greeting: "Organization command center",
    subtitle: "Users, workflows, and operational metrics for your tenant",
    showFinance: true,
    showApprovals: true,
    showWorkflows: true,
    showAudit: true,
    showAiPanel: true,
    kpiHighlight: "156 users active",
  },
  manager: {
    greeting: "Manager workspace",
    subtitle: "Approvals, team workflows, and operating exceptions",
    showFinance: true,
    showApprovals: true,
    showWorkflows: true,
    showAudit: false,
    showAiPanel: true,
  },
  cfo: {
    greeting: "Financial command center",
    subtitle: "Revenue, compliance, and cash position at a glance",
    showFinance: true,
    showApprovals: true,
    showWorkflows: false,
    showAudit: true,
    showAiPanel: true,
    kpiHighlight: "FY25-26 Q4 close in 12 days",
  },
  "finance-manager": {
    greeting: "Finance operations",
    subtitle: "Invoices, payments, and day-to-day financial workflows",
    showFinance: true,
    showApprovals: true,
    showWorkflows: true,
    showAudit: false,
    showAiPanel: true,
  },
  auditor: {
    greeting: "Audit & compliance view",
    subtitle: "Controls, evidence, and regulatory readiness",
    showFinance: true,
    showApprovals: false,
    showWorkflows: false,
    showAudit: true,
    showAiPanel: false,
  },
  employee: {
    greeting: "Your workspace",
    subtitle: "Tasks, expenses, and requests that need your attention",
    showFinance: false,
    showApprovals: true,
    showWorkflows: true,
    showAudit: false,
    showAiPanel: true,
  },
  "ai-agent": {
    greeting: "AI operations hub",
    subtitle: "Agent runs, automations, and workflow orchestration",
    showFinance: false,
    showApprovals: false,
    showWorkflows: true,
    showAudit: false,
    showAiPanel: true,
    kpiHighlight: "8 agents active",
  },
};

export function roleLabel(slug: SystemRoleSlug): string {
  if (slug === "cfo") return "CFO";
  if (slug === "finance-manager") return "Manager";
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
