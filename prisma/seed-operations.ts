import { Prisma, type PrismaClient } from "../app/generated/prisma/client";

type ModuleCode = "P2P" | "OTC" | "R2R" | "USER_OPERATIONS";
type StageStatus =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "WAITING_APPROVAL"
  | "BLOCKED"
  | "COMPLETED";
type RecordStatus =
  | "OPEN"
  | "WAITING_APPROVAL"
  | "APPROVED"
  | "BLOCKED"
  | "COMPLETED"
  | "EXCEPTION";
type RiskSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
type AuditSeverity = "INFO" | "WARNING" | "ERROR" | "CRITICAL";

interface StageSeed {
  key: string;
  name: string;
  description: string;
  sequence: number;
  status: StageStatus;
  slaHours: number;
  automationLevel: string;
}

interface ApprovalFlowSeed {
  name: string;
  description: string;
  trigger: string;
  sequence: number;
  approverRole: string;
  approvalType: "SEQUENTIAL" | "PARALLEL" | "ANY_ONE" | "MAJORITY" | "UNANIMOUS";
  thresholdAmount?: number;
  metadata?: Record<string, unknown>;
}

interface RecordSeed {
  reference: string;
  title: string;
  description: string;
  stageKey: string;
  status: RecordStatus;
  amount?: number;
  counterparty?: string;
  ownerRole: string;
  dueInHours?: number;
  completedHoursAgo?: number;
  riskScore: number;
  metadata?: Record<string, unknown>;
}

interface RiskSeed {
  sourceKey: string;
  recordReference?: string;
  title: string;
  description: string;
  severity: RiskSeverity;
  signalType: string;
  confidence: number;
  metadata?: Record<string, unknown>;
}

interface FinanceImpactSeed {
  sourceKey: string;
  recordReference?: string;
  impactType: string;
  title: string;
  amount: number;
  direction: "INFLOW" | "OUTFLOW" | "NEUTRAL";
  period: string;
  metadata?: Record<string, unknown>;
}

interface AuditEventSeed {
  sourceKey: string;
  recordReference?: string;
  action: string;
  actor: string;
  severity: AuditSeverity;
  details: Record<string, unknown>;
}

interface OperationModuleSeed {
  code: ModuleCode;
  name: string;
  description: string;
  ownerRole: string;
  financeCategory: string;
  stages: StageSeed[];
  approvalFlows: ApprovalFlowSeed[];
  records: RecordSeed[];
  riskAlerts: RiskSeed[];
  financeImpacts: FinanceImpactSeed[];
  auditEvents: AuditEventSeed[];
}

const MODULES: OperationModuleSeed[] = [
  {
    code: "P2P",
    name: "P2P - Procure-to-Pay",
    description:
      "Purchase requisitions, RFQs, vendor quotations, purchase orders, GRNs, invoice matching, and payment approval controls.",
    ownerRole: "finance-manager",
    financeCategory: "Accounts payable",
    stages: [
      stage("purchase_requisition", "Purchase Requisition", "Demand intake, budget check, and requester justification.", 1, "WAITING_APPROVAL", 12, "AI spend classification"),
      stage("rfq", "RFQ", "Supplier RFQ issue, due-date tracking, and bid completeness checks.", 2, "IN_PROGRESS", 24, "RFQ response monitor"),
      stage("vendor_quotation", "Vendor Quotation", "Quotation comparison, GST validation, and vendor risk screening.", 3, "IN_PROGRESS", 24, "AI quote normalization"),
      stage("purchase_order", "Purchase Order", "PO approval by value threshold, budget owner, and finance control.", 4, "WAITING_APPROVAL", 12, "Policy routing"),
      stage("goods_receipt_note", "Goods Receipt Note", "GRN capture, receipt confirmation, and pending quantity validation.", 5, "IN_PROGRESS", 24, "Mobile receiving"),
      stage("invoice_matching", "Invoice Matching", "Invoice, PO, and GRN tolerance review before liability release.", 6, "BLOCKED", 12, "Three-way match"),
      stage("payment_approval", "Payment Approval", "Treasury approval, payment batch release, and cash timing control.", 7, "WAITING_APPROVAL", 8, "Payment run controls"),
    ],
    approvalFlows: [
      flow("Purchase requisition budget approval", "Routes PRs that exceed department guardrails to manager approval.", "PR amount above INR 3L or budget utilization above 80%", 1, "manager", "SEQUENTIAL", 300000),
      flow("Purchase order value approval", "Routes approved vendor quotations into PO approval by finance threshold.", "PO amount above INR 5L", 2, "finance-manager", "SEQUENTIAL", 500000),
      flow("Invoice matching exception approval", "Escalates three-way match variance before liability release.", "Invoice variance above configured tolerance", 3, "cfo", "ANY_ONE", 1000000),
      flow("Payment release approval", "Requires treasury approval before vendor payment batch release.", "Payment batch above INR 2L", 4, "finance-manager", "SEQUENTIAL", 200000),
    ],
    records: [
      record("P2P-PR-2026", "Capex purchase requisition", "Assembly line sensor requisition is pending manager approval after budget impact review.", "purchase_requisition", "WAITING_APPROVAL", 420000, "Internal - Operations", "manager", 5, undefined, 58, { department: "Manufacturing", budgetImpact: 74, requestedBy: "Operations" }),
      record("P2P-RFQ-1120", "Packaging material RFQ", "RFQ is open for corrugated packaging with one supplier response still pending.", "rfq", "OPEN", 680000, "Approved vendor pool", "manager", 18, undefined, 46, { rfqResponses: 2, requiredResponses: 3 }),
      record("P2P-VQ-4420", "Vendor quotation comparison", "Quotation comparison shows a high-risk supplier offering lowest price with extended payment terms.", "vendor_quotation", "OPEN", 735000, "Shakti Industrial Supplies", "finance-manager", 10, undefined, 77, { quoteCount: 3, preferredVendorRisk: "HIGH" }),
      record("P2P-PO-1048", "Laptop refresh purchase order", "Procurement package is awaiting finance approval against IT budget.", "purchase_order", "WAITING_APPROVAL", 890000, "TechNova Systems", "manager", 12, undefined, 64, { department: "IT", budgetAvailable: true }),
      record("P2P-GRN-7711", "GRN pending for sensor delivery", "Goods receipt note is pending warehouse confirmation for partial delivery.", "goods_receipt_note", "OPEN", 560000, "Apex Distribution", "manager", 4, undefined, 62, { receivedQuantity: 70, expectedQuantity: 100 }),
      record("P2P-INV-3181", "Invoice mismatch exception", "Supplier invoice exceeds PO and GRN tolerance by 4.8%.", "invoice_matching", "EXCEPTION", 1265000, "Shakti Industrial Supplies", "finance-manager", 6, undefined, 87, { variancePercent: 4.8, tolerancePercent: 2 }),
      record("P2P-PAY-2210", "Weekly vendor payment run", "Payment batch is prepared for treasury release with cash timing impact.", "payment_approval", "WAITING_APPROVAL", 2750000, "Multi-vendor batch", "finance-manager", 8, undefined, 72, { paymentCount: 18, cashRunwayImpactDays: 2 }),
    ],
    riskAlerts: [
      risk("ops:P2P:risk:vq-4420:vendor-risk", "P2P-VQ-4420", "Vendor risk requires review", "Lowest-price quotation belongs to a supplier with elevated delivery and compliance risk.", "HIGH", "vendor_risk", 88.4, { supplierRiskTier: "HIGH", control: "vendor_due_diligence" }),
      risk("ops:P2P:risk:inv-3181:price-variance", "P2P-INV-3181", "Price variance above tolerance", "Invoice line price exceeds PO and GRN tolerance by 4.8%, blocking automated match.", "CRITICAL", "price_variance", 94.1, { variancePercent: 4.8, tolerancePercent: 2 }),
      risk("ops:P2P:risk:grn-7711:delayed", "P2P-GRN-7711", "Delayed procurement receipt", "Partial receipt is delaying GRN completion and may push invoice matching beyond SLA.", "MEDIUM", "delayed_procurement", 79.6, { pendingQuantity: 30, slaHoursRemaining: 4 }),
      risk("ops:P2P:risk:pr-2026:budget", "P2P-PR-2026", "Budget impact near threshold", "Requisition consumes 74% of the remaining manufacturing capex budget.", "MEDIUM", "budget_impact", 82.2, { budgetImpactPercent: 74 }),
      risk("ops:P2P:risk:inv-3181:invoice-mismatch", "P2P-INV-3181", "Invoice mismatch alert", "Three-way match found PO, GRN, and invoice quantity-value mismatch requiring AP review.", "CRITICAL", "invoice_mismatch", 92.7, { matchStatus: "blocked" }),
    ],
    financeImpacts: [
      impact("ops:P2P:impact:pr-2026", "P2P-PR-2026", "budget_commitment", "PR budget reservation", 420000, "NEUTRAL", "May 2026"),
      impact("ops:P2P:impact:po-1048", "P2P-PO-1048", "committed_spend", "Committed procurement spend", 890000, "OUTFLOW", "FY2025-26"),
      impact("ops:P2P:impact:grn-7711", "P2P-GRN-7711", "goods_received_accrual", "Pending GRN accrual exposure", 560000, "OUTFLOW", "May 2026"),
      impact("ops:P2P:impact:payment-run", "P2P-PAY-2210", "cash_outflow", "Pending AP payment run", 2750000, "OUTFLOW", "May 2026"),
      impact("ops:P2P:impact:blocked-invoice", "P2P-INV-3181", "blocked_liability", "Invoice blocked by match tolerance", 1265000, "OUTFLOW", "May 2026"),
    ],
    auditEvents: [
      audit("ops:P2P:audit:pr-2026:submitted", "P2P-PR-2026", "purchase.requisition.submitted", "Procurement requester", "INFO", { stage: "purchase_requisition", budgetImpactPercent: 74 }),
      audit("ops:P2P:audit:rfq-1120:issued", "P2P-RFQ-1120", "rfq.issued", "Procurement manager", "INFO", { vendorCount: 3 }),
      audit("ops:P2P:audit:vq-4420:risk", "P2P-VQ-4420", "vendor.quotation.risk.scored", "AI procurement manager", "WARNING", { supplierRiskTier: "HIGH" }),
      audit("ops:P2P:audit:po-1048:threshold", "P2P-PO-1048", "purchase.order.approval.pending", "AI procurement control", "INFO", { threshold: 500000, approverRole: "finance-manager" }),
      audit("ops:P2P:audit:grn-7711:pending", "P2P-GRN-7711", "grn.pending.confirmation", "Warehouse operations", "WARNING", { pendingQuantity: 30 }),
      audit("ops:P2P:audit:inv-3181:block", "P2P-INV-3181", "invoice.match.blocked", "AP automation", "WARNING", { variancePercent: 4.8 }),
      audit("ops:P2P:audit:pay-2210:approval", "P2P-PAY-2210", "payment.approval.requested", "Treasury control", "INFO", { paymentCount: 18 }),
    ],
  },
  {
    code: "OTC",
    name: "OTC - Order to Cash",
    description:
      "Customer orders, credit controls, invoicing, collections, and cash application.",
    ownerRole: "cfo",
    financeCategory: "Accounts receivable",
    stages: [
      stage("order_capture", "Order capture", "Sales order intake and commercial validation.", 1, "COMPLETED", 12, "Contract extraction"),
      stage("credit_check", "Credit check", "Credit exposure and payment history review.", 2, "WAITING_APPROVAL", 8, "AI credit scoring"),
      stage("fulfillment", "Fulfillment", "Shipment or service delivery confirmation.", 3, "IN_PROGRESS", 24, "Inventory sync"),
      stage("invoice_issue", "Invoice issue", "GST invoice generation and e-invoice checks.", 4, "IN_PROGRESS", 12, "GST validation"),
      stage("collections", "Collections", "Dunning, promise-to-pay, and dispute handling.", 5, "BLOCKED", 24, "AI collections prioritization"),
      stage("cash_application", "Cash application", "Bank receipt matching and customer ledger posting.", 6, "NOT_STARTED", 12, "Auto-reconciliation"),
    ],
    approvalFlows: [
      flow("Credit limit approval", "Routes orders that exceed customer credit exposure.", "Credit exposure above approved limit", 1, "cfo", "ANY_ONE", 1500000),
      flow("Discount approval", "Requires manager approval for commercial discounts.", "Discount above 7%", 2, "manager", "SEQUENTIAL", 0, { discountPercent: 7 }),
      flow("Write-off approval", "Escalates bad-debt or dispute write-off recommendations.", "Write-off above INR 1L", 3, "finance-manager", "SEQUENTIAL", 100000),
    ],
    records: [
      record("OTC-SO-7702", "Enterprise renewal order", "Order is above current credit limit and awaits CFO approval.", "credit_check", "WAITING_APPROVAL", 1840000, "Northstar Retail", "cfo", 5, undefined, 78, { creditLimit: 1500000 }),
      record("OTC-INV-5591", "Overdue customer invoice", "Collection blocked by customer dispute on service milestone.", "collections", "BLOCKED", 940000, "Apex Distribution", "finance-manager", -36, undefined, 84, { daysOverdue: 19 }),
      record("OTC-CASH-1288", "Unapplied bank receipt", "Receipt awaiting customer remittance matching.", "cash_application", "OPEN", 410000, "Metro Fabricators", "finance-manager", 18, undefined, 48, { matchConfidence: 71 }),
    ],
    riskAlerts: [
      risk("ops:OTC:risk:so-7702:credit", "OTC-SO-7702", "Credit exposure breach", "Customer order exceeds available credit and payment behavior has weakened.", "HIGH", "credit_exposure", 88.1, { daysSalesOutstanding: 52 }),
      risk("ops:OTC:risk:inv-5591:dispute", "OTC-INV-5591", "Collection dispute risk", "Disputed milestone blocks collections and increases bad-debt exposure.", "HIGH", "collection_exception", 82.4, { daysOverdue: 19 }),
    ],
    financeImpacts: [
      impact("ops:OTC:impact:so-7702", "OTC-SO-7702", "forecast_revenue", "Revenue pending credit release", 1840000, "INFLOW", "Q1 FY2026"),
      impact("ops:OTC:impact:inv-5591", "OTC-INV-5591", "overdue_receivable", "Overdue receivable exposure", 940000, "INFLOW", "May 2026"),
      impact("ops:OTC:impact:cash-1288", "OTC-CASH-1288", "unapplied_cash", "Cash receipt awaiting application", 410000, "INFLOW", "May 2026"),
    ],
    auditEvents: [
      audit("ops:OTC:audit:so-7702:credit", "OTC-SO-7702", "credit.limit.escalated", "AI credit control", "WARNING", { exposure: 1840000 }),
      audit("ops:OTC:audit:inv-5591:dispute", "OTC-INV-5591", "collection.dispute.logged", "Collections lead", "INFO", { reason: "milestone_acceptance" }),
    ],
  },
  {
    code: "R2R",
    name: "R2R - Record to Report",
    description:
      "Journal controls, reconciliations, close tasks, consolidation, and reporting assurance.",
    ownerRole: "auditor",
    financeCategory: "General ledger",
    stages: [
      stage("journal_intake", "Journal intake", "Manual and system journal preparation.", 1, "IN_PROGRESS", 12, "Journal policy check"),
      stage("substantiation", "Substantiation", "Attachment, account, and preparer evidence controls.", 2, "WAITING_APPROVAL", 12, "Evidence validation"),
      stage("reconciliation", "Reconciliation", "Bank, GST, sub-ledger, and control account matching.", 3, "BLOCKED", 24, "AI reconciliation"),
      stage("close_review", "Close review", "Controller review and close checklist completion.", 4, "IN_PROGRESS", 24, "Close task orchestration"),
      stage("consolidation", "Consolidation", "Entity consolidation, eliminations, and adjustments.", 5, "NOT_STARTED", 36, "Intercompany matching"),
      stage("reporting", "Reporting", "MIS, statutory, and board reporting packs.", 6, "NOT_STARTED", 24, "Report generation"),
    ],
    approvalFlows: [
      flow("Manual journal approval", "Requires reviewer approval for journals above materiality.", "Manual journal above INR 2L", 1, "finance-manager", "SEQUENTIAL", 200000),
      flow("Close sign-off", "Controller and auditor sign-off before period close.", "Close checklist completion", 2, "auditor", "PARALLEL"),
      flow("Consolidation adjustment approval", "Escalates group adjustments above materiality.", "Consolidation adjustment above INR 10L", 3, "cfo", "SEQUENTIAL", 1000000),
    ],
    records: [
      record("R2R-JE-4410", "Accrual journal approval", "Marketing accrual journal awaiting substantiation approval.", "substantiation", "WAITING_APPROVAL", 620000, "General ledger", "finance-manager", 10, undefined, 69, { account: "Marketing expenses" }),
      record("R2R-REC-2305", "Bank reconciliation break", "Unmatched bank statement lines exceed reconciliation tolerance.", "reconciliation", "EXCEPTION", 315000, "HDFC Bank", "auditor", 4, undefined, 90, { unmatchedLines: 14 }),
      record("R2R-CLOSE-0526", "Month-end close checklist", "Close task pack is in controller review.", "close_review", "OPEN", undefined, "Corporate accounting", "auditor", 22, undefined, 52, { closeDay: "D+2" }),
    ],
    riskAlerts: [
      risk("ops:R2R:risk:rec-2305:break", "R2R-REC-2305", "Reconciliation break above tolerance", "Bank reconciliation exceptions exceed materiality for the period.", "CRITICAL", "reconciliation_break", 91.6, { materiality: 250000 }),
      risk("ops:R2R:risk:je-4410:evidence", "R2R-JE-4410", "Missing journal evidence", "Accrual journal lacks vendor quote evidence required by policy.", "MEDIUM", "audit_evidence_gap", 76.8, { evidenceRequired: true }),
    ],
    financeImpacts: [
      impact("ops:R2R:impact:je-4410", "R2R-JE-4410", "accrual_expense", "Accrual awaiting approval", 620000, "OUTFLOW", "May 2026"),
      impact("ops:R2R:impact:rec-2305", "R2R-REC-2305", "unreconciled_cash", "Unreconciled cash movement", 315000, "NEUTRAL", "May 2026"),
      impact("ops:R2R:impact:close-0526", "R2R-CLOSE-0526", "close_readiness", "Close checklist exposure", 0, "NEUTRAL", "May 2026"),
    ],
    auditEvents: [
      audit("ops:R2R:audit:je-4410:evidence", "R2R-JE-4410", "journal.evidence.requested", "GL reviewer", "INFO", { evidenceType: "vendor_quote" }),
      audit("ops:R2R:audit:rec-2305:block", "R2R-REC-2305", "reconciliation.blocked", "AI reconciliation agent", "ERROR", { unmatchedLines: 14 }),
    ],
  },
  {
    code: "USER_OPERATIONS",
    name: "User Operations",
    description:
      "Access requests, provisioning, privilege reviews, offboarding, and license controls.",
    ownerRole: "organization-admin",
    financeCategory: "Workforce operations",
    stages: [
      stage("access_request", "Access request", "Employee or service account access intake.", 1, "COMPLETED", 8, "Role recommendation"),
      stage("manager_approval", "Manager approval", "Business justification and manager sign-off.", 2, "WAITING_APPROVAL", 8, "Approval routing"),
      stage("provisioning", "Provisioning", "Role assignment, MFA check, and application provisioning.", 3, "IN_PROGRESS", 12, "Identity automation"),
      stage("privilege_review", "Privilege review", "Quarterly privileged-access certification.", 4, "BLOCKED", 24, "Segregation-of-duties scan"),
      stage("offboarding", "Offboarding", "Account lock, session revoke, and asset recovery.", 5, "IN_PROGRESS", 4, "Deprovisioning playbook"),
      stage("audit_evidence", "Audit evidence", "Evidence package for auditors and compliance.", 6, "NOT_STARTED", 24, "Evidence collection"),
    ],
    approvalFlows: [
      flow("Privileged access approval", "Requires admin approval for elevated roles.", "Role contains admin or finance approval rights", 1, "organization-admin", "SEQUENTIAL"),
      flow("Segregation exception approval", "Escalates conflicting role combinations.", "SOD conflict detected", 2, "auditor", "ANY_ONE"),
      flow("Offboarding completion sign-off", "Requires HR and system owner confirmation.", "Employee exit date reached", 3, "manager", "PARALLEL"),
    ],
    records: [
      record("USER-REQ-9004", "Finance admin access request", "Temporary finance admin access request awaits manager approval.", "manager_approval", "WAITING_APPROVAL", undefined, "Priya Kapoor", "organization-admin", 7, undefined, 81, { requestedRole: "finance-manager", temporaryAccessDays: 5 }),
      record("USER-SOD-1182", "Conflicting approval roles", "User holds requester and approver permissions for vendor payments.", "privilege_review", "EXCEPTION", undefined, "Vikram Patel", "auditor", 3, undefined, 92, { conflict: "payment_requester_and_approver" }),
      record("USER-OFF-2041", "Contractor offboarding", "Exit workflow is in progress with active sessions pending revocation.", "offboarding", "OPEN", 37500, "Contractor license pool", "organization-admin", 4, undefined, 70, { activeSessions: 2 }),
    ],
    riskAlerts: [
      risk("ops:USER:risk:req-9004:privileged", "USER-REQ-9004", "Elevated access request", "Requested role grants finance approval authority and should remain time-bound.", "HIGH", "privileged_access", 89.7, { temporaryAccessDays: 5 }),
      risk("ops:USER:risk:sod-1182:conflict", "USER-SOD-1182", "Segregation-of-duties conflict", "User can both request and approve vendor payment workflows.", "CRITICAL", "sod_conflict", 94.3, { workflow: "vendor-payment" }),
    ],
    financeImpacts: [
      impact("ops:USER:impact:off-2041", "USER-OFF-2041", "license_recovery", "Recoverable contractor software licenses", 37500, "INFLOW", "May 2026"),
      impact("ops:USER:impact:req-9004", "USER-REQ-9004", "control_exposure", "Temporary privileged access control exposure", 0, "NEUTRAL", "May 2026"),
      impact("ops:USER:impact:sod-1182", "USER-SOD-1182", "approval_risk", "Vendor payment SOD exposure", 0, "NEUTRAL", "May 2026"),
    ],
    auditEvents: [
      audit("ops:USER:audit:req-9004:approval", "USER-REQ-9004", "access.approval.requested", "Identity automation", "INFO", { requestedRole: "finance-manager" }),
      audit("ops:USER:audit:sod-1182:block", "USER-SOD-1182", "sod.conflict.detected", "AI compliance control", "CRITICAL", { conflict: "payment_requester_and_approver" }),
    ],
  },
];

export async function seedOperationsData(
  prisma: PrismaClient,
  organizationId: string,
  actorUserId: string,
) {
  for (const definition of MODULES) {
    await seedOperationModule(prisma, organizationId, actorUserId, definition);
  }

  console.log("  Operations: seeded P2P, OTC, R2R, and User Operations modules");
}

async function seedOperationModule(
  prisma: PrismaClient,
  organizationId: string,
  actorUserId: string,
  definition: OperationModuleSeed,
) {
  const operationModule = await prisma.operationModule.upsert({
    where: {
      organizationId_code: {
        organizationId,
        code: definition.code,
      },
    },
    create: {
      organizationId,
      code: definition.code,
      name: definition.name,
      description: definition.description,
      ownerRole: definition.ownerRole,
      financeCategory: definition.financeCategory,
      metadata: moduleMetadata(definition),
    },
    update: {
      name: definition.name,
      description: definition.description,
      ownerRole: definition.ownerRole,
      financeCategory: definition.financeCategory,
      metadata: moduleMetadata(definition),
      deletedAt: null,
    },
  });

  const stageIds = new Map<string, string>();
  for (const item of definition.stages) {
    const stageRow = await prisma.operationWorkflowStage.upsert({
      where: {
        moduleId_stageKey: {
          moduleId: operationModule.id,
          stageKey: item.key,
        },
      },
      create: {
        organizationId,
        moduleId: operationModule.id,
        stageKey: item.key,
        name: item.name,
        description: item.description,
        sequence: item.sequence,
        status: item.status,
        slaHours: item.slaHours,
        automationLevel: item.automationLevel,
        metadata: { seedProfile: "enterprise-operations" },
      },
      update: {
        name: item.name,
        description: item.description,
        sequence: item.sequence,
        status: item.status,
        slaHours: item.slaHours,
        automationLevel: item.automationLevel,
        metadata: { seedProfile: "enterprise-operations" },
      },
      select: { id: true },
    });
    stageIds.set(item.key, stageRow.id);
  }

  const recordIds = new Map<string, string>();
  for (const item of definition.records) {
    const row = await prisma.operationRecord.upsert({
      where: {
        organizationId_reference: {
          organizationId,
          reference: item.reference,
        },
      },
      create: operationRecordData(organizationId, operationModule.id, stageIds, item),
      update: operationRecordData(organizationId, operationModule.id, stageIds, item),
      select: { id: true },
    });
    recordIds.set(item.reference, row.id);
  }

  for (const item of definition.approvalFlows) {
    await prisma.operationApprovalFlow.upsert({
      where: {
        moduleId_sequence: {
          moduleId: operationModule.id,
          sequence: item.sequence,
        },
      },
      create: approvalFlowData(organizationId, operationModule.id, item),
      update: approvalFlowData(organizationId, operationModule.id, item),
    });
  }

  for (const item of definition.riskAlerts) {
    await prisma.operationRiskAlert.upsert({
      where: {
        organizationId_sourceKey: {
          organizationId,
          sourceKey: item.sourceKey,
        },
      },
      create: riskAlertData(organizationId, operationModule.id, recordIds, item),
      update: riskAlertData(organizationId, operationModule.id, recordIds, item),
    });
  }

  for (const item of definition.financeImpacts) {
    await prisma.operationFinanceImpact.upsert({
      where: {
        organizationId_sourceKey: {
          organizationId,
          sourceKey: item.sourceKey,
        },
      },
      create: financeImpactData(organizationId, operationModule.id, recordIds, item),
      update: financeImpactData(organizationId, operationModule.id, recordIds, item),
    });
  }

  for (const item of definition.auditEvents) {
    const auditEvent = await prisma.operationAuditEvent.upsert({
      where: {
        organizationId_sourceKey: {
          organizationId,
          sourceKey: item.sourceKey,
        },
      },
      create: auditEventData(organizationId, operationModule.id, recordIds, item),
      update: auditEventData(organizationId, operationModule.id, recordIds, item),
      select: { id: true, recordId: true },
    });

    await ensureGlobalAuditLog(prisma, {
      organizationId,
      actorUserId,
      moduleCode: definition.code,
      auditEventId: auditEvent.id,
      recordId: auditEvent.recordId,
      sourceKey: item.sourceKey,
      action: item.action,
      severity: item.severity,
      details: item.details,
    });
  }
}

function operationRecordData(
  organizationId: string,
  moduleId: string,
  stageIds: Map<string, string>,
  item: RecordSeed,
) {
  const dueAt = item.dueInHours == null ? null : hoursFromNow(item.dueInHours);
  const completedAt =
    item.completedHoursAgo == null ? null : hoursFromNow(-item.completedHoursAgo);

  return {
    organizationId,
    moduleId,
    stageId: stageIds.get(item.stageKey) ?? null,
    reference: item.reference,
    title: item.title,
    description: item.description,
    status: item.status,
    amount: item.amount ?? null,
    currency: "INR",
    counterparty: item.counterparty ?? null,
    ownerRole: item.ownerRole,
    dueAt,
    completedAt,
    riskScore: item.riskScore,
    metadata: {
      seedProfile: "enterprise-operations",
      ...(item.metadata ?? {}),
    },
  };
}

function approvalFlowData(
  organizationId: string,
  moduleId: string,
  item: ApprovalFlowSeed,
) {
  return {
    organizationId,
    moduleId,
    name: item.name,
    description: item.description,
    trigger: item.trigger,
    sequence: item.sequence,
    approverRole: item.approverRole,
    approvalType: item.approvalType,
    thresholdAmount: item.thresholdAmount ?? null,
    isActive: true,
    metadata: {
      seedProfile: "enterprise-operations",
      ...(item.metadata ?? {}),
    },
  };
}

function riskAlertData(
  organizationId: string,
  moduleId: string,
  recordIds: Map<string, string>,
  item: RiskSeed,
) {
  return {
    organizationId,
    moduleId,
    recordId: item.recordReference ? recordIds.get(item.recordReference) ?? null : null,
    sourceKey: item.sourceKey,
    title: item.title,
    description: item.description,
    severity: item.severity,
    status: "OPEN",
    signalType: item.signalType,
    confidence: item.confidence,
    detectedAt: hoursFromNow(-2),
    resolvedAt: null,
    metadata: {
      seedProfile: "enterprise-operations",
      ...(item.metadata ?? {}),
    },
  };
}

function financeImpactData(
  organizationId: string,
  moduleId: string,
  recordIds: Map<string, string>,
  item: FinanceImpactSeed,
) {
  return {
    organizationId,
    moduleId,
    recordId: item.recordReference ? recordIds.get(item.recordReference) ?? null : null,
    sourceKey: item.sourceKey,
    impactType: item.impactType,
    title: item.title,
    amount: item.amount,
    currency: "INR",
    direction: item.direction,
    period: item.period,
    recognizedAt: new Date(),
    metadata: {
      seedProfile: "enterprise-operations",
      ...(item.metadata ?? {}),
    },
  };
}

function auditEventData(
  organizationId: string,
  moduleId: string,
  recordIds: Map<string, string>,
  item: AuditEventSeed,
) {
  return {
    organizationId,
    moduleId,
    recordId: item.recordReference ? recordIds.get(item.recordReference) ?? null : null,
    sourceKey: item.sourceKey,
    action: item.action,
    actor: item.actor,
    severity: item.severity,
    details: {
      seedProfile: "enterprise-operations",
      ...item.details,
    },
  };
}

async function ensureGlobalAuditLog(
  prisma: PrismaClient,
  params: {
    organizationId: string;
    actorUserId: string;
    moduleCode: ModuleCode;
    auditEventId: string;
    recordId: string | null;
    sourceKey: string;
    action: string;
    severity: AuditSeverity;
    details: Record<string, unknown>;
  },
) {
  const existing = await prisma.auditLog.findFirst({
    where: {
      organizationId: params.organizationId,
      action: params.action,
      resource: "operation",
      correlationId: params.sourceKey,
    },
    select: { id: true },
  });

  if (existing) return;

  await prisma.auditLog.create({
    data: {
      organizationId: params.organizationId,
      userId: params.actorUserId,
      action: params.action,
      resource: "operation",
      resourceId: params.recordId ?? params.auditEventId,
      severity: params.severity,
      after: asJson({
        moduleCode: params.moduleCode,
        details: params.details,
      }),
      metadata: asJson({
        source: "seed",
        moduleCode: params.moduleCode,
        operationAuditEventId: params.auditEventId,
      }),
      correlationId: params.sourceKey,
    },
  });
}

function stage(
  key: string,
  name: string,
  description: string,
  sequence: number,
  status: StageStatus,
  slaHours: number,
  automationLevel: string,
): StageSeed {
  return { key, name, description, sequence, status, slaHours, automationLevel };
}

function flow(
  name: string,
  description: string,
  trigger: string,
  sequence: number,
  approverRole: string,
  approvalType: ApprovalFlowSeed["approvalType"],
  thresholdAmount?: number,
  metadata?: Record<string, unknown>,
): ApprovalFlowSeed {
  return {
    name,
    description,
    trigger,
    sequence,
    approverRole,
    approvalType,
    thresholdAmount,
    metadata,
  };
}

function record(
  reference: string,
  title: string,
  description: string,
  stageKey: string,
  status: RecordStatus,
  amount: number | undefined,
  counterparty: string | undefined,
  ownerRole: string,
  dueInHours: number | undefined,
  completedHoursAgo: number | undefined,
  riskScore: number,
  metadata?: Record<string, unknown>,
): RecordSeed {
  return {
    reference,
    title,
    description,
    stageKey,
    status,
    amount,
    counterparty,
    ownerRole,
    dueInHours,
    completedHoursAgo,
    riskScore,
    metadata,
  };
}

function risk(
  sourceKey: string,
  recordReference: string,
  title: string,
  description: string,
  severity: RiskSeverity,
  signalType: string,
  confidence: number,
  metadata?: Record<string, unknown>,
): RiskSeed {
  return {
    sourceKey,
    recordReference,
    title,
    description,
    severity,
    signalType,
    confidence,
    metadata,
  };
}

function impact(
  sourceKey: string,
  recordReference: string,
  impactType: string,
  title: string,
  amount: number,
  direction: FinanceImpactSeed["direction"],
  period: string,
  metadata?: Record<string, unknown>,
): FinanceImpactSeed {
  return {
    sourceKey,
    recordReference,
    impactType,
    title,
    amount,
    direction,
    period,
    metadata,
  };
}

function audit(
  sourceKey: string,
  recordReference: string,
  action: string,
  actor: string,
  severity: AuditSeverity,
  details: Record<string, unknown>,
): AuditEventSeed {
  return {
    sourceKey,
    recordReference,
    action,
    actor,
    severity,
    details,
  };
}

function moduleMetadata(definition: OperationModuleSeed) {
  return {
    seedProfile: "enterprise-operations",
    recordCount: definition.records.length,
    stageCount: definition.stages.length,
    riskAlertCount: definition.riskAlerts.length,
    stageKeys: definition.stages.map((stageDefinition) => stageDefinition.key),
    recordReferences: definition.records.map((recordDefinition) => recordDefinition.reference),
  };
}

function hoursFromNow(hours: number): Date {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}

function asJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value ?? {})) as Prisma.InputJsonValue;
}
