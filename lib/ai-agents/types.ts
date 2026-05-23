export type AiAgentKind = "cfo" | "auditor" | "compliance";

export type AiAgentSeverity = "low" | "medium" | "high" | "critical";

export interface AiAgentInsight {
  id: string;
  title: string;
  description: string;
  severity: AiAgentSeverity;
  confidence: number;
  evidence: string[];
  recommendation: string;
}

export interface AiAgentRunMetadata {
  agent: AiAgentKind;
  provider: "mock_rules_engine";
  modelId: "mock-enterprise-agent-v1";
  generatedAt: string;
  llmReady: boolean;
}

export interface AiAgentRequestContext {
  organizationId: string;
  actorUserId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  source?: "api" | "dashboard";
}

export interface CfoAiAgentResult {
  metadata: AiAgentRunMetadata;
  cashFlowInsights: AiAgentInsight[];
  budgetVarianceAlerts: AiAgentInsight[];
  financeRiskSummary: AiAgentInsight[];
  approvalRecommendations: AiAgentInsight[];
}

export interface AuditorAiAgentResult {
  metadata: AiAgentRunMetadata;
  auditTrailReview: AiAgentInsight[];
  unusualApprovalActivity: AiAgentInsight[];
  complianceRiskSignals: AiAgentInsight[];
  missingDocumentationAlerts: AiAgentInsight[];
}

export interface ComplianceAiAgentResult {
  metadata: AiAgentRunMetadata;
  gstTdsReminderInsights: AiAgentInsight[];
  filingRiskAlerts: AiAgentInsight[];
  statutoryDeadlineWarnings: AiAgentInsight[];
}
