import { getComplianceDashboard } from "@/lib/compliance/data";
import type { ComplianceDashboardData } from "@/lib/compliance/types";

export type ComplianceAuditSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type WidgetTrend = "up" | "down" | "neutral";

export interface ComplianceAuditWidget {
  key: string;
  label: string;
  value: string;
  change: string;
  trend: WidgetTrend;
}

export interface ComplianceAuditCapability {
  id: string;
  title: string;
  description: string;
  owner: string;
  controlCount: number;
  status: string;
}

export interface FilingTrackerRecord {
  id: string;
  complianceType: string;
  returnName: string;
  period: string;
  dueDate: string;
  owner: string;
  liability: number;
  filingStatus: string;
}

export interface StatutoryDueDate {
  id: string;
  complianceType: string;
  obligation: string;
  dueDate: string;
  owner: string;
  priority: string;
  status: string;
}

export interface ComplianceDocumentRecord {
  id: string;
  documentName: string;
  category: string;
  reference: string;
  owner: string;
  updatedAt: string;
  status: string;
}

export interface NoticeResponseRecord {
  id: string;
  noticeNumber: string;
  authority: string;
  subject: string;
  receivedAt: string;
  responseDueAt: string;
  owner: string;
  status: string;
}

export interface AuditChecklistRecord {
  id: string;
  auditArea: string;
  checklistName: string;
  owner: string;
  completedItems: number;
  totalItems: number;
  status: string;
}

export interface AuditObservationRecord {
  id: string;
  observationNumber: string;
  auditArea: string;
  title: string;
  owner: string;
  dueDate: string;
  severity: ComplianceAuditSeverity;
  status: string;
}

export interface AuditActionRecord {
  id: string;
  actionNumber: string;
  observationNumber: string;
  action: string;
  owner: string;
  dueDate: string;
  progressPercent: number;
  status: string;
}

export interface EvidenceMappingRecord {
  id: string;
  controlReference: string;
  evidenceName: string;
  documentReference: string;
  owner: string;
  status: string;
}

export interface ApprovalHistoryRecord {
  id: string;
  reference: string;
  workflow: string;
  approver: string;
  action: string;
  actedAt: string;
  status: string;
}

export interface AuditExceptionRecord {
  id: string;
  exceptionNumber: string;
  title: string;
  linkedObservation: string;
  owner: string;
  financeExposure: number;
  status: string;
}

export interface AuditClosureRecord {
  id: string;
  auditReference: string;
  auditArea: string;
  closureStage: string;
  approver: string;
  targetDate: string;
  status: string;
}

export interface ComplianceAuditInsight {
  id: string;
  insightType: string;
  title: string;
  description: string;
  severity: ComplianceAuditSeverity;
  metric: string;
  confidence: number;
  recommendedAction: string;
}

export interface WorkflowIntegrationRecord {
  id: string;
  title: string;
  description: string;
  href: string;
  linkedRecords: number;
  status: string;
}

export interface EscalationReminderRecord {
  id: string;
  title: string;
  owner: string;
  dueAt: string;
  channel: string;
  status: string;
}

export interface ComplianceAuditLogRecord {
  id: string;
  action: string;
  actor: string;
  reference: string;
  occurredAt: string;
  severity: string;
}

export interface ComplianceFinanceImpact {
  id: string;
  title: string;
  amount: number;
  impactType: string;
  period: string;
  status: string;
}

export interface ComplianceAuditDemoData {
  asOf: string;
  widgets: ComplianceAuditWidget[];
  complianceCapabilities: ComplianceAuditCapability[];
  auditCapabilities: ComplianceAuditCapability[];
  filingTrackers: FilingTrackerRecord[];
  dueDates: StatutoryDueDate[];
  documents: ComplianceDocumentRecord[];
  notices: NoticeResponseRecord[];
  auditChecklists: AuditChecklistRecord[];
  auditObservations: AuditObservationRecord[];
  auditActions: AuditActionRecord[];
  evidenceMappings: EvidenceMappingRecord[];
  approvalHistory: ApprovalHistoryRecord[];
  exceptions: AuditExceptionRecord[];
  closures: AuditClosureRecord[];
  aiInsights: ComplianceAuditInsight[];
  workflowIntegrations: WorkflowIntegrationRecord[];
  escalationReminders: EscalationReminderRecord[];
  auditLogs: ComplianceAuditLogRecord[];
  financeImpacts: ComplianceFinanceImpact[];
}

export interface ComplianceAuditOperationsData extends ComplianceAuditDemoData {
  compliance: ComplianceDashboardData;
}

const DEMO_DATA: ComplianceAuditDemoData = {
  asOf: "2026-05-31T09:30:00+05:30",
  widgets: [
    {
      key: "upcoming-due-dates",
      label: "Upcoming due dates",
      value: "8",
      change: "4 obligations due within 10 days",
      trend: "neutral",
    },
    {
      key: "overdue-compliance",
      label: "Overdue compliance",
      value: "2",
      change: "1 filing and 1 control remediation",
      trend: "down",
    },
    {
      key: "open-audit-points",
      label: "Open audit points",
      value: "11",
      change: "6 actions actively tracked",
      trend: "neutral",
    },
    {
      key: "high-risk-observations",
      label: "High-risk observations",
      value: "3",
      change: "1 critical revenue leakage control",
      trend: "down",
    },
    {
      key: "gst-tds-alerts",
      label: "GST/TDS alerts",
      value: "4",
      change: "INR 18.7L statutory exposure",
      trend: "down",
    },
    {
      key: "pending-evidence",
      label: "Pending evidence",
      value: "7",
      change: "3 evidence packs awaiting owners",
      trend: "neutral",
    },
  ],
  complianceCapabilities: [
    {
      id: "cap-gst",
      title: "GST compliance tracker",
      description: "GSTR-1, GSTR-3B, input credit, e-invoice, and liability reconciliation.",
      owner: "Indirect tax team",
      controlCount: 18,
      status: "ATTENTION",
    },
    {
      id: "cap-tds",
      title: "TDS compliance tracker",
      description: "Deduction, challan deposit, quarterly statements, and ledger tie-out.",
      owner: "Direct tax team",
      controlCount: 12,
      status: "WATCH",
    },
    {
      id: "cap-dates",
      title: "Statutory due dates",
      description: "Obligation due dates with ownership, priority, and escalation windows.",
      owner: "Compliance office",
      controlCount: 26,
      status: "ACTIVE",
    },
    {
      id: "cap-calendar",
      title: "Compliance calendar",
      description: "Monthly calendar across tax, corporate, payroll, and data-protection duties.",
      owner: "Compliance PMO",
      controlCount: 31,
      status: "ACTIVE",
    },
    {
      id: "cap-filing",
      title: "Filing status",
      description: "Draft, review, approval, submission, and acknowledgement tracking.",
      owner: "Finance control",
      controlCount: 14,
      status: "WATCH",
    },
    {
      id: "cap-docs",
      title: "Compliance document repository",
      description: "Return packs, challans, acknowledgements, reconciliations, and evidence.",
      owner: "Document controller",
      controlCount: 42,
      status: "ACTIVE",
    },
    {
      id: "cap-notices",
      title: "Notice and response tracker",
      description: "Authority correspondence, response due dates, review, and closure.",
      owner: "Compliance legal",
      controlCount: 5,
      status: "ATTENTION",
    },
  ],
  auditCapabilities: [
    {
      id: "audit-checklist",
      title: "Internal audit checklist",
      description: "Risk-based audit programs with scoped testing and accountable owners.",
      owner: "Internal audit",
      controlCount: 48,
      status: "IN_PROGRESS",
    },
    {
      id: "audit-observations",
      title: "Audit observations",
      description: "Severity-rated findings linked to controls, evidence, and business owners.",
      owner: "Audit manager",
      controlCount: 11,
      status: "ATTENTION",
    },
    {
      id: "audit-actions",
      title: "Audit action tracker",
      description: "Corrective and preventive actions with target dates and escalation.",
      owner: "Control owners",
      controlCount: 15,
      status: "WATCH",
    },
    {
      id: "audit-evidence",
      title: "Evidence and document mapping",
      description: "Audit workpapers, supporting documents, samples, and validation state.",
      owner: "Audit assurance",
      controlCount: 37,
      status: "WATCH",
    },
    {
      id: "audit-approval",
      title: "Approval history",
      description: "Immutable reviewer and approver decision timeline for audit readiness.",
      owner: "Audit governance",
      controlCount: 24,
      status: "ACTIVE",
    },
    {
      id: "audit-exceptions",
      title: "Exception register",
      description: "Accepted, remediating, and escalated exceptions with finance exposure.",
      owner: "Risk committee",
      controlCount: 8,
      status: "ATTENTION",
    },
    {
      id: "audit-closure",
      title: "Audit closure workflow",
      description: "Evidence sign-off, management response, auditor approval, and closure.",
      owner: "Head of audit",
      controlCount: 9,
      status: "WATCH",
    },
  ],
  filingTrackers: [
    {
      id: "filing-gstr1-may",
      complianceType: "GST",
      returnName: "GSTR-1 outward supplies",
      period: "May 2026",
      dueDate: "2026-06-11",
      owner: "Priya Nair",
      liability: 1260000,
      filingStatus: "DRAFT_READY",
    },
    {
      id: "filing-gstr3b-apr",
      complianceType: "GST",
      returnName: "GSTR-3B summary return",
      period: "April 2026",
      dueDate: "2026-05-20",
      owner: "Priya Nair",
      liability: 1840000,
      filingStatus: "OVERDUE_REVIEW",
    },
    {
      id: "filing-tds-may",
      complianceType: "TDS",
      returnName: "TDS challan deposit",
      period: "May 2026",
      dueDate: "2026-06-07",
      owner: "Arjun Mehta",
      liability: 610000,
      filingStatus: "RECONCILIATION",
    },
    {
      id: "filing-24q-q4",
      complianceType: "TDS",
      returnName: "Form 24Q salary TDS",
      period: "Q4 FY 2025-26",
      dueDate: "2026-05-31",
      owner: "Arjun Mehta",
      liability: 420000,
      filingStatus: "ACKNOWLEDGED",
    },
  ],
  dueDates: [
    {
      id: "due-tds-may",
      complianceType: "TDS",
      obligation: "May TDS challan deposit",
      dueDate: "2026-06-07",
      owner: "Arjun Mehta",
      priority: "HIGH",
      status: "RECONCILIATION",
    },
    {
      id: "due-gstr1-may",
      complianceType: "GST",
      obligation: "May GSTR-1 filing",
      dueDate: "2026-06-11",
      owner: "Priya Nair",
      priority: "HIGH",
      status: "DRAFT_READY",
    },
    {
      id: "due-pf-may",
      complianceType: "PAYROLL",
      obligation: "PF contribution deposit",
      dueDate: "2026-06-15",
      owner: "Neha Kulkarni",
      priority: "MEDIUM",
      status: "SCHEDULED",
    },
    {
      id: "due-dpdp-quarter",
      complianceType: "DPDP",
      obligation: "Quarterly access review evidence",
      dueDate: "2026-06-15",
      owner: "Vikram Patel",
      priority: "CRITICAL",
      status: "EVIDENCE_PENDING",
    },
  ],
  documents: [
    {
      id: "doc-gstr3b-apr",
      documentName: "April 2026 GSTR-3B reconciliation pack",
      category: "GST return pack",
      reference: "DOC-TAX-2605-118",
      owner: "Priya Nair",
      updatedAt: "2026-05-30T17:45:00+05:30",
      status: "REVIEW_PENDING",
    },
    {
      id: "doc-tds-may",
      documentName: "May 2026 TDS ledger and challan working",
      category: "TDS working",
      reference: "DOC-TDS-2605-076",
      owner: "Arjun Mehta",
      updatedAt: "2026-05-31T08:20:00+05:30",
      status: "VALID",
    },
    {
      id: "doc-dpdp-review",
      documentName: "Q1 privileged access review evidence pack",
      category: "DPDP evidence",
      reference: "DOC-DPDP-2605-022",
      owner: "Vikram Patel",
      updatedAt: "2026-05-29T13:10:00+05:30",
      status: "EVIDENCE_GAP",
    },
    {
      id: "doc-notice-gst",
      documentName: "GST notice response draft and invoice samples",
      category: "Authority response",
      reference: "DOC-NOTICE-2605-009",
      owner: "Meera Iyer",
      updatedAt: "2026-05-30T11:35:00+05:30",
      status: "LEGAL_REVIEW",
    },
  ],
  notices: [
    {
      id: "notice-gst-042",
      noticeNumber: "GST/BLR/2026/042",
      authority: "Karnataka GST Department",
      subject: "Input tax credit mismatch for March 2026",
      receivedAt: "2026-05-24",
      responseDueAt: "2026-06-08",
      owner: "Meera Iyer",
      status: "RESPONSE_DRAFT",
    },
    {
      id: "notice-tds-017",
      noticeNumber: "TDS/CPC/2026/017",
      authority: "TRACES CPC",
      subject: "Short deduction clarification for contractor invoices",
      receivedAt: "2026-05-18",
      responseDueAt: "2026-06-02",
      owner: "Arjun Mehta",
      status: "WAITING_APPROVAL",
    },
  ],
  auditChecklists: [
    {
      id: "checklist-revenue",
      auditArea: "Revenue and receivables",
      checklistName: "OTC revenue recognition and collection controls",
      owner: "Ritu Sharma",
      completedItems: 15,
      totalItems: 18,
      status: "IN_PROGRESS",
    },
    {
      id: "checklist-procurement",
      auditArea: "Procure to pay",
      checklistName: "Vendor onboarding, GRN, and invoice match controls",
      owner: "Ritu Sharma",
      completedItems: 21,
      totalItems: 24,
      status: "IN_PROGRESS",
    },
    {
      id: "checklist-access",
      auditArea: "Access governance",
      checklistName: "Privileged access and segregation-of-duties review",
      owner: "Vikram Patel",
      completedItems: 4,
      totalItems: 6,
      status: "ATTENTION",
    },
  ],
  auditObservations: [
    {
      id: "obs-2605-014",
      observationNumber: "OBS-2605-014",
      auditArea: "Revenue and receivables",
      title: "Milestone acceptance evidence missing on three invoices",
      owner: "Collections lead",
      dueDate: "2026-06-05",
      severity: "CRITICAL",
      status: "OPEN",
    },
    {
      id: "obs-2605-012",
      observationNumber: "OBS-2605-012",
      auditArea: "Access governance",
      title: "Three finance users retain stale privileged roles",
      owner: "IT governance",
      dueDate: "2026-06-03",
      severity: "HIGH",
      status: "REMEDIATION",
    },
    {
      id: "obs-2605-009",
      observationNumber: "OBS-2605-009",
      auditArea: "Procure to pay",
      title: "Vendor insurance certificate expired before PO release",
      owner: "Procurement manager",
      dueDate: "2026-06-07",
      severity: "HIGH",
      status: "OWNER_RESPONSE",
    },
    {
      id: "obs-2605-004",
      observationNumber: "OBS-2605-004",
      auditArea: "Inventory",
      title: "Cycle count variance review missing controller sign-off",
      owner: "Warehouse controller",
      dueDate: "2026-06-12",
      severity: "MEDIUM",
      status: "EVIDENCE_PENDING",
    },
  ],
  auditActions: [
    {
      id: "action-2605-031",
      actionNumber: "ACT-2605-031",
      observationNumber: "OBS-2605-014",
      action: "Attach signed milestone certificates and revalidate invoice recognition.",
      owner: "Collections lead",
      dueDate: "2026-06-05",
      progressPercent: 35,
      status: "IN_PROGRESS",
    },
    {
      id: "action-2605-028",
      actionNumber: "ACT-2605-028",
      observationNumber: "OBS-2605-012",
      action: "Remove stale roles and complete manager access recertification.",
      owner: "IT governance",
      dueDate: "2026-06-03",
      progressPercent: 70,
      status: "IN_PROGRESS",
    },
    {
      id: "action-2605-021",
      actionNumber: "ACT-2605-021",
      observationNumber: "OBS-2605-009",
      action: "Collect renewed insurance certificate and tighten PO release control.",
      owner: "Procurement manager",
      dueDate: "2026-06-07",
      progressPercent: 50,
      status: "WAITING_EVIDENCE",
    },
  ],
  evidenceMappings: [
    {
      id: "evidence-otc-114",
      controlReference: "OTC-REV-04",
      evidenceName: "Milestone acceptance certificates",
      documentReference: "DOC-OTC-2605-114",
      owner: "Collections lead",
      status: "PARTIAL",
    },
    {
      id: "evidence-user-022",
      controlReference: "USER-SOD-02",
      evidenceName: "Privileged access recertification",
      documentReference: "DOC-DPDP-2605-022",
      owner: "IT governance",
      status: "EVIDENCE_GAP",
    },
    {
      id: "evidence-p2p-071",
      controlReference: "P2P-VEN-07",
      evidenceName: "Vendor insurance renewal",
      documentReference: "DOC-SRM-2605-071",
      owner: "Procurement manager",
      status: "PENDING_UPLOAD",
    },
    {
      id: "evidence-inv-055",
      controlReference: "INV-CYCLE-05",
      evidenceName: "Warehouse cycle count sign-off",
      documentReference: "DOC-INV-2605-055",
      owner: "Warehouse controller",
      status: "REVIEW_PENDING",
    },
  ],
  approvalHistory: [
    {
      id: "approval-gstr3b-review",
      reference: "APR-COMP-2605-018",
      workflow: "GSTR-3B filing review",
      approver: "CFO office",
      action: "Review requested",
      actedAt: "2026-05-30T16:15:00+05:30",
      status: "WAITING_APPROVAL",
    },
    {
      id: "approval-tds-response",
      reference: "APR-NOTICE-2605-006",
      workflow: "TDS notice response",
      approver: "Finance manager",
      action: "Legal comments incorporated",
      actedAt: "2026-05-30T12:40:00+05:30",
      status: "IN_PROGRESS",
    },
    {
      id: "approval-audit-close",
      reference: "APR-AUD-2605-011",
      workflow: "P2P audit closure",
      approver: "Head of audit",
      action: "Evidence sign-off pending",
      actedAt: "2026-05-29T18:05:00+05:30",
      status: "EVIDENCE_PENDING",
    },
  ],
  exceptions: [
    {
      id: "exception-2605-007",
      exceptionNumber: "EXC-2605-007",
      title: "Revenue evidence gap above materiality threshold",
      linkedObservation: "OBS-2605-014",
      owner: "Revenue controller",
      financeExposure: 315000,
      status: "ESCALATED",
    },
    {
      id: "exception-2605-005",
      exceptionNumber: "EXC-2605-005",
      title: "Privileged access recertification overdue",
      linkedObservation: "OBS-2605-012",
      owner: "IT governance",
      financeExposure: 0,
      status: "REMEDIATION",
    },
    {
      id: "exception-2605-002",
      exceptionNumber: "EXC-2605-002",
      title: "Vendor compliance evidence missing at PO release",
      linkedObservation: "OBS-2605-009",
      owner: "Procurement manager",
      financeExposure: 1265000,
      status: "RISK_ACCEPTANCE_REVIEW",
    },
  ],
  closures: [
    {
      id: "closure-p2p-q1",
      auditReference: "AUD-P2P-Q1-26",
      auditArea: "Procure to pay",
      closureStage: "Evidence validation",
      approver: "Head of audit",
      targetDate: "2026-06-08",
      status: "WAITING_EVIDENCE",
    },
    {
      id: "closure-otc-q1",
      auditReference: "AUD-OTC-Q1-26",
      auditArea: "Revenue and receivables",
      closureStage: "Management response",
      approver: "Revenue controller",
      targetDate: "2026-06-10",
      status: "IN_PROGRESS",
    },
    {
      id: "closure-access-q1",
      auditReference: "AUD-USER-Q1-26",
      auditArea: "Access governance",
      closureStage: "Action remediation",
      approver: "IT governance",
      targetDate: "2026-06-05",
      status: "ATTENTION",
    },
  ],
  aiInsights: [
    {
      id: "ai-compliance-risk",
      insightType: "compliance_risk_score",
      title: "Compliance risk score",
      description: "GST filing delay and access-review evidence gaps increase the current control risk.",
      severity: "HIGH",
      metric: "76 / 100",
      confidence: 91,
      recommendedAction: "Escalate GSTR-3B sign-off and assign the missing DPDP evidence owner.",
    },
    {
      id: "ai-missed-filing",
      insightType: "missed_filing_prediction",
      title: "Missed filing prediction",
      description: "May TDS deposit is likely to slip without completing the AP ledger tie-out.",
      severity: "HIGH",
      metric: "64% risk",
      confidence: 86,
      recommendedAction: "Complete reconciliation before June 4 and pre-book challan approval.",
    },
    {
      id: "ai-audit-anomaly",
      insightType: "audit_anomaly_alert",
      title: "Audit anomaly alert",
      description: "Revenue recognition evidence gaps recur across three strategic customer invoices.",
      severity: "CRITICAL",
      metric: "3 invoices",
      confidence: 93,
      recommendedAction: "Hold revenue closure for the affected invoices until evidence is validated.",
    },
    {
      id: "ai-documentation-gap",
      insightType: "documentation_gap_detection",
      title: "Documentation gap detection",
      description: "Seven control evidence items are missing, partial, or awaiting owner upload.",
      severity: "MEDIUM",
      metric: "7 gaps",
      confidence: 89,
      recommendedAction: "Trigger evidence reminders and prioritize critical-control uploads.",
    },
    {
      id: "ai-recurring-observation",
      insightType: "recurring_observation_analysis",
      title: "Recurring observation analysis",
      description: "Vendor compliance evidence has appeared in two consecutive P2P audit cycles.",
      severity: "HIGH",
      metric: "2 cycles",
      confidence: 84,
      recommendedAction: "Add an automated document-expiry gate before PO release.",
    },
  ],
  workflowIntegrations: [
    {
      id: "workflow-approvals",
      title: "Approvals",
      description: "Filing sign-off, notice responses, risk acceptance, and audit closure decisions.",
      href: "/dashboard/approvals",
      linkedRecords: 9,
      status: "ACTIVE",
    },
    {
      id: "workflow-audit-logs",
      title: "Audit logs",
      description: "Immutable statutory and audit activity timeline with actor attribution.",
      href: "/dashboard/operations/audit",
      linkedRecords: 27,
      status: "ACTIVE",
    },
    {
      id: "workflow-finance",
      title: "Finance linkage",
      description: "GST, TDS, revenue, and exception exposure linked to finance controls.",
      href: "/dashboard/finance",
      linkedRecords: 12,
      status: "ATTENTION",
    },
    {
      id: "workflow-documents",
      title: "Document tracking",
      description: "Evidence repository, return packs, notices, acknowledgements, and workpapers.",
      href: "/dashboard/documents",
      linkedRecords: 46,
      status: "WATCH",
    },
    {
      id: "workflow-escalations",
      title: "Escalation reminders",
      description: "Due-date and owner reminders with compliance and audit SLA monitoring.",
      href: "/dashboard/workflows",
      linkedRecords: 6,
      status: "ATTENTION",
    },
  ],
  escalationReminders: [
    {
      id: "reminder-tds-response",
      title: "TDS notice response approval due",
      owner: "Finance manager",
      dueAt: "2026-06-02T12:00:00+05:30",
      channel: "Email + workflow inbox",
      status: "ESCALATED",
    },
    {
      id: "reminder-access",
      title: "Privileged access evidence remediation",
      owner: "IT governance",
      dueAt: "2026-06-03T17:00:00+05:30",
      channel: "Workflow inbox",
      status: "ATTENTION",
    },
    {
      id: "reminder-gstr1",
      title: "GSTR-1 review pack owner check",
      owner: "Indirect tax team",
      dueAt: "2026-06-05T10:00:00+05:30",
      channel: "Email",
      status: "SCHEDULED",
    },
  ],
  auditLogs: [
    {
      id: "log-gstr3b-review",
      action: "GSTR-3B filing review requested",
      actor: "Priya Nair",
      reference: "APR-COMP-2605-018",
      occurredAt: "2026-05-30T16:15:00+05:30",
      severity: "WARNING",
    },
    {
      id: "log-revenue-anomaly",
      action: "Revenue evidence anomaly escalated",
      actor: "ASTRA auditor agent",
      reference: "OBS-2605-014",
      occurredAt: "2026-05-30T14:30:00+05:30",
      severity: "CRITICAL",
    },
    {
      id: "log-notice-response",
      action: "GST notice response draft uploaded",
      actor: "Meera Iyer",
      reference: "GST/BLR/2026/042",
      occurredAt: "2026-05-30T11:35:00+05:30",
      severity: "INFO",
    },
    {
      id: "log-vendor-evidence",
      action: "Vendor compliance evidence marked incomplete",
      actor: "Audit reviewer",
      reference: "OBS-2605-009",
      occurredAt: "2026-05-29T15:20:00+05:30",
      severity: "WARNING",
    },
  ],
  financeImpacts: [
    {
      id: "finance-gst-apr",
      title: "April GST liability pending filing approval",
      amount: 1840000,
      impactType: "Statutory payable",
      period: "April 2026",
      status: "ATTENTION",
    },
    {
      id: "finance-tds-may",
      title: "May TDS challan provisioning",
      amount: 610000,
      impactType: "Statutory payable",
      period: "May 2026",
      status: "WATCH",
    },
    {
      id: "finance-revenue-evidence",
      title: "Revenue recognition evidence exception",
      amount: 315000,
      impactType: "Audit exception exposure",
      period: "May 2026",
      status: "CRITICAL",
    },
    {
      id: "finance-vendor-control",
      title: "Vendor compliance release exposure",
      amount: 1265000,
      impactType: "P2P control exposure",
      period: "May 2026",
      status: "ATTENTION",
    },
  ],
};

export async function getComplianceAuditOperationsData(
  organizationId: string,
): Promise<ComplianceAuditOperationsData> {
  return {
    ...DEMO_DATA,
    compliance: await getComplianceDashboard(organizationId),
  };
}

export function getComplianceAuditDemoData(): ComplianceAuditDemoData {
  return DEMO_DATA;
}
