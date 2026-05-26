export type RelationshipSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface RelationshipStat {
  label: string;
  value: string;
  change: string;
  trend: "up" | "down" | "neutral";
}

export interface CrmLeadView {
  id: string;
  leadNumber: string;
  companyName: string;
  contactName: string | null;
  source: string;
  status: string;
  score: number;
  estimatedValue: number | null;
  nextAction: string | null;
  dueAt: string | null;
}

export interface SalesOpportunityView {
  id: string;
  opportunityNumber: string;
  name: string;
  customerName: string;
  stage: string;
  amount: number;
  probability: number;
  expectedCloseAt: string | null;
}

export interface CustomerView {
  id: string;
  code: string;
  name: string;
  industry: string | null;
  segment: string | null;
  status: string;
  creditLimit: number | null;
  outstandingAmount: number;
}

export interface VendorView {
  id: string;
  code: string;
  name: string;
  vendorType: string;
  status: string;
  paymentTermsDays: number;
  riskTier: string | null;
}

export interface VendorOnboardingView {
  id: string;
  onboardingNumber: string;
  supplierName: string;
  contactName: string | null;
  status: string;
  riskScore: number;
  currentStep: string;
  submittedAt: string | null;
}

export interface SupportTicketView {
  id: string;
  ticketNumber: string;
  subject: string;
  description: string | null;
  status: string;
  priority: string;
  channel: string;
  ownerRole: string | null;
  dueAt: string | null;
}

export interface RelationshipAiInsightView {
  id: string;
  module: string;
  title: string;
  description: string;
  severity: RelationshipSeverity;
  confidence: number | null;
}

export interface RelationshipAuditView {
  id: string;
  action: string;
  resource: string;
  severity: string;
  createdAt: string;
}

export interface CrmDashboardData {
  stats: RelationshipStat[];
  customers: CustomerView[];
  leads: CrmLeadView[];
  opportunities: SalesOpportunityView[];
  tickets: SupportTicketView[];
  insights: RelationshipAiInsightView[];
  auditLogs: RelationshipAuditView[];
}

export interface SrmDashboardData {
  stats: RelationshipStat[];
  vendors: VendorView[];
  onboardings: VendorOnboardingView[];
  tickets: SupportTicketView[];
  insights: RelationshipAiInsightView[];
  auditLogs: RelationshipAuditView[];
}

export interface CustomerPortalData {
  customer: CustomerView;
  opportunities: SalesOpportunityView[];
  tickets: SupportTicketView[];
  insights: RelationshipAiInsightView[];
}

export interface VendorPortalData {
  vendor: VendorView;
  onboardings: VendorOnboardingView[];
  tickets: SupportTicketView[];
  insights: RelationshipAiInsightView[];
}
