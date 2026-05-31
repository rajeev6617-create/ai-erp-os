export type ManufacturingSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type ManufacturingTone = "success" | "warning" | "danger" | "info";

export interface ManufacturingWidget {
  key: string;
  label: string;
  value: string;
  change: string;
  trend: "up" | "down" | "neutral";
}

export interface ManufacturingCapability {
  key: string;
  label: string;
  description: string;
  status: string;
  openItems: number;
  ownerRole: string;
}

export interface ManufacturingAiInsight {
  id: string;
  insightType: string;
  title: string;
  description: string;
  severity: ManufacturingSeverity;
  confidence: number;
  recommendedAction: string;
  metric: string;
}

export interface BomRecord {
  id: string;
  bomNumber: string;
  productSku: string;
  productName: string;
  version: number;
  componentCount: number;
  yieldQuantity: number;
  standardCost: number;
  status: string;
  approvedBy: string;
}

export interface WorkOrderRecord {
  id: string;
  workOrderNumber: string;
  productSku: string;
  productName: string;
  lineCode: string;
  plannedQuantity: number;
  completedQuantity: number;
  rejectedQuantity: number;
  startAt: string;
  dueAt: string;
  status: string;
  owner: string;
}

export interface ProductionPlanRecord {
  id: string;
  planNumber: string;
  period: string;
  productName: string;
  plannedQuantity: number;
  releasedQuantity: number;
  capacityLoad: number;
  materialReadiness: number;
  status: string;
}

export interface MaterialFlowRecord {
  id: string;
  reference: string;
  flowType: "RAW_MATERIAL_ISSUE" | "FINISHED_GOODS_RECEIPT";
  workOrderNumber: string;
  itemSku: string;
  itemName: string;
  quantity: number;
  uom: string;
  location: string;
  value: number;
  status: string;
  occurredAt: string;
}

export interface JobWorkRecord {
  id: string;
  jobWorkNumber: string;
  vendorName: string;
  operation: string;
  itemName: string;
  issuedQuantity: number;
  receivedQuantity: number;
  dueAt: string;
  value: number;
  status: string;
}

export interface MachineLineRecord {
  id: string;
  lineCode: string;
  lineName: string;
  plant: string;
  shift: string;
  utilizationPercent: number;
  oeePercent: number;
  outputUnits: number;
  downtimeMinutes: number;
  status: string;
}

export interface ProductionVarianceRecord {
  id: string;
  reference: string;
  workOrderNumber: string;
  productName: string;
  varianceType: string;
  standardValue: number;
  actualValue: number;
  variancePercent: number;
  impact: number;
  status: string;
}

export interface QualityCheckRecord {
  id: string;
  inspectionNumber: string;
  inspectionType: "INCOMING_QC" | "IN_PROCESS_QC" | "FINAL_INSPECTION";
  reference: string;
  itemName: string;
  sampleSize: number;
  acceptedQuantity: number;
  rejectedQuantity: number;
  defectType: string;
  inspector: string;
  status: string;
  dueAt: string;
}

export interface RejectionRecord {
  id: string;
  reference: string;
  itemName: string;
  source: string;
  quantity: number;
  rejectionRate: number;
  defectType: string;
  disposition: string;
  status: string;
}

export interface NcrRecord {
  id: string;
  ncrNumber: string;
  source: string;
  issue: string;
  linkedReference: string;
  ownerRole: string;
  rootCause: string;
  dueAt: string;
  status: string;
}

export interface ManufacturingApproval {
  id: string;
  title: string;
  reference: string;
  workflow: string;
  ownerRole: string;
  impact: string;
  status: string;
  dueAt: string;
}

export interface InventoryLinkRecord {
  id: string;
  itemSku: string;
  itemName: string;
  linkageType: string;
  reference: string;
  requiredQuantity: number;
  availableQuantity: number;
  uom: string;
  warehouse: string;
  status: string;
}

export interface ManufacturingFinanceImpact {
  id: string;
  label: string;
  amount: number;
  context: string;
  tone: ManufacturingTone;
}

export interface ManufacturingPartyLink {
  id: string;
  partyType: "VENDOR" | "CUSTOMER";
  partyName: string;
  partyCode: string;
  linkage: string;
  reference: string;
  value: number;
  status: string;
}

export interface ManufacturingAuditEvent {
  id: string;
  action: string;
  resource: string;
  reference: string;
  actor: string;
  severity: ManufacturingSeverity;
  createdAt: string;
}

export interface ProductionQualityOperationsData {
  asOf: string;
  widgets: ManufacturingWidget[];
  productionCapabilities: ManufacturingCapability[];
  qualityCapabilities: ManufacturingCapability[];
  aiInsights: ManufacturingAiInsight[];
  boms: BomRecord[];
  workOrders: WorkOrderRecord[];
  plans: ProductionPlanRecord[];
  materialFlows: MaterialFlowRecord[];
  jobWorks: JobWorkRecord[];
  machines: MachineLineRecord[];
  variances: ProductionVarianceRecord[];
  qualityChecks: QualityCheckRecord[];
  rejections: RejectionRecord[];
  ncrs: NcrRecord[];
  approvals: ManufacturingApproval[];
  inventoryLinks: InventoryLinkRecord[];
  financeImpacts: ManufacturingFinanceImpact[];
  partyLinks: ManufacturingPartyLink[];
  auditLogs: ManufacturingAuditEvent[];
}

const productionQualityOperationsData: ProductionQualityOperationsData = {
  asOf: "2026-05-31T15:10:00+05:30",
  widgets: [
    {
      key: "active-work-orders",
      label: "Active work orders",
      value: "14",
      change: "3 due within 24 hours",
      trend: "neutral",
    },
    {
      key: "production-output",
      label: "Production output",
      value: "1,286 EA",
      change: "94.2% of daily plan",
      trend: "up",
    },
    {
      key: "rejection-rate",
      label: "Rejection rate",
      value: "2.7%",
      change: "0.6% above target",
      trend: "down",
    },
    {
      key: "machine-utilization",
      label: "Machine utilization",
      value: "82%",
      change: "Line ASM-02 at 91%",
      trend: "up",
    },
    {
      key: "pending-qc",
      label: "Pending QC",
      value: "9",
      change: "2 quality holds require approval",
      trend: "down",
    },
    {
      key: "production-delays",
      label: "Production delays",
      value: "3",
      change: "Servo kit shortage drives 1 delay",
      trend: "down",
    },
  ],
  productionCapabilities: [
    {
      key: "bom-management",
      label: "BOM Management",
      description: "Versioned material structures, costing, yield, and engineering approval.",
      status: "ACTIVE",
      openItems: 42,
      ownerRole: "Engineering manager",
    },
    {
      key: "work-orders",
      label: "Work Orders",
      description: "Release, execution, progress, rejection, and completion control.",
      status: "ATTENTION",
      openItems: 14,
      ownerRole: "Production manager",
    },
    {
      key: "production-planning",
      label: "Production Planning",
      description: "Capacity loading, material readiness, and schedule commitment.",
      status: "ACTIVE",
      openItems: 8,
      ownerRole: "Production planner",
    },
    {
      key: "raw-material-issue",
      label: "Raw Material Issue",
      description: "Warehouse-linked component issue against released work orders.",
      status: "ATTENTION",
      openItems: 6,
      ownerRole: "Stores controller",
    },
    {
      key: "finished-goods-receipt",
      label: "Finished Goods Receipt",
      description: "Completed output posting with final inspection release control.",
      status: "ACTIVE",
      openItems: 5,
      ownerRole: "Production supervisor",
    },
    {
      key: "job-work",
      label: "Job Work Tracking",
      description: "Subcontract issue, receipt, due-date, and vendor exposure tracking.",
      status: "ATTENTION",
      openItems: 4,
      ownerRole: "Subcontract coordinator",
    },
    {
      key: "line-utilization",
      label: "Machine / Line Utilization",
      description: "Shift-level utilization, OEE, output, and downtime visibility.",
      status: "ACTIVE",
      openItems: 6,
      ownerRole: "Plant manager",
    },
    {
      key: "variance",
      label: "Production Variance",
      description: "Material, yield, labor, and cycle-time deviation governance.",
      status: "ATTENTION",
      openItems: 5,
      ownerRole: "Cost controller",
    },
  ],
  qualityCapabilities: [
    {
      key: "incoming-qc",
      label: "Incoming QC",
      description: "Supplier receipt sampling, quality hold, and release decision.",
      status: "ATTENTION",
      openItems: 4,
      ownerRole: "Incoming quality lead",
    },
    {
      key: "in-process-qc",
      label: "In-process QC",
      description: "Stage-gate inspection across assembly, coating, and wiring.",
      status: "ATTENTION",
      openItems: 3,
      ownerRole: "Line quality engineer",
    },
    {
      key: "final-inspection",
      label: "Final Inspection",
      description: "Finished-goods acceptance before receipt and dispatch release.",
      status: "ACTIVE",
      openItems: 2,
      ownerRole: "Final inspection lead",
    },
    {
      key: "rejection-tracking",
      label: "Rejection Tracking",
      description: "Defect classification, disposition, recovery, and trend visibility.",
      status: "ATTENTION",
      openItems: 18,
      ownerRole: "Quality manager",
    },
    {
      key: "ncr-reports",
      label: "NCR Reports",
      description: "Non-conformance reporting, root cause, CAPA, and closure control.",
      status: "BLOCKED",
      openItems: 4,
      ownerRole: "Quality manager",
    },
    {
      key: "quality-workflow",
      label: "Quality Approval Workflow",
      description: "Maker-checker release for holds, deviations, and dispositions.",
      status: "ATTENTION",
      openItems: 5,
      ownerRole: "Head of quality",
    },
  ],
  aiInsights: [
    {
      id: "ai-delay-001",
      insightType: "PRODUCTION_DELAY_PREDICTION",
      title: "Control cabinet work order may miss its due date",
      description:
        "Servo motor availability and ASM-02 cycle time indicate a likely six-hour schedule slip.",
      severity: "CRITICAL",
      confidence: 94,
      recommendedAction: "Expedite servo kit replenishment and move 24 units to ASM-01 night shift.",
      metric: "6 hr delay",
    },
    {
      id: "ai-quality-001",
      insightType: "QUALITY_RISK_ALERT",
      title: "PLC controller incoming quality risk increased",
      description:
        "Recent sampling failures from ElectroCore Systems are above the supplier baseline.",
      severity: "HIGH",
      confidence: 91,
      recommendedAction: "Expand sampling to 100% for GRN-260530-017 and request supplier CAPA.",
      metric: "8.8% fail risk",
    },
    {
      id: "ai-rejection-001",
      insightType: "REJECTION_TREND_ANALYSIS",
      title: "Coating blemish rejection trend is rising",
      description:
        "Powder coating rejection has increased across three shifts on LINE-PC-01.",
      severity: "MEDIUM",
      confidence: 88,
      recommendedAction: "Review booth temperature, powder mix, and operator checklist compliance.",
      metric: "+1.2% WoW",
    },
    {
      id: "ai-shortage-001",
      insightType: "MATERIAL_SHORTAGE_PREDICTION",
      title: "Servo motor kit shortage will constrain output",
      description:
        "Available inventory covers four days while released demand requires another 62 kits.",
      severity: "HIGH",
      confidence: 96,
      recommendedAction: "Approve the linked purchase expedite before releasing WO-2606-119.",
      metric: "62 EA gap",
    },
    {
      id: "ai-efficiency-001",
      insightType: "EFFICIENCY_RECOMMENDATION",
      title: "Line balancing can improve assembly throughput",
      description:
        "Wiring station idle time overlaps with cabinet frame queue buildup during shift B.",
      severity: "LOW",
      confidence: 84,
      recommendedAction: "Move one technician from wiring pre-check to frame preparation for shift B.",
      metric: "+7.4% output",
    },
  ],
  boms: [
    {
      id: "bom-001",
      bomNumber: "BOM-ACAB-004",
      productSku: "FG-ASTRA-CAB",
      productName: "ASTRA Smart Control Cabinet",
      version: 4,
      componentCount: 28,
      yieldQuantity: 1,
      standardCost: 51000,
      status: "ACTIVE",
      approvedBy: "Engineering change board",
    },
    {
      id: "bom-002",
      bomNumber: "BOM-MCC-002",
      productSku: "FG-MCC-400",
      productName: "MCC Panel 400A",
      version: 2,
      componentCount: 34,
      yieldQuantity: 1,
      standardCost: 74200,
      status: "ACTIVE",
      approvedBy: "Priya Menon",
    },
    {
      id: "bom-003",
      bomNumber: "BOM-VFD-003",
      productSku: "FG-VFD-30KW",
      productName: "VFD Drive Panel 30kW",
      version: 3,
      componentCount: 22,
      yieldQuantity: 1,
      standardCost: 63800,
      status: "REVISION_PENDING",
      approvedBy: "Engineering review pending",
    },
    {
      id: "bom-004",
      bomNumber: "BOM-JBX-006",
      productSku: "FG-JBX-SS",
      productName: "Stainless Junction Box",
      version: 6,
      componentCount: 12,
      yieldQuantity: 1,
      standardCost: 8600,
      status: "ACTIVE",
      approvedBy: "Manoj Iyer",
    },
  ],
  workOrders: [
    {
      id: "wo-001",
      workOrderNumber: "WO-2605-118",
      productSku: "FG-ASTRA-CAB",
      productName: "ASTRA Smart Control Cabinet",
      lineCode: "ASM-02",
      plannedQuantity: 180,
      completedQuantity: 124,
      rejectedQuantity: 4,
      startAt: "2026-05-30T06:00:00+05:30",
      dueAt: "2026-06-01T18:00:00+05:30",
      status: "DELAY_RISK",
      owner: "Neeraj Sharma",
    },
    {
      id: "wo-002",
      workOrderNumber: "WO-2605-117",
      productSku: "FG-MCC-400",
      productName: "MCC Panel 400A",
      lineCode: "ASM-01",
      plannedQuantity: 96,
      completedQuantity: 82,
      rejectedQuantity: 1,
      startAt: "2026-05-29T06:00:00+05:30",
      dueAt: "2026-05-31T20:00:00+05:30",
      status: "IN_PROGRESS",
      owner: "Shalini Bose",
    },
    {
      id: "wo-003",
      workOrderNumber: "WO-2605-116",
      productSku: "FG-JBX-SS",
      productName: "Stainless Junction Box",
      lineCode: "FAB-01",
      plannedQuantity: 420,
      completedQuantity: 420,
      rejectedQuantity: 8,
      startAt: "2026-05-29T07:00:00+05:30",
      dueAt: "2026-05-31T12:00:00+05:30",
      status: "QC_PENDING",
      owner: "Arun Dev",
    },
    {
      id: "wo-004",
      workOrderNumber: "WO-2605-115",
      productSku: "FG-VFD-30KW",
      productName: "VFD Drive Panel 30kW",
      lineCode: "ASM-03",
      plannedQuantity: 72,
      completedQuantity: 48,
      rejectedQuantity: 2,
      startAt: "2026-05-30T10:00:00+05:30",
      dueAt: "2026-06-02T16:00:00+05:30",
      status: "IN_PROGRESS",
      owner: "Meera Pillai",
    },
    {
      id: "wo-005",
      workOrderNumber: "WO-2605-114",
      productSku: "FG-ASTRA-CAB",
      productName: "ASTRA Smart Control Cabinet",
      lineCode: "ASM-01",
      plannedQuantity: 140,
      completedQuantity: 140,
      rejectedQuantity: 3,
      startAt: "2026-05-28T06:00:00+05:30",
      dueAt: "2026-05-30T18:00:00+05:30",
      status: "COMPLETED",
      owner: "Shalini Bose",
    },
  ],
  plans: [
    {
      id: "plan-001",
      planNumber: "PLAN-JUN-W01",
      period: "01-07 Jun 2026",
      productName: "ASTRA Smart Control Cabinet",
      plannedQuantity: 620,
      releasedQuantity: 460,
      capacityLoad: 91,
      materialReadiness: 84,
      status: "ATTENTION",
    },
    {
      id: "plan-002",
      planNumber: "PLAN-JUN-W01-MCC",
      period: "01-07 Jun 2026",
      productName: "MCC Panel 400A",
      plannedQuantity: 280,
      releasedQuantity: 180,
      capacityLoad: 76,
      materialReadiness: 96,
      status: "RELEASED",
    },
    {
      id: "plan-003",
      planNumber: "PLAN-JUN-W01-VFD",
      period: "01-07 Jun 2026",
      productName: "VFD Drive Panel 30kW",
      plannedQuantity: 210,
      releasedQuantity: 144,
      capacityLoad: 68,
      materialReadiness: 92,
      status: "RELEASED",
    },
    {
      id: "plan-004",
      planNumber: "PLAN-JUN-W01-JBX",
      period: "01-07 Jun 2026",
      productName: "Stainless Junction Box",
      plannedQuantity: 920,
      releasedQuantity: 720,
      capacityLoad: 83,
      materialReadiness: 98,
      status: "RELEASED",
    },
  ],
  materialFlows: [
    {
      id: "flow-001",
      reference: "MI-260531-042",
      flowType: "RAW_MATERIAL_ISSUE",
      workOrderNumber: "WO-2605-118",
      itemSku: "COMP-SRV-750",
      itemName: "Servo Motor Kit 750W",
      quantity: 48,
      uom: "EA",
      location: "BLR-RM / B-03-02",
      value: 576000,
      status: "POSTED",
      occurredAt: "2026-05-31T09:18:00+05:30",
    },
    {
      id: "flow-002",
      reference: "MI-260531-043",
      flowType: "RAW_MATERIAL_ISSUE",
      workOrderNumber: "WO-2605-117",
      itemSku: "RM-AL-6061",
      itemName: "Aluminium Sheet 6061-T6",
      quantity: 640,
      uom: "KG",
      location: "BLR-RM / A-01-04",
      value: 198400,
      status: "POSTED",
      occurredAt: "2026-05-31T10:08:00+05:30",
    },
    {
      id: "flow-003",
      reference: "FGR-260531-031",
      flowType: "FINISHED_GOODS_RECEIPT",
      workOrderNumber: "WO-2605-114",
      itemSku: "FG-ASTRA-CAB",
      itemName: "ASTRA Smart Control Cabinet",
      quantity: 140,
      uom: "EA",
      location: "PUN-FG / FG-01-01",
      value: 7140000,
      status: "POSTED",
      occurredAt: "2026-05-31T10:42:00+05:30",
    },
    {
      id: "flow-004",
      reference: "FGR-260531-032",
      flowType: "FINISHED_GOODS_RECEIPT",
      workOrderNumber: "WO-2605-116",
      itemSku: "FG-JBX-SS",
      itemName: "Stainless Junction Box",
      quantity: 420,
      uom: "EA",
      location: "PUN-FG / FG-03-02",
      value: 3612000,
      status: "QC_HOLD",
      occurredAt: "2026-05-31T11:26:00+05:30",
    },
  ],
  jobWorks: [
    {
      id: "job-001",
      jobWorkNumber: "JW-2605-088",
      vendorName: "Precision Coat Services",
      operation: "Powder coating",
      itemName: "Cabinet enclosure",
      issuedQuantity: 240,
      receivedQuantity: 180,
      dueAt: "2026-06-01T14:00:00+05:30",
      value: 216000,
      status: "IN_PROGRESS",
    },
    {
      id: "job-002",
      jobWorkNumber: "JW-2605-087",
      vendorName: "SparkFab Industries",
      operation: "Laser cutting",
      itemName: "MCC panel plate set",
      issuedQuantity: 126,
      receivedQuantity: 126,
      dueAt: "2026-05-31T10:00:00+05:30",
      value: 138600,
      status: "RECEIVED",
    },
    {
      id: "job-003",
      jobWorkNumber: "JW-2605-086",
      vendorName: "Precision Coat Services",
      operation: "Powder coating",
      itemName: "Junction box shell",
      issuedQuantity: 520,
      receivedQuantity: 468,
      dueAt: "2026-05-31T18:00:00+05:30",
      value: 88400,
      status: "DELAY_RISK",
    },
    {
      id: "job-004",
      jobWorkNumber: "JW-2605-085",
      vendorName: "Electra Wiring Works",
      operation: "Harness assembly",
      itemName: "Control cabinet harness",
      issuedQuantity: 180,
      receivedQuantity: 180,
      dueAt: "2026-05-30T16:00:00+05:30",
      value: 162000,
      status: "COMPLETED",
    },
  ],
  machines: [
    {
      id: "machine-001",
      lineCode: "ASM-01",
      lineName: "Panel Assembly Line 1",
      plant: "Bengaluru Plant",
      shift: "A + B",
      utilizationPercent: 86,
      oeePercent: 79,
      outputUnits: 312,
      downtimeMinutes: 42,
      status: "ACTIVE",
    },
    {
      id: "machine-002",
      lineCode: "ASM-02",
      lineName: "Smart Cabinet Assembly",
      plant: "Bengaluru Plant",
      shift: "A + B",
      utilizationPercent: 91,
      oeePercent: 74,
      outputUnits: 248,
      downtimeMinutes: 86,
      status: "ATTENTION",
    },
    {
      id: "machine-003",
      lineCode: "ASM-03",
      lineName: "VFD Assembly Cell",
      plant: "Bengaluru Plant",
      shift: "A",
      utilizationPercent: 68,
      oeePercent: 81,
      outputUnits: 96,
      downtimeMinutes: 24,
      status: "ACTIVE",
    },
    {
      id: "machine-004",
      lineCode: "FAB-01",
      lineName: "Sheet Metal Fabrication",
      plant: "Pune Plant",
      shift: "A + B",
      utilizationPercent: 84,
      oeePercent: 77,
      outputUnits: 524,
      downtimeMinutes: 58,
      status: "ACTIVE",
    },
    {
      id: "machine-005",
      lineCode: "LINE-PC-01",
      lineName: "Powder Coating Booth",
      plant: "Pune Plant",
      shift: "A + B",
      utilizationPercent: 78,
      oeePercent: 69,
      outputUnits: 386,
      downtimeMinutes: 94,
      status: "QUALITY_REVIEW",
    },
  ],
  variances: [
    {
      id: "var-001",
      reference: "VAR-260531-018",
      workOrderNumber: "WO-2605-118",
      productName: "ASTRA Smart Control Cabinet",
      varianceType: "CYCLE_TIME",
      standardValue: 42,
      actualValue: 48,
      variancePercent: 14.3,
      impact: 68400,
      status: "ATTENTION",
    },
    {
      id: "var-002",
      reference: "VAR-260531-017",
      workOrderNumber: "WO-2605-116",
      productName: "Stainless Junction Box",
      varianceType: "MATERIAL_YIELD",
      standardValue: 98,
      actualValue: 96.1,
      variancePercent: -1.9,
      impact: 24400,
      status: "REVIEW",
    },
    {
      id: "var-003",
      reference: "VAR-260531-016",
      workOrderNumber: "WO-2605-117",
      productName: "MCC Panel 400A",
      varianceType: "LABOR_HOURS",
      standardValue: 312,
      actualValue: 326,
      variancePercent: 4.5,
      impact: 19600,
      status: "REVIEW",
    },
  ],
  qualityChecks: [
    {
      id: "qc-001",
      inspectionNumber: "IQC-260530-017",
      inspectionType: "INCOMING_QC",
      reference: "GRN-260530-017",
      itemName: "PLC Controller 24 I/O",
      sampleSize: 20,
      acceptedQuantity: 18,
      rejectedQuantity: 2,
      defectType: "I/O response failure",
      inspector: "Farhan Ali",
      status: "QUALITY_HOLD",
      dueAt: "2026-05-31T12:30:00+05:30",
    },
    {
      id: "qc-002",
      inspectionNumber: "IPQC-260531-064",
      inspectionType: "IN_PROCESS_QC",
      reference: "WO-2605-118",
      itemName: "ASTRA Smart Control Cabinet",
      sampleSize: 36,
      acceptedQuantity: 34,
      rejectedQuantity: 2,
      defectType: "Terminal torque variance",
      inspector: "Nisha Verma",
      status: "REWORK",
      dueAt: "2026-05-31T16:00:00+05:30",
    },
    {
      id: "qc-003",
      inspectionNumber: "FI-260531-032",
      inspectionType: "FINAL_INSPECTION",
      reference: "FGR-260531-032",
      itemName: "Stainless Junction Box",
      sampleSize: 52,
      acceptedQuantity: 50,
      rejectedQuantity: 2,
      defectType: "Coating blemish",
      inspector: "Lakshmi Nair",
      status: "APPROVAL_PENDING",
      dueAt: "2026-05-31T15:30:00+05:30",
    },
    {
      id: "qc-004",
      inspectionNumber: "IPQC-260531-063",
      inspectionType: "IN_PROCESS_QC",
      reference: "WO-2605-117",
      itemName: "MCC Panel 400A",
      sampleSize: 24,
      acceptedQuantity: 24,
      rejectedQuantity: 0,
      defectType: "None",
      inspector: "Nisha Verma",
      status: "PASSED",
      dueAt: "2026-05-31T13:00:00+05:30",
    },
    {
      id: "qc-005",
      inspectionNumber: "FI-260531-031",
      inspectionType: "FINAL_INSPECTION",
      reference: "FGR-260531-031",
      itemName: "ASTRA Smart Control Cabinet",
      sampleSize: 28,
      acceptedQuantity: 28,
      rejectedQuantity: 0,
      defectType: "None",
      inspector: "Lakshmi Nair",
      status: "PASSED",
      dueAt: "2026-05-31T11:00:00+05:30",
    },
  ],
  rejections: [
    {
      id: "rej-001",
      reference: "REJ-260531-028",
      itemName: "ASTRA Smart Control Cabinet",
      source: "WO-2605-118 / ASM-02",
      quantity: 4,
      rejectionRate: 3.2,
      defectType: "Terminal torque variance",
      disposition: "Rework",
      status: "OPEN",
    },
    {
      id: "rej-002",
      reference: "REJ-260531-027",
      itemName: "Stainless Junction Box",
      source: "WO-2605-116 / LINE-PC-01",
      quantity: 8,
      rejectionRate: 1.9,
      defectType: "Coating blemish",
      disposition: "Sort and recoat",
      status: "INVESTIGATION",
    },
    {
      id: "rej-003",
      reference: "REJ-260530-026",
      itemName: "PLC Controller 24 I/O",
      source: "GRN-260530-017 / ElectroCore Systems",
      quantity: 2,
      rejectionRate: 10,
      defectType: "I/O response failure",
      disposition: "Supplier return",
      status: "QUALITY_HOLD",
    },
    {
      id: "rej-004",
      reference: "REJ-260530-025",
      itemName: "VFD Drive Panel 30kW",
      source: "WO-2605-115 / ASM-03",
      quantity: 2,
      rejectionRate: 4.2,
      defectType: "Wiring continuity",
      disposition: "Rework",
      status: "CLOSED",
    },
  ],
  ncrs: [
    {
      id: "ncr-001",
      ncrNumber: "NCR-260531-014",
      source: "Incoming QC",
      issue: "PLC controller sample failed I/O response validation",
      linkedReference: "GRN-260530-017",
      ownerRole: "Supplier quality engineer",
      rootCause: "Supplier analysis pending",
      dueAt: "2026-06-02T17:00:00+05:30",
      status: "OPEN",
    },
    {
      id: "ncr-002",
      ncrNumber: "NCR-260531-013",
      source: "In-process QC",
      issue: "Terminal torque variance above control limit",
      linkedReference: "WO-2605-118",
      ownerRole: "Production quality engineer",
      rootCause: "Tool calibration under review",
      dueAt: "2026-06-01T12:00:00+05:30",
      status: "CAPA_PENDING",
    },
    {
      id: "ncr-003",
      ncrNumber: "NCR-260531-012",
      source: "Final inspection",
      issue: "Powder coat blemish cluster on junction box shell",
      linkedReference: "FGR-260531-032",
      ownerRole: "Process quality engineer",
      rootCause: "Booth temperature drift suspected",
      dueAt: "2026-06-01T15:00:00+05:30",
      status: "INVESTIGATION",
    },
    {
      id: "ncr-004",
      ncrNumber: "NCR-260529-011",
      source: "Customer complaint",
      issue: "Loose cable marker found during customer commissioning",
      linkedReference: "SO-88196",
      ownerRole: "Customer quality lead",
      rootCause: "Work instruction updated",
      dueAt: "2026-05-31T17:00:00+05:30",
      status: "CLOSURE_PENDING",
    },
  ],
  approvals: [
    {
      id: "approval-001",
      title: "Release PLC controller incoming quality hold",
      reference: "IQC-260530-017",
      workflow: "Incoming QC release",
      ownerRole: "Head of quality",
      impact: "80 EA blocked | INR 10.24 L inventory value",
      status: "BLOCKED",
      dueAt: "2026-05-31T16:00:00+05:30",
    },
    {
      id: "approval-002",
      title: "Approve junction box final inspection disposition",
      reference: "FI-260531-032",
      workflow: "Final inspection",
      ownerRole: "Quality manager",
      impact: "420 EA finished goods receipt on hold",
      status: "PENDING",
      dueAt: "2026-05-31T15:30:00+05:30",
    },
    {
      id: "approval-003",
      title: "Approve cycle-time variance recovery plan",
      reference: "VAR-260531-018",
      workflow: "Production variance",
      ownerRole: "Plant manager",
      impact: "INR 68,400 unfavorable conversion variance",
      status: "PENDING",
      dueAt: "2026-06-01T10:00:00+05:30",
    },
    {
      id: "approval-004",
      title: "Approve BOM revision for VFD panel",
      reference: "BOM-VFD-003",
      workflow: "Engineering change",
      ownerRole: "Engineering manager",
      impact: "210 EA June plan affected",
      status: "PENDING",
      dueAt: "2026-06-01T12:00:00+05:30",
    },
    {
      id: "approval-005",
      title: "Approve expedited servo motor replenishment",
      reference: "REQ-260531-034",
      workflow: "Material shortage exception",
      ownerRole: "Procurement manager",
      impact: "62 EA material gap | WO-2605-118 delay risk",
      status: "PENDING",
      dueAt: "2026-05-31T16:30:00+05:30",
    },
  ],
  inventoryLinks: [
    {
      id: "inventory-001",
      itemSku: "COMP-SRV-750",
      itemName: "Servo Motor Kit 750W",
      linkageType: "RAW_MATERIAL_DEMAND",
      reference: "WO-2605-118",
      requiredQuantity: 78,
      availableQuantity: 16,
      uom: "EA",
      warehouse: "BLR-RM / B-03-02",
      status: "SHORTAGE",
    },
    {
      id: "inventory-002",
      itemSku: "RM-AL-6061",
      itemName: "Aluminium Sheet 6061-T6",
      linkageType: "RAW_MATERIAL_ISSUE",
      reference: "MI-260531-043",
      requiredQuantity: 640,
      availableQuantity: 3570,
      uom: "KG",
      warehouse: "BLR-RM / A-01-04",
      status: "ISSUED",
    },
    {
      id: "inventory-003",
      itemSku: "FG-ASTRA-CAB",
      itemName: "ASTRA Smart Control Cabinet",
      linkageType: "FINISHED_GOODS_RECEIPT",
      reference: "FGR-260531-031",
      requiredQuantity: 140,
      availableQuantity: 140,
      uom: "EA",
      warehouse: "PUN-FG / FG-01-01",
      status: "POSTED",
    },
    {
      id: "inventory-004",
      itemSku: "FG-JBX-SS",
      itemName: "Stainless Junction Box",
      linkageType: "FINISHED_GOODS_RECEIPT",
      reference: "FGR-260531-032",
      requiredQuantity: 420,
      availableQuantity: 0,
      uom: "EA",
      warehouse: "PUN-FG / QC-HOLD-02",
      status: "QC_HOLD",
    },
  ],
  financeImpacts: [
    {
      id: "finance-001",
      label: "Daily production value",
      amount: 18240000,
      context: "Posted and inspection-pending finished goods output",
      tone: "success",
    },
    {
      id: "finance-002",
      label: "Unfavorable production variance",
      amount: 112400,
      context: "Cycle-time, yield, and labor deviations awaiting review",
      tone: "danger",
    },
    {
      id: "finance-003",
      label: "Quality hold value",
      amount: 4636000,
      context: "Incoming materials and finished goods blocked by quality gates",
      tone: "warning",
    },
    {
      id: "finance-004",
      label: "Open job-work exposure",
      amount: 442800,
      context: "Subcontract materials and processing value outside the plant",
      tone: "info",
    },
  ],
  partyLinks: [
    {
      id: "party-001",
      partyType: "VENDOR",
      partyName: "ElectroCore Systems",
      partyCode: "VEN-00146",
      linkage: "Incoming QC hold and supplier CAPA",
      reference: "GRN-260530-017",
      value: 1024000,
      status: "QUALITY_REVIEW",
    },
    {
      id: "party-002",
      partyType: "VENDOR",
      partyName: "Precision Coat Services",
      partyCode: "VEN-00218",
      linkage: "Powder coating job work",
      reference: "JW-2605-088",
      value: 216000,
      status: "IN_PROGRESS",
    },
    {
      id: "party-003",
      partyType: "CUSTOMER",
      partyName: "Vertex Automation Pvt Ltd",
      partyCode: "CUS-00042",
      linkage: "Committed cabinet delivery",
      reference: "SO-88264",
      value: 2366000,
      status: "DISPATCH_READY",
    },
    {
      id: "party-004",
      partyType: "CUSTOMER",
      partyName: "Nova Process Systems",
      partyCode: "CUS-00067",
      linkage: "MCC panel fulfillment plan",
      reference: "SO-88258",
      value: 1698000,
      status: "IN_PRODUCTION",
    },
  ],
  auditLogs: [
    {
      id: "audit-001",
      action: "production.delay.predicted",
      resource: "Work order",
      reference: "WO-2605-118",
      actor: "ASTRA AI",
      severity: "CRITICAL",
      createdAt: "2026-05-31T14:58:00+05:30",
    },
    {
      id: "audit-002",
      action: "quality.hold.applied",
      resource: "Incoming QC",
      reference: "IQC-260530-017",
      actor: "Farhan Ali",
      severity: "HIGH",
      createdAt: "2026-05-31T14:42:00+05:30",
    },
    {
      id: "audit-003",
      action: "production.variance.submitted",
      resource: "Production variance",
      reference: "VAR-260531-018",
      actor: "Neeraj Sharma",
      severity: "MEDIUM",
      createdAt: "2026-05-31T14:26:00+05:30",
    },
    {
      id: "audit-004",
      action: "finished.goods.receipt.posted",
      resource: "Finished goods receipt",
      reference: "FGR-260531-031",
      actor: "Shalini Bose",
      severity: "LOW",
      createdAt: "2026-05-31T10:44:00+05:30",
    },
    {
      id: "audit-005",
      action: "ncr.created",
      resource: "Non-conformance report",
      reference: "NCR-260531-013",
      actor: "Nisha Verma",
      severity: "HIGH",
      createdAt: "2026-05-31T10:16:00+05:30",
    },
    {
      id: "audit-006",
      action: "raw.material.issue.posted",
      resource: "Material issue",
      reference: "MI-260531-042",
      actor: "Stores team - BLR",
      severity: "LOW",
      createdAt: "2026-05-31T09:20:00+05:30",
    },
  ],
};

export function getProductionQualityOperationsData(): ProductionQualityOperationsData {
  return productionQualityOperationsData;
}
