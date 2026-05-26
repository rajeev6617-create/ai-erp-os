export type OperationModuleSlug = "p2p" | "otc" | "r2r" | "users";

export interface OperationModuleNavItem {
  slug: OperationModuleSlug;
  label: string;
  href: string;
}

export interface OperationStage {
  id: string;
  key: string;
  name: string;
  description: string | null;
  sequence: number;
  status: string;
  slaHours: number | null;
  automationLevel: string | null;
}

export interface OperationRecord {
  id: string;
  reference: string;
  title: string;
  description: string | null;
  status: string;
  amount: number | null;
  currency: string;
  counterparty: string | null;
  ownerRole: string | null;
  dueAt: string | null;
  completedAt: string | null;
  riskScore: number;
  stageName: string | null;
  stageKey: string | null;
}

export interface OperationApprovalFlow {
  id: string;
  name: string;
  description: string | null;
  trigger: string;
  sequence: number;
  approverRole: string;
  approvalType: string;
  thresholdAmount: number | null;
  isActive: boolean;
}

export interface OperationRiskAlert {
  id: string;
  title: string;
  description: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status: string;
  signalType: string;
  confidence: number | null;
  detectedAt: string;
  recordReference: string | null;
}

export interface OperationFinanceImpact {
  id: string;
  impactType: string;
  title: string;
  amount: number;
  currency: string;
  direction: string;
  period: string | null;
  recognizedAt: string;
  recordReference: string | null;
}

export interface OperationAuditEvent {
  id: string;
  action: string;
  actor: string | null;
  severity: string;
  createdAt: string;
  recordReference: string | null;
  details: Record<string, unknown> | null;
}

export interface OperationFinanceSummary {
  inflow: number;
  outflow: number;
  neutralExposure: number;
  netImpact: number;
  byType: Array<{
    impactType: string;
    amount: number;
    direction: string;
  }>;
}

export interface OperationKpis {
  totalRecords: number;
  openRecords: number;
  waitingApprovals: number;
  exceptionRecords: number;
  stageCompletionPercent: number;
  activeRiskAlerts: number;
  highRiskAlerts: number;
  financeExposure: number;
}

export interface OperationModuleDashboardData {
  nav: OperationModuleNavItem[];
  activeSlug: OperationModuleSlug;
  module: {
    id: string;
    code: string;
    name: string;
    description: string | null;
    ownerRole: string | null;
    financeCategory: string | null;
  };
  kpis: OperationKpis;
  stages: OperationStage[];
  records: OperationRecord[];
  approvalFlows: OperationApprovalFlow[];
  riskAlerts: OperationRiskAlert[];
  financeSummary: OperationFinanceSummary;
  financeImpacts: OperationFinanceImpact[];
  auditEvents: OperationAuditEvent[];
}
