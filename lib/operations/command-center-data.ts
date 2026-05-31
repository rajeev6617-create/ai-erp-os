import { getOperationModuleDashboard } from "@/lib/operations/data";
import type {
  OperationFinanceImpact,
  OperationModuleDashboardData,
  OperationRecord,
  OperationRiskAlert,
} from "@/lib/operations/types";
import { getCrmDashboard, getSrmDashboard } from "@/lib/relationships/data";
import type {
  RelationshipAiInsightView,
  RelationshipAuditView,
} from "@/lib/relationships/types";
import { getInventoryDashboard, getProductionDashboard } from "@/lib/supply-chain/data";
import type {
  SupplyChainAiAlertView,
  SupplyChainAuditView,
} from "@/lib/supply-chain/types";

export type EnterpriseSignalSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type CommandCenterModuleStatus = "healthy" | "watch" | "attention";

export interface CommandCenterModuleSummary {
  slug: string;
  label: string;
  description: string;
  href: string;
  openItems: number;
  pendingApprovals: number;
  highRiskAlerts: number;
  financeExposure: number;
  status: CommandCenterModuleStatus;
}

export interface CommandCenterSignal {
  id: string;
  module: string;
  title: string;
  description: string;
  severity: EnterpriseSignalSeverity;
  signalType: string;
  confidence: number | null;
  recommendedAction: string;
  href: string;
  source: string;
}

export interface CommandCenterApproval {
  id: string;
  module: string;
  reference: string;
  title: string;
  ownerRole: string | null;
  amount: number | null;
  dueAt: string | null;
  href: string;
}

export interface CommandCenterFinanceImpact {
  id: string;
  module: string;
  title: string;
  impactType: string;
  amount: number;
  direction: string;
  period: string | null;
  href: string;
}

export interface CommandCenterAuditEvent {
  id: string;
  module: string;
  action: string;
  severity: string;
  createdAt: string;
  reference: string | null;
  href: string;
}

export interface CommandCenterJourney {
  id: string;
  title: string;
  description: string;
  href: string;
  status: CommandCenterModuleStatus;
  controlCount: number;
}

export interface OperationsCommandCenterData {
  summary: {
    connectedModules: number;
    openControls: number;
    pendingApprovals: number;
    highRiskAlerts: number;
    financeExposure: number;
    auditEvents: number;
  };
  modules: CommandCenterModuleSummary[];
  signals: CommandCenterSignal[];
  approvals: CommandCenterApproval[];
  financeImpacts: CommandCenterFinanceImpact[];
  auditEvents: CommandCenterAuditEvent[];
  journeys: CommandCenterJourney[];
}

export async function getOperationsCommandCenterData(
  organizationId: string,
): Promise<OperationsCommandCenterData> {
  const [p2p, otc, r2r, users, crm, srm, inventory, production] = await Promise.all([
    getOperationModuleDashboard(organizationId, "p2p"),
    getOperationModuleDashboard(organizationId, "otc"),
    getOperationModuleDashboard(organizationId, "r2r"),
    getOperationModuleDashboard(organizationId, "users"),
    getCrmDashboard(organizationId),
    getSrmDashboard(organizationId),
    getInventoryDashboard(organizationId),
    getProductionDashboard(organizationId),
  ]);

  const operationModules = [
    { slug: "p2p", label: "P2P", href: "/dashboard/operations/p2p", data: p2p },
    { slug: "otc", label: "OTC", href: "/dashboard/operations/otc", data: otc },
    { slug: "r2r", label: "R2R", href: "/dashboard/operations/r2r", data: r2r },
    { slug: "users", label: "User Operations", href: "/dashboard/operations/users", data: users },
  ];

  const signals = [
    ...operationModules.flatMap((item) =>
      item.data
        ? item.data.riskAlerts.map((alert) =>
            operationSignal(item.label, item.href, alert),
          )
        : [],
    ),
    ...crm.insights.map((insight) =>
      relationshipSignal("CRM", "/dashboard/operations/crm", insight),
    ),
    ...srm.insights.map((insight) =>
      relationshipSignal("SRM", "/dashboard/operations/srm", insight),
    ),
    ...inventory.alerts.map((alert) =>
      supplyChainSignal("Inventory", "/dashboard/operations/inventory", alert),
    ),
    ...production.alerts.map((alert) =>
      supplyChainSignal("Production", "/dashboard/operations/production", alert),
    ),
  ].sort(signalSort);

  const approvals = [
    ...operationModules.flatMap((item) =>
      item.data
        ? item.data.records
            .filter((record) => record.status === "WAITING_APPROVAL")
            .map((record) => operationApproval(item.label, item.href, record))
        : [],
    ),
    ...srm.onboardings
      .filter((item) => item.status === "UNDER_REVIEW")
      .map((item) => ({
        id: item.id,
        module: "SRM",
        reference: item.onboardingNumber,
        title: `${item.supplierName} onboarding review`,
        ownerRole: "auditor",
        amount: null,
        dueAt: item.submittedAt,
        href: "/dashboard/operations/srm",
      })),
  ].sort((left, right) => compareIso(left.dueAt, right.dueAt));

  const financeImpacts = operationModules
    .flatMap((item) =>
      item.data
        ? item.data.financeImpacts.map((impact) =>
            financeImpact(item.label, item.href, impact),
          )
        : [],
    )
    .sort((left, right) => Math.abs(right.amount) - Math.abs(left.amount));

  const auditEvents = [
    ...operationModules.flatMap((item) =>
      item.data
        ? item.data.auditEvents.map((event) => ({
            id: event.id,
            module: item.label,
            action: event.action,
            severity: event.severity,
            createdAt: event.createdAt,
            reference: event.recordReference,
            href: item.href,
          }))
        : [],
    ),
    ...crm.auditLogs.map((event) =>
      relationshipAudit("CRM", "/dashboard/operations/crm", event),
    ),
    ...srm.auditLogs.map((event) =>
      relationshipAudit("SRM", "/dashboard/operations/srm", event),
    ),
    ...inventory.auditLogs.map((event) =>
      supplyChainAudit("Inventory", "/dashboard/operations/inventory", event),
    ),
    ...production.auditLogs.map((event) =>
      supplyChainAudit("Production", "/dashboard/operations/production", event),
    ),
  ].sort((left, right) => compareIso(right.createdAt, left.createdAt));

  const modules = [
    operationSummary("p2p", "P2P Procure-to-Pay", "/dashboard/operations/p2p", p2p),
    operationSummary("otc", "OTC Order-to-Cash", "/dashboard/operations/otc", otc),
    operationSummary("r2r", "R2R Record-to-Report", "/dashboard/operations/r2r", r2r),
    relationshipSummary(
      "crm",
      "CRM Customer Operations",
      "/dashboard/operations/crm",
      "Customers, leads, pipeline, payment risk, and profitability.",
      crm.leads.filter((lead) => !["CONVERTED", "LOST"].includes(lead.status)).length +
        crm.tickets.filter((ticket) => !["RESOLVED", "CLOSED"].includes(ticket.status)).length,
      0,
      crm.insights.filter((insight) => isEscalated(insight.severity)).length,
      crm.customers.reduce((sum, customer) => sum + customer.outstandingAmount, 0),
    ),
    relationshipSummary(
      "srm",
      "SRM Supplier Operations",
      "/dashboard/operations/srm",
      "Vendor onboarding, quotations, delivery performance, and compliance.",
      srm.onboardings.filter((item) => !["APPROVED", "REJECTED"].includes(item.status)).length +
        srm.tickets.filter((ticket) => !["RESOLVED", "CLOSED"].includes(ticket.status)).length,
      srm.onboardings.filter((item) => item.status === "UNDER_REVIEW").length,
      srm.insights.filter((insight) => isEscalated(insight.severity)).length,
      p2p?.financeSummary.outflow ?? 0,
    ),
    relationshipSummary(
      "inventory",
      "Inventory & Warehouse",
      "/dashboard/operations/inventory",
      "Warehouse stock, GRNs, dispatches, reorder controls, and valuation.",
      inventory.analytics.reorderItemCount +
        inventory.analytics.qualityHoldCount +
        inventory.analytics.dispatchExceptionCount,
      inventory.analytics.qualityHoldCount,
      inventory.alerts.filter((alert) => isEscalated(alert.severity)).length,
      inventory.analytics.stockValue,
    ),
    relationshipSummary(
      "production",
      "Production & Quality",
      "/dashboard/operations/production",
      "Production plans, BOM governance, quality checks, and capacity risk.",
      production.productionPlans.filter((plan) => !["COMPLETED", "CANCELLED"].includes(plan.status)).length +
        production.qualityChecks.filter((check) => ["FAILED", "HOLD"].includes(check.status)).length,
      production.qualityChecks.filter((check) => check.status === "HOLD").length,
      production.alerts.filter((alert) => isEscalated(alert.severity)).length,
      0,
    ),
    operationSummary("users", "User Operations", "/dashboard/operations/users", users),
  ];

  const journeys = [
    journey(
      "source-to-pay",
      "Source-to-pay control chain",
      "Vendor onboarding -> quotation -> PO -> GRN -> invoice match -> payment approval",
      "/dashboard/operations/p2p",
      moduleStatus(
        (p2p?.kpis.highRiskAlerts ?? 0) + srm.insights.filter((item) => isEscalated(item.severity)).length,
        (p2p?.kpis.openRecords ?? 0) + srm.onboardings.length,
      ),
      (p2p?.stages.length ?? 0) + srm.onboardings.length,
    ),
    journey(
      "lead-to-cash",
      "Lead-to-cash control chain",
      "Lead -> opportunity -> sales order -> dispatch -> invoice -> collection -> revenue",
      "/dashboard/operations/otc",
      moduleStatus(
        (otc?.kpis.highRiskAlerts ?? 0) + crm.insights.filter((item) => isEscalated(item.severity)).length,
        (otc?.kpis.openRecords ?? 0) + crm.opportunities.length,
      ),
      (otc?.stages.length ?? 0) + crm.opportunities.length,
    ),
    journey(
      "plan-to-fulfill",
      "Plan-to-fulfill control chain",
      "Inventory demand -> production plan -> BOM -> quality control -> dispatch readiness",
      "/dashboard/operations/production",
      moduleStatus(
        inventory.alerts.filter((item) => isEscalated(item.severity)).length +
          production.alerts.filter((item) => isEscalated(item.severity)).length,
        inventory.analytics.reorderItemCount + production.productionPlans.length,
      ),
      inventory.items.length + production.productionPlans.length,
    ),
    journey(
      "record-to-report",
      "Record-to-report control chain",
      "Transactions -> journals -> reconciliation -> close -> statements -> MIS -> audit",
      "/dashboard/operations/r2r",
      moduleStatus(r2r?.kpis.highRiskAlerts ?? 0, r2r?.kpis.openRecords ?? 0),
      r2r?.stages.length ?? 0,
    ),
  ];

  return {
    summary: {
      connectedModules: modules.length,
      openControls: modules.reduce((sum, module) => sum + module.openItems, 0),
      pendingApprovals: approvals.length,
      highRiskAlerts: signals.filter((signal) => isEscalated(signal.severity)).length,
      financeExposure: modules.reduce((sum, module) => sum + module.financeExposure, 0),
      auditEvents: auditEvents.length,
    },
    modules,
    signals,
    approvals,
    financeImpacts,
    auditEvents,
    journeys,
  };
}

function operationSummary(
  slug: string,
  label: string,
  href: string,
  data: OperationModuleDashboardData | null,
): CommandCenterModuleSummary {
  const openItems = (data?.kpis.openRecords ?? 0) + (data?.kpis.waitingApprovals ?? 0);
  const highRiskAlerts = data?.kpis.highRiskAlerts ?? 0;
  return {
    slug,
    label,
    description: data?.module.description ?? "Module setup pending.",
    href,
    openItems,
    pendingApprovals: data?.kpis.waitingApprovals ?? 0,
    highRiskAlerts,
    financeExposure: data?.kpis.financeExposure ?? 0,
    status: moduleStatus(highRiskAlerts, openItems),
  };
}

function relationshipSummary(
  slug: string,
  label: string,
  href: string,
  description: string,
  openItems: number,
  pendingApprovals: number,
  highRiskAlerts: number,
  financeExposure: number,
): CommandCenterModuleSummary {
  return {
    slug,
    label,
    href,
    description,
    openItems,
    pendingApprovals,
    highRiskAlerts,
    financeExposure,
    status: moduleStatus(highRiskAlerts, openItems),
  };
}

function operationSignal(
  module: string,
  href: string,
  alert: OperationRiskAlert,
): CommandCenterSignal {
  return {
    id: alert.id,
    module,
    title: alert.title,
    description: alert.description,
    severity: alert.severity,
    signalType: alert.signalType,
    confidence: alert.confidence,
    recommendedAction: `Review ${alert.recordReference ?? module} and assign a control owner.`,
    href,
    source: "Operations AI",
  };
}

function relationshipSignal(
  module: string,
  href: string,
  insight: RelationshipAiInsightView,
): CommandCenterSignal {
  return {
    id: insight.id,
    module,
    title: insight.title,
    description: insight.description,
    severity: insight.severity,
    signalType: insight.module.toLowerCase(),
    confidence: insight.confidence,
    recommendedAction: `Review ${module} relationship signal and confirm the next owner action.`,
    href,
    source: "Relationship AI",
  };
}

function supplyChainSignal(
  module: string,
  href: string,
  alert: SupplyChainAiAlertView,
): CommandCenterSignal {
  return {
    id: alert.id,
    module,
    title: alert.title,
    description: alert.description,
    severity: alert.severity,
    signalType: alert.alertType,
    confidence: alert.confidence,
    recommendedAction: alert.recommendedAction ?? `Review ${module} exception and assign an owner.`,
    href,
    source: "Supply chain AI",
  };
}

function operationApproval(
  module: string,
  href: string,
  record: OperationRecord,
): CommandCenterApproval {
  return {
    id: record.id,
    module,
    reference: record.reference,
    title: record.title,
    ownerRole: record.ownerRole,
    amount: record.amount,
    dueAt: record.dueAt,
    href,
  };
}

function financeImpact(
  module: string,
  href: string,
  impact: OperationFinanceImpact,
): CommandCenterFinanceImpact {
  return {
    id: impact.id,
    module,
    title: impact.title,
    impactType: impact.impactType,
    amount: impact.amount,
    direction: impact.direction,
    period: impact.period,
    href,
  };
}

function relationshipAudit(
  module: string,
  href: string,
  event: RelationshipAuditView,
): CommandCenterAuditEvent {
  return {
    id: event.id,
    module,
    action: event.action,
    severity: event.severity,
    createdAt: event.createdAt,
    reference: event.resource,
    href,
  };
}

function supplyChainAudit(
  module: string,
  href: string,
  event: SupplyChainAuditView,
): CommandCenterAuditEvent {
  return {
    id: event.id,
    module,
    action: event.action,
    severity: event.severity,
    createdAt: event.createdAt,
    reference: event.resource,
    href,
  };
}

function journey(
  id: string,
  title: string,
  description: string,
  href: string,
  status: CommandCenterModuleStatus,
  controlCount: number,
): CommandCenterJourney {
  return { id, title, description, href, status, controlCount };
}

function moduleStatus(highRiskAlerts: number, openItems: number): CommandCenterModuleStatus {
  if (highRiskAlerts > 0) return "attention";
  if (openItems > 0) return "watch";
  return "healthy";
}

function signalSort(left: CommandCenterSignal, right: CommandCenterSignal): number {
  return severityRank(right.severity) - severityRank(left.severity);
}

function severityRank(severity: EnterpriseSignalSeverity): number {
  return {
    LOW: 1,
    MEDIUM: 2,
    HIGH: 3,
    CRITICAL: 4,
  }[severity];
}

function isEscalated(severity: string): boolean {
  return severity === "HIGH" || severity === "CRITICAL";
}

function compareIso(left: string | null, right: string | null): number {
  if (!left && !right) return 0;
  if (!left) return 1;
  if (!right) return -1;
  return new Date(left).getTime() - new Date(right).getTime();
}
