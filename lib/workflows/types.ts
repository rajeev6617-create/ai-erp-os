import type {
  ApprovalStatus,
  ExecutionStatus,
} from "@/app/generated/prisma/client";

export type ApprovalTab = "pending" | "rejected" | "completed";

export type ApprovalActionType =
  | "approve"
  | "reject"
  | "escalate"
  | "request_clarification";

export interface AssigneeInfo {
  id: string | null;
  name: string;
  email: string | null;
  initials: string;
}

export interface WorkflowTimelineEvent {
  id: string;
  activityType: string;
  label: string;
  description: string | null;
  actorId: string | null;
  actorName: string;
  createdAt: string;
  workflowState?: string | null;
  comment?: string | null;
  ipAddress?: string | null;
  device?: string | null;
  metadata?: Record<string, unknown>;
  optimistic?: boolean;
}

export interface WorkflowCardData {
  id: string;
  approvalId?: string;
  title: string;
  description: string | null;
  workflowName: string;
  executionId: string | null;
  status: ApprovalStatus | ExecutionStatus;
  statusLabel: string;
  priority: "low" | "medium" | "high" | "critical";
  priorityScore: number;
  assignee: AssigneeInfo;
  requester: AssigneeInfo;
  entityType: string;
  dueAt: string | null;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, unknown>;
  timeline?: WorkflowTimelineEvent[];
}

export interface ApprovalActionResult {
  approvalId: string;
  executionId: string | null;
  action: ApprovalActionType;
  status: ApprovalStatus;
  executionStatus: ExecutionStatus | null;
  assignedApprover?: AssigneeInfo;
  notificationCount: number;
  message: string;
  timelineEvent?: WorkflowTimelineEvent;
}

export interface ApprovalAuditEntry {
  id: string;
  action: string;
  severity: string;
  userId: string | null;
  userName: string;
  resourceId: string | null;
  createdAt: string;
  workflowState: string | null;
  comment: string | null;
  ipAddress: string | null;
  device: string | null;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface ApprovalNotificationEvent {
  id: string;
  title: string;
  body: string | null;
  status: string;
  userId: string;
  createdAt: string;
}

export interface ApprovalAiRecommendation {
  id: string;
  title: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  status: "placeholder";
}

export interface ApprovalAuditHistory {
  approvalId: string;
  workflowState: string;
  generatedAt: string;
  timeline: WorkflowTimelineEvent[];
  auditTrail: ApprovalAuditEntry[];
  notifications: ApprovalNotificationEvent[];
  aiRecommendations: ApprovalAiRecommendation[];
}

export interface ApprovalAuditSummaryEntry extends ApprovalAuditEntry {
  approvalTitle: string | null;
}

export interface WorkflowStats {
  active: number;
  pending: number;
  completedToday: number;
  failed: number;
  waitingApproval: number;
  avgCompletionMins: number;
}

export type AiInsightType =
  | "recommendation"
  | "anomaly"
  | "risk"
  | "sla"
  | "priority"
  | "finance";

export type AiInsightSeverity = "low" | "medium" | "high" | "critical";

export interface AiInsight {
  id: string;
  type: AiInsightType;
  title: string;
  description: string;
  severity: AiInsightSeverity;
  relatedApprovalId?: string;
  relatedExecutionId?: string | null;
  score?: number;
  confidence?: number;
  evidence?: string[];
  actionLabel?: string;
  source?: "rules_engine" | "audit_history" | "placeholder";
  auditAware?: boolean;
}

export interface AiApprovalRecommendation {
  id: string;
  approvalId: string;
  title: string;
  recommendedAction: "approve" | "review" | "escalate" | "request_evidence";
  riskScore: number;
  priorityScore: number;
  confidence: number;
  rationale: string;
  auditSignals: string[];
  safeguards: string[];
  generatedAt: string;
}

export interface WorkflowIntelligenceWidget {
  id: string;
  label: string;
  value: string;
  detail: string;
  severity: AiInsightSeverity;
  trend: "up" | "down" | "neutral";
}

export interface SlaBreachPrediction {
  id: string;
  approvalId: string;
  title: string;
  probability: number;
  minutesToDue: number | null;
  dueAt: string | null;
  severity: AiInsightSeverity;
  reason: string;
}

export interface PriorityPrediction {
  id: string;
  approvalId: string;
  title: string;
  currentPriority: WorkflowCardData["priority"];
  predictedPriority: WorkflowCardData["priority"];
  predictedScore: number;
  confidence: number;
  reason: string;
}

export interface FinanceAnomalyAlert {
  id: string;
  title: string;
  description: string;
  severity: AiInsightSeverity;
  amountInr: number | null;
  entityType: string;
  entityId: string | null;
  relatedApprovalId?: string;
  evidence: string[];
  source: "rules_engine" | "placeholder";
}

export interface WorkflowBottleneckInsight {
  id: string;
  title: string;
  description: string;
  severity: AiInsightSeverity;
  scope: "assignee" | "entity_type" | "workflow" | "execution_state";
  count: number;
  averageAgeHours: number;
  confidence: number;
  relatedApprovalIds: string[];
  evidence: string[];
  source: "rules_engine" | "audit_history";
}

export interface AuditAwareSuggestion {
  id: string;
  title: string;
  description: string;
  severity: AiInsightSeverity;
  relatedApprovalId?: string;
  auditSignalCount: number;
  evidence: string[];
}

export interface WorkflowIntelligenceSummary {
  maxRiskScore: number;
  averageRiskScore: number;
  highRiskApprovals: number;
  predictedSlaBreaches: number;
  financeAnomalies: number;
  bottleneckInsights: number;
  priorityRecommendations: number;
  auditAwareSuggestions: number;
}

export interface WorkflowIntelligenceData {
  generatedAt: string;
  engineVersion: string;
  modelStatus: "rules_engine" | "placeholder";
  summary: WorkflowIntelligenceSummary;
  widgets: WorkflowIntelligenceWidget[];
  approvalRecommendations: AiApprovalRecommendation[];
  insights: AiInsight[];
  slaPredictions: SlaBreachPrediction[];
  priorityPredictions: PriorityPrediction[];
  financeAnomalies: FinanceAnomalyAlert[];
  bottleneckInsights: WorkflowBottleneckInsight[];
  auditAwareSuggestions: AuditAwareSuggestion[];
}

export interface OperationsDashboardData {
  stats: WorkflowStats;
  approvals: {
    pending: WorkflowCardData[];
    rejected: WorkflowCardData[];
    completed: WorkflowCardData[];
  };
  executions: WorkflowCardData[];
  aiInsights: AiInsight[];
  intelligence: WorkflowIntelligenceData;
  financeSummary: {
    revenueMtd: number;
    expensesMtd: number;
    outstandingInvoices: number;
    pendingPayments: number;
  };
  auditAlerts: { id: string; severity: string; message: string; time: string }[];
  notifications: { id: string; title: string; body: string; time: string; unread: boolean }[];
}
