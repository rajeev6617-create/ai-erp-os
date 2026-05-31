export type InventorySeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type InventoryTone = "success" | "warning" | "danger" | "info";

export interface InventoryWidget {
  key: string;
  label: string;
  value: string;
  change: string;
  trend: "up" | "down" | "neutral";
}

export interface InventoryCapability {
  key: string;
  label: string;
  description: string;
  status: string;
  openItems: number;
  ownerRole: string;
}

export interface InventoryAiInsight {
  id: string;
  insightType: string;
  title: string;
  description: string;
  severity: InventorySeverity;
  confidence: number;
  recommendedAction: string;
  metric: string;
}

export interface ItemMasterRecord {
  id: string;
  sku: string;
  name: string;
  category: string;
  itemType: string;
  uom: string;
  onHand: number;
  reserved: number;
  available: number;
  reorderLevel: number;
  safetyStock: number;
  stockValue: number;
  coverageDays: number;
  movementClass: "FAST" | "MEDIUM" | "SLOW";
  batchTracked: boolean;
  serialTracked: boolean;
  vendorName: string;
}

export interface StockLedgerEntry {
  id: string;
  movementNumber: string;
  occurredAt: string;
  movementType: string;
  itemSku: string;
  itemName: string;
  source: string;
  destination: string;
  quantity: number;
  uom: string;
  value: number;
  status: string;
  reference: string;
}

export interface TraceabilityRecord {
  id: string;
  traceType: "BATCH" | "SERIAL";
  traceNumber: string;
  itemSku: string;
  itemName: string;
  warehouse: string;
  binCode: string;
  quantity: number;
  status: string;
  expiryDate: string | null;
  lastMovement: string;
}

export interface WarehouseRecord {
  id: string;
  code: string;
  name: string;
  location: string;
  warehouseType: string;
  status: string;
  manager: string;
  capacityUnits: number;
  utilizedUnits: number;
  utilizationPercent: number;
  binCount: number;
  openGrns: number;
  openDispatches: number;
}

export interface BinLocationRecord {
  id: string;
  warehouseCode: string;
  binCode: string;
  zone: string;
  binType: string;
  itemSku: string;
  itemName: string;
  occupiedUnits: number;
  capacityUnits: number;
  utilizationPercent: number;
  status: string;
}

export interface GrnRecord {
  id: string;
  grnNumber: string;
  poNumber: string;
  vendorName: string;
  warehouseCode: string;
  receivedAt: string;
  itemCount: number;
  totalQuantity: number;
  invoiceValue: number;
  qualityStatus: string;
  status: string;
}

export interface DispatchRecord {
  id: string;
  dispatchNumber: string;
  salesOrder: string;
  customerName: string;
  warehouseCode: string;
  plannedShipAt: string;
  carrier: string;
  itemCount: number;
  totalQuantity: number;
  orderValue: number;
  status: string;
}

export interface MaterialMovementRecord {
  id: string;
  movementNumber: string;
  movementType: string;
  itemSku: string;
  itemName: string;
  fromLocation: string;
  toLocation: string;
  quantity: number;
  occurredAt: string;
  handledBy: string;
  status: string;
}

export interface InventoryApproval {
  id: string;
  title: string;
  reference: string;
  workflow: string;
  ownerRole: string;
  impact: string;
  status: string;
  dueAt: string;
}

export interface InventoryFinanceImpact {
  id: string;
  label: string;
  amount: number;
  context: string;
  tone: InventoryTone;
}

export interface VendorLink {
  id: string;
  vendorName: string;
  vendorCode: string;
  linkedSkus: number;
  openGrns: number;
  leadTimeDays: number;
  onTimeDelivery: number;
  exposure: number;
  status: string;
}

export interface InventoryAuditEvent {
  id: string;
  action: string;
  resource: string;
  reference: string;
  actor: string;
  severity: InventorySeverity;
  createdAt: string;
}

export interface InventoryWarehouseOperationsData {
  asOf: string;
  widgets: InventoryWidget[];
  capabilities: InventoryCapability[];
  aiInsights: InventoryAiInsight[];
  items: ItemMasterRecord[];
  ledgerEntries: StockLedgerEntry[];
  traceability: TraceabilityRecord[];
  warehouses: WarehouseRecord[];
  binLocations: BinLocationRecord[];
  grns: GrnRecord[];
  dispatches: DispatchRecord[];
  materialMovements: MaterialMovementRecord[];
  approvals: InventoryApproval[];
  financeImpacts: InventoryFinanceImpact[];
  vendorLinks: VendorLink[];
  auditLogs: InventoryAuditEvent[];
}

const inventoryWarehouseOperationsData: InventoryWarehouseOperationsData = {
  asOf: "2026-05-31T10:30:00+05:30",
  widgets: [
    {
      key: "stock-value",
      label: "Current stock value",
      value: "₹4.86 Cr",
      change: "2.8% above prior month",
      trend: "up",
    },
    {
      key: "low-stock",
      label: "Low stock alerts",
      value: "7",
      change: "3 require action today",
      trend: "down",
    },
    {
      key: "fast-moving",
      label: "Fast moving items",
      value: "18",
      change: "42.6% of outbound volume",
      trend: "up",
    },
    {
      key: "slow-moving",
      label: "Slow moving items",
      value: "9",
      change: "₹18.4 L aging exposure",
      trend: "down",
    },
    {
      key: "stock-aging",
      label: "Stock aging > 90 days",
      value: "6.8%",
      change: "1.4% lower than last month",
      trend: "up",
    },
    {
      key: "warehouse-utilization",
      label: "Warehouse utilization",
      value: "78%",
      change: "Chennai at 91% capacity",
      trend: "neutral",
    },
  ],
  capabilities: [
    {
      key: "item-master",
      label: "Item Master",
      description: "SKU governance, valuation, reorder policy, and traceability controls.",
      status: "ACTIVE",
      openItems: 1248,
      ownerRole: "Inventory controller",
    },
    {
      key: "stock-ledger",
      label: "Stock Ledger",
      description: "Posted inward, outward, transfer, and adjustment transactions.",
      status: "POSTED",
      openItems: 8642,
      ownerRole: "Inventory controller",
    },
    {
      key: "material-inward",
      label: "Material Inward",
      description: "PO-linked receipts, GRN registration, quality hold, and put-away.",
      status: "ATTENTION",
      openItems: 6,
      ownerRole: "Warehouse manager",
    },
    {
      key: "material-outward",
      label: "Material Outward",
      description: "Reservation, picking, packing, gate pass, and dispatch handoff.",
      status: "ACTIVE",
      openItems: 11,
      ownerRole: "Dispatch manager",
    },
    {
      key: "stock-transfer",
      label: "Stock Transfer",
      description: "Inter-warehouse movement with transit and receiving confirmation.",
      status: "IN_TRANSIT",
      openItems: 3,
      ownerRole: "Inventory controller",
    },
    {
      key: "stock-adjustment",
      label: "Stock Adjustment",
      description: "Cycle-count variance review with maker-checker approval.",
      status: "ATTENTION",
      openItems: 4,
      ownerRole: "Warehouse manager",
    },
    {
      key: "reorder-levels",
      label: "Reorder Levels",
      description: "Safety stock, coverage days, and procurement trigger monitoring.",
      status: "ATTENTION",
      openItems: 7,
      ownerRole: "Inventory planner",
    },
    {
      key: "batch-tracking",
      label: "Batch Tracking",
      description: "Lot lineage, expiry controls, and batch-level stock availability.",
      status: "ACTIVE",
      openItems: 186,
      ownerRole: "Quality manager",
    },
    {
      key: "serial-tracking",
      label: "Serial Number Tracking",
      description: "Unit-level trace history for controlled components and finished goods.",
      status: "ACTIVE",
      openItems: 412,
      ownerRole: "Inventory controller",
    },
  ],
  aiInsights: [
    {
      id: "ai-stockout-001",
      insightType: "STOCKOUT_PREDICTION",
      title: "Servo motor kit may stock out in 4 days",
      description:
        "Open production demand exceeds available stock by 62 units after the next planned issue.",
      severity: "CRITICAL",
      confidence: 94,
      recommendedAction: "Expedite PO-45091 with MotionTech India or approve an alternate supplier.",
      metric: "4 days cover",
    },
    {
      id: "ai-overstock-001",
      insightType: "OVERSTOCK_ALERT",
      title: "Powder coat black is above target cover",
      description:
        "Consumption has slowed for three consecutive weeks while replenishment remains scheduled.",
      severity: "MEDIUM",
      confidence: 88,
      recommendedAction: "Defer the next 1,200 kg release and rebalance stock to Pune FG Hub.",
      metric: "142 days cover",
    },
    {
      id: "ai-risk-001",
      insightType: "INVENTORY_RISK_SCORE",
      title: "Inventory risk score requires review",
      description:
        "Stockout exposure, one quality hold, and concentration in two constrained bins increased risk.",
      severity: "HIGH",
      confidence: 91,
      recommendedAction: "Clear the GRN quality hold and release the proposed inter-warehouse transfer.",
      metric: "68 / 100",
    },
    {
      id: "ai-forecast-001",
      insightType: "DEMAND_FORECAST",
      title: "Control cabinet demand is trending upward",
      description:
        "Confirmed order intake and seasonal service demand indicate higher Q3 outbound volume.",
      severity: "LOW",
      confidence: 86,
      recommendedAction: "Raise finished-goods buffer by 120 units before the July production freeze.",
      metric: "+18.4% Q3",
    },
  ],
  items: [
    {
      id: "item-001",
      sku: "COMP-SRV-750",
      name: "Servo Motor Kit 750W",
      category: "Motion Control",
      itemType: "COMPONENT",
      uom: "EA",
      onHand: 148,
      reserved: 132,
      available: 16,
      reorderLevel: 80,
      safetyStock: 45,
      stockValue: 1776000,
      coverageDays: 4,
      movementClass: "FAST",
      batchTracked: false,
      serialTracked: true,
      vendorName: "MotionTech India",
    },
    {
      id: "item-002",
      sku: "RM-AL-6061",
      name: "Aluminium Sheet 6061-T6",
      category: "Raw Material",
      itemType: "RAW_MATERIAL",
      uom: "KG",
      onHand: 4820,
      reserved: 1250,
      available: 3570,
      reorderLevel: 1600,
      safetyStock: 900,
      stockValue: 1494200,
      coverageDays: 38,
      movementClass: "FAST",
      batchTracked: true,
      serialTracked: false,
      vendorName: "Bharat Metals Ltd",
    },
    {
      id: "item-003",
      sku: "FG-ASTRA-CAB",
      name: "ASTRA Smart Control Cabinet",
      category: "Finished Goods",
      itemType: "FINISHED_GOOD",
      uom: "EA",
      onHand: 286,
      reserved: 174,
      available: 112,
      reorderLevel: 90,
      safetyStock: 60,
      stockValue: 14586000,
      coverageDays: 22,
      movementClass: "FAST",
      batchTracked: true,
      serialTracked: true,
      vendorName: "Internal Production",
    },
    {
      id: "item-004",
      sku: "RM-PC-BLK",
      name: "Powder Coat Black RAL 9005",
      category: "Consumables",
      itemType: "RAW_MATERIAL",
      uom: "KG",
      onHand: 2360,
      reserved: 240,
      available: 2120,
      reorderLevel: 520,
      safetyStock: 300,
      stockValue: 424800,
      coverageDays: 142,
      movementClass: "SLOW",
      batchTracked: true,
      serialTracked: false,
      vendorName: "Spectrum Coatings",
    },
    {
      id: "item-005",
      sku: "COMP-PLC-24IO",
      name: "PLC Controller 24 I/O",
      category: "Automation",
      itemType: "COMPONENT",
      uom: "EA",
      onHand: 94,
      reserved: 61,
      available: 33,
      reorderLevel: 42,
      safetyStock: 24,
      stockValue: 1203200,
      coverageDays: 12,
      movementClass: "MEDIUM",
      batchTracked: false,
      serialTracked: true,
      vendorName: "ElectroCore Systems",
    },
    {
      id: "item-006",
      sku: "PKG-CRT-L",
      name: "Export Carton Large",
      category: "Packaging",
      itemType: "PACKAGING",
      uom: "EA",
      onHand: 1260,
      reserved: 420,
      available: 840,
      reorderLevel: 900,
      safetyStock: 480,
      stockValue: 176400,
      coverageDays: 16,
      movementClass: "FAST",
      batchTracked: false,
      serialTracked: false,
      vendorName: "PackRight Solutions",
    },
    {
      id: "item-007",
      sku: "CONS-GLOVE-NIT",
      name: "Nitrile Safety Gloves",
      category: "Safety Consumables",
      itemType: "CONSUMABLE",
      uom: "BOX",
      onHand: 84,
      reserved: 12,
      available: 72,
      reorderLevel: 100,
      safetyStock: 60,
      stockValue: 37800,
      coverageDays: 9,
      movementClass: "MEDIUM",
      batchTracked: true,
      serialTracked: false,
      vendorName: "SafeHands Industrial",
    },
  ],
  ledgerEntries: [
    {
      id: "ledger-001",
      movementNumber: "MOV-260531-1048",
      occurredAt: "2026-05-31T09:42:00+05:30",
      movementType: "MATERIAL_INWARD",
      itemSku: "RM-AL-6061",
      itemName: "Aluminium Sheet 6061-T6",
      source: "Bharat Metals Ltd",
      destination: "BLR-RM / A-01-04",
      quantity: 1250,
      uom: "KG",
      value: 387500,
      status: "POSTED",
      reference: "GRN-260531-018",
    },
    {
      id: "ledger-002",
      movementNumber: "MOV-260531-1047",
      occurredAt: "2026-05-31T09:18:00+05:30",
      movementType: "MATERIAL_OUTWARD",
      itemSku: "COMP-SRV-750",
      itemName: "Servo Motor Kit 750W",
      source: "BLR-RM / B-03-02",
      destination: "Production Line 2",
      quantity: 48,
      uom: "EA",
      value: 576000,
      status: "POSTED",
      reference: "MI-260531-042",
    },
    {
      id: "ledger-003",
      movementNumber: "MOV-260531-1046",
      occurredAt: "2026-05-31T08:56:00+05:30",
      movementType: "STOCK_TRANSFER",
      itemSku: "FG-ASTRA-CAB",
      itemName: "ASTRA Smart Control Cabinet",
      source: "BLR-FG / FG-02-01",
      destination: "PUN-FG / FG-01-03",
      quantity: 32,
      uom: "EA",
      value: 1632000,
      status: "IN_TRANSIT",
      reference: "STO-260531-007",
    },
    {
      id: "ledger-004",
      movementNumber: "MOV-260531-1045",
      occurredAt: "2026-05-31T08:34:00+05:30",
      movementType: "STOCK_ADJUSTMENT",
      itemSku: "RM-PC-BLK",
      itemName: "Powder Coat Black RAL 9005",
      source: "CHN-RM / C-02-08",
      destination: "CHN-RM / C-02-08",
      quantity: -18,
      uom: "KG",
      value: -3240,
      status: "WAITING_APPROVAL",
      reference: "ADJ-260531-011",
    },
    {
      id: "ledger-005",
      movementNumber: "MOV-260531-1044",
      occurredAt: "2026-05-31T08:12:00+05:30",
      movementType: "MATERIAL_OUTWARD",
      itemSku: "FG-ASTRA-CAB",
      itemName: "ASTRA Smart Control Cabinet",
      source: "PUN-FG / FG-01-01",
      destination: "Customer Dispatch",
      quantity: 26,
      uom: "EA",
      value: 1326000,
      status: "POSTED",
      reference: "DSP-260531-026",
    },
    {
      id: "ledger-006",
      movementNumber: "MOV-260530-1043",
      occurredAt: "2026-05-30T17:28:00+05:30",
      movementType: "MATERIAL_INWARD",
      itemSku: "COMP-PLC-24IO",
      itemName: "PLC Controller 24 I/O",
      source: "ElectroCore Systems",
      destination: "BLR-RM / B-02-06",
      quantity: 80,
      uom: "EA",
      value: 1024000,
      status: "QUALITY_HOLD",
      reference: "GRN-260530-017",
    },
    {
      id: "ledger-007",
      movementNumber: "MOV-260530-1042",
      occurredAt: "2026-05-30T16:52:00+05:30",
      movementType: "MATERIAL_OUTWARD",
      itemSku: "PKG-CRT-L",
      itemName: "Export Carton Large",
      source: "PUN-FG / PK-01-02",
      destination: "Packing Station 1",
      quantity: 120,
      uom: "EA",
      value: 16800,
      status: "POSTED",
      reference: "PKL-260530-093",
    },
    {
      id: "ledger-008",
      movementNumber: "MOV-260530-1041",
      occurredAt: "2026-05-30T16:20:00+05:30",
      movementType: "STOCK_TRANSFER",
      itemSku: "RM-AL-6061",
      itemName: "Aluminium Sheet 6061-T6",
      source: "CHN-RM / A-04-02",
      destination: "BLR-RM / A-01-05",
      quantity: 640,
      uom: "KG",
      value: 198400,
      status: "POSTED",
      reference: "STO-260530-006",
    },
  ],
  traceability: [
    {
      id: "trace-001",
      traceType: "BATCH",
      traceNumber: "B-AL-260531-04",
      itemSku: "RM-AL-6061",
      itemName: "Aluminium Sheet 6061-T6",
      warehouse: "Bengaluru Raw Materials",
      binCode: "A-01-04",
      quantity: 1250,
      status: "RELEASED",
      expiryDate: null,
      lastMovement: "GRN-260531-018",
    },
    {
      id: "trace-002",
      traceType: "BATCH",
      traceNumber: "B-PC-260420-11",
      itemSku: "RM-PC-BLK",
      itemName: "Powder Coat Black RAL 9005",
      warehouse: "Chennai Regional Warehouse",
      binCode: "C-02-08",
      quantity: 860,
      status: "AGING_REVIEW",
      expiryDate: "2026-11-30",
      lastMovement: "ADJ-260531-011",
    },
    {
      id: "trace-003",
      traceType: "BATCH",
      traceNumber: "B-FG-260528-02",
      itemSku: "FG-ASTRA-CAB",
      itemName: "ASTRA Smart Control Cabinet",
      warehouse: "Pune Finished Goods Hub",
      binCode: "FG-01-03",
      quantity: 32,
      status: "IN_TRANSIT",
      expiryDate: null,
      lastMovement: "STO-260531-007",
    },
    {
      id: "trace-004",
      traceType: "SERIAL",
      traceNumber: "SRV75-IND-2605-01842",
      itemSku: "COMP-SRV-750",
      itemName: "Servo Motor Kit 750W",
      warehouse: "Bengaluru Raw Materials",
      binCode: "B-03-02",
      quantity: 1,
      status: "RESERVED",
      expiryDate: null,
      lastMovement: "MI-260531-042",
    },
    {
      id: "trace-005",
      traceType: "SERIAL",
      traceNumber: "PLC24-IND-2605-00981",
      itemSku: "COMP-PLC-24IO",
      itemName: "PLC Controller 24 I/O",
      warehouse: "Bengaluru Raw Materials",
      binCode: "QC-HOLD-01",
      quantity: 1,
      status: "QUALITY_HOLD",
      expiryDate: null,
      lastMovement: "GRN-260530-017",
    },
    {
      id: "trace-006",
      traceType: "SERIAL",
      traceNumber: "ACAB-2605-00386",
      itemSku: "FG-ASTRA-CAB",
      itemName: "ASTRA Smart Control Cabinet",
      warehouse: "Pune Finished Goods Hub",
      binCode: "FG-01-01",
      quantity: 1,
      status: "DISPATCH_READY",
      expiryDate: null,
      lastMovement: "DSP-260531-026",
    },
  ],
  warehouses: [
    {
      id: "wh-001",
      code: "BLR-RM",
      name: "Bengaluru Raw Materials",
      location: "Peenya, Bengaluru",
      warehouseType: "RAW_MATERIAL",
      status: "ACTIVE",
      manager: "Ananya Rao",
      capacityUnits: 18000,
      utilizedUnits: 13680,
      utilizationPercent: 76,
      binCount: 148,
      openGrns: 3,
      openDispatches: 0,
    },
    {
      id: "wh-002",
      code: "PUN-FG",
      name: "Pune Finished Goods Hub",
      location: "Chakan, Pune",
      warehouseType: "FINISHED_GOODS",
      status: "ACTIVE",
      manager: "Rohit Kulkarni",
      capacityUnits: 6400,
      utilizedUnits: 4736,
      utilizationPercent: 74,
      binCount: 82,
      openGrns: 1,
      openDispatches: 7,
    },
    {
      id: "wh-003",
      code: "CHN-RM",
      name: "Chennai Regional Warehouse",
      location: "Sriperumbudur, Chennai",
      warehouseType: "REGIONAL",
      status: "ATTENTION",
      manager: "Kavya Raman",
      capacityUnits: 9200,
      utilizedUnits: 8372,
      utilizationPercent: 91,
      binCount: 96,
      openGrns: 2,
      openDispatches: 4,
    },
    {
      id: "wh-004",
      code: "BLR-QH",
      name: "Bengaluru Quality Hold",
      location: "Peenya, Bengaluru",
      warehouseType: "QUARANTINE",
      status: "CONTROLLED",
      manager: "Farhan Ali",
      capacityUnits: 1800,
      utilizedUnits: 846,
      utilizationPercent: 47,
      binCount: 24,
      openGrns: 1,
      openDispatches: 0,
    },
  ],
  binLocations: [
    {
      id: "bin-001",
      warehouseCode: "BLR-RM",
      binCode: "A-01-04",
      zone: "Metals",
      binType: "PALLET",
      itemSku: "RM-AL-6061",
      itemName: "Aluminium Sheet 6061-T6",
      occupiedUnits: 4320,
      capacityUnits: 5200,
      utilizationPercent: 83,
      status: "ACTIVE",
    },
    {
      id: "bin-002",
      warehouseCode: "BLR-RM",
      binCode: "B-03-02",
      zone: "Controlled Components",
      binType: "SECURE_RACK",
      itemSku: "COMP-SRV-750",
      itemName: "Servo Motor Kit 750W",
      occupiedUnits: 148,
      capacityUnits: 180,
      utilizationPercent: 82,
      status: "ACTIVE",
    },
    {
      id: "bin-003",
      warehouseCode: "BLR-RM",
      binCode: "B-02-06",
      zone: "Controlled Components",
      binType: "SECURE_RACK",
      itemSku: "COMP-PLC-24IO",
      itemName: "PLC Controller 24 I/O",
      occupiedUnits: 94,
      capacityUnits: 120,
      utilizationPercent: 78,
      status: "QUALITY_HOLD",
    },
    {
      id: "bin-004",
      warehouseCode: "PUN-FG",
      binCode: "FG-01-01",
      zone: "Dispatch Ready",
      binType: "FINISHED_GOODS",
      itemSku: "FG-ASTRA-CAB",
      itemName: "ASTRA Smart Control Cabinet",
      occupiedUnits: 174,
      capacityUnits: 240,
      utilizationPercent: 73,
      status: "ACTIVE",
    },
    {
      id: "bin-005",
      warehouseCode: "PUN-FG",
      binCode: "PK-01-02",
      zone: "Packaging",
      binType: "RACK",
      itemSku: "PKG-CRT-L",
      itemName: "Export Carton Large",
      occupiedUnits: 1260,
      capacityUnits: 1600,
      utilizationPercent: 79,
      status: "ACTIVE",
    },
    {
      id: "bin-006",
      warehouseCode: "CHN-RM",
      binCode: "C-02-08",
      zone: "Consumables",
      binType: "CHEMICAL",
      itemSku: "RM-PC-BLK",
      itemName: "Powder Coat Black RAL 9005",
      occupiedUnits: 2360,
      capacityUnits: 2500,
      utilizationPercent: 94,
      status: "ATTENTION",
    },
    {
      id: "bin-007",
      warehouseCode: "CHN-RM",
      binCode: "C-04-03",
      zone: "Safety",
      binType: "RACK",
      itemSku: "CONS-GLOVE-NIT",
      itemName: "Nitrile Safety Gloves",
      occupiedUnits: 84,
      capacityUnits: 180,
      utilizationPercent: 47,
      status: "ACTIVE",
    },
    {
      id: "bin-008",
      warehouseCode: "BLR-QH",
      binCode: "QC-HOLD-01",
      zone: "Incoming Quality",
      binType: "QUARANTINE",
      itemSku: "COMP-PLC-24IO",
      itemName: "PLC Controller 24 I/O",
      occupiedUnits: 80,
      capacityUnits: 140,
      utilizationPercent: 57,
      status: "CONTROLLED",
    },
  ],
  grns: [
    {
      id: "grn-001",
      grnNumber: "GRN-260531-018",
      poNumber: "PO-45088",
      vendorName: "Bharat Metals Ltd",
      warehouseCode: "BLR-RM",
      receivedAt: "2026-05-31T09:34:00+05:30",
      itemCount: 2,
      totalQuantity: 1250,
      invoiceValue: 387500,
      qualityStatus: "PASSED",
      status: "POSTED",
    },
    {
      id: "grn-002",
      grnNumber: "GRN-260530-017",
      poNumber: "PO-45084",
      vendorName: "ElectroCore Systems",
      warehouseCode: "BLR-QH",
      receivedAt: "2026-05-30T17:10:00+05:30",
      itemCount: 1,
      totalQuantity: 80,
      invoiceValue: 1024000,
      qualityStatus: "SAMPLING_PENDING",
      status: "QUALITY_HOLD",
    },
    {
      id: "grn-003",
      grnNumber: "GRN-260530-016",
      poNumber: "PO-45079",
      vendorName: "PackRight Solutions",
      warehouseCode: "PUN-FG",
      receivedAt: "2026-05-30T14:26:00+05:30",
      itemCount: 2,
      totalQuantity: 1850,
      invoiceValue: 259000,
      qualityStatus: "PASSED",
      status: "PUTAWAY_PENDING",
    },
    {
      id: "grn-004",
      grnNumber: "GRN-260530-015",
      poNumber: "PO-45073",
      vendorName: "MotionTech India",
      warehouseCode: "BLR-RM",
      receivedAt: "2026-05-30T11:54:00+05:30",
      itemCount: 1,
      totalQuantity: 96,
      invoiceValue: 1152000,
      qualityStatus: "PASSED",
      status: "POSTED",
    },
    {
      id: "grn-005",
      grnNumber: "GRN-260529-014",
      poNumber: "PO-45066",
      vendorName: "Spectrum Coatings",
      warehouseCode: "CHN-RM",
      receivedAt: "2026-05-29T16:40:00+05:30",
      itemCount: 1,
      totalQuantity: 1200,
      invoiceValue: 216000,
      qualityStatus: "PASSED",
      status: "POSTED",
    },
  ],
  dispatches: [
    {
      id: "dispatch-001",
      dispatchNumber: "DSP-260531-026",
      salesOrder: "SO-88264",
      customerName: "Vertex Automation Pvt Ltd",
      warehouseCode: "PUN-FG",
      plannedShipAt: "2026-05-31T15:30:00+05:30",
      carrier: "BlueDart Freight",
      itemCount: 2,
      totalQuantity: 26,
      orderValue: 2366000,
      status: "PACKED",
    },
    {
      id: "dispatch-002",
      dispatchNumber: "DSP-260531-025",
      salesOrder: "SO-88258",
      customerName: "Nova Process Systems",
      warehouseCode: "PUN-FG",
      plannedShipAt: "2026-05-31T13:00:00+05:30",
      carrier: "Delhivery B2B",
      itemCount: 3,
      totalQuantity: 18,
      orderValue: 1698000,
      status: "PICKING",
    },
    {
      id: "dispatch-003",
      dispatchNumber: "DSP-260531-024",
      salesOrder: "SO-88241",
      customerName: "Southern Drives Ltd",
      warehouseCode: "CHN-RM",
      plannedShipAt: "2026-05-31T11:30:00+05:30",
      carrier: "VRL Logistics",
      itemCount: 1,
      totalQuantity: 340,
      orderValue: 105400,
      status: "EXCEPTION",
    },
    {
      id: "dispatch-004",
      dispatchNumber: "DSP-260530-023",
      salesOrder: "SO-88236",
      customerName: "Prime Engineering Works",
      warehouseCode: "PUN-FG",
      plannedShipAt: "2026-05-30T17:00:00+05:30",
      carrier: "TCI Express",
      itemCount: 2,
      totalQuantity: 42,
      orderValue: 3528000,
      status: "DISPATCHED",
    },
  ],
  materialMovements: [
    {
      id: "track-001",
      movementNumber: "STO-260531-007",
      movementType: "INTER_WAREHOUSE_TRANSFER",
      itemSku: "FG-ASTRA-CAB",
      itemName: "ASTRA Smart Control Cabinet",
      fromLocation: "BLR-FG / FG-02-01",
      toLocation: "PUN-FG / FG-01-03",
      quantity: 32,
      occurredAt: "2026-05-31T08:56:00+05:30",
      handledBy: "RapidLine Logistics",
      status: "IN_TRANSIT",
    },
    {
      id: "track-002",
      movementNumber: "PUT-260531-039",
      movementType: "PUTAWAY",
      itemSku: "RM-AL-6061",
      itemName: "Aluminium Sheet 6061-T6",
      fromLocation: "BLR-RM / RECEIVING-02",
      toLocation: "BLR-RM / A-01-04",
      quantity: 1250,
      occurredAt: "2026-05-31T09:58:00+05:30",
      handledBy: "Warehouse team - BLR",
      status: "COMPLETED",
    },
    {
      id: "track-003",
      movementNumber: "PICK-260531-093",
      movementType: "PICKING",
      itemSku: "FG-ASTRA-CAB",
      itemName: "ASTRA Smart Control Cabinet",
      fromLocation: "PUN-FG / FG-01-01",
      toLocation: "PUN-FG / STAGING-01",
      quantity: 26,
      occurredAt: "2026-05-31T10:06:00+05:30",
      handledBy: "Dispatch team - PUN",
      status: "COMPLETED",
    },
    {
      id: "track-004",
      movementNumber: "QHM-260530-014",
      movementType: "QUALITY_HOLD_TRANSFER",
      itemSku: "COMP-PLC-24IO",
      itemName: "PLC Controller 24 I/O",
      fromLocation: "BLR-RM / RECEIVING-01",
      toLocation: "BLR-QH / QC-HOLD-01",
      quantity: 80,
      occurredAt: "2026-05-30T17:28:00+05:30",
      handledBy: "Quality team - BLR",
      status: "COMPLETED",
    },
    {
      id: "track-005",
      movementNumber: "CC-260531-016",
      movementType: "CYCLE_COUNT",
      itemSku: "RM-PC-BLK",
      itemName: "Powder Coat Black RAL 9005",
      fromLocation: "CHN-RM / C-02-08",
      toLocation: "CHN-RM / C-02-08",
      quantity: -18,
      occurredAt: "2026-05-31T08:34:00+05:30",
      handledBy: "Kavya Raman",
      status: "WAITING_APPROVAL",
    },
    {
      id: "track-006",
      movementNumber: "REP-260531-021",
      movementType: "BIN_REPLENISHMENT",
      itemSku: "PKG-CRT-L",
      itemName: "Export Carton Large",
      fromLocation: "PUN-FG / BULK-02",
      toLocation: "PUN-FG / PK-01-02",
      quantity: 360,
      occurredAt: "2026-05-31T07:52:00+05:30",
      handledBy: "Warehouse team - PUN",
      status: "COMPLETED",
    },
  ],
  approvals: [
    {
      id: "approval-001",
      title: "Approve cycle-count stock adjustment",
      reference: "ADJ-260531-011",
      workflow: "Stock Adjustment",
      ownerRole: "Inventory controller",
      impact: "-18 KG | ₹3,240 valuation change",
      status: "PENDING",
      dueAt: "2026-05-31T14:00:00+05:30",
    },
    {
      id: "approval-002",
      title: "Release PLC controller quality hold",
      reference: "GRN-260530-017",
      workflow: "GRN Quality Gate",
      ownerRole: "Quality manager",
      impact: "80 EA | ₹10.24 L blocked inventory",
      status: "BLOCKED",
      dueAt: "2026-05-31T12:30:00+05:30",
    },
    {
      id: "approval-003",
      title: "Approve expedited replenishment",
      reference: "REQ-260531-034",
      workflow: "Reorder Exception",
      ownerRole: "Procurement manager",
      impact: "Servo Motor Kit | 4 days stock cover",
      status: "PENDING",
      dueAt: "2026-05-31T13:15:00+05:30",
    },
    {
      id: "approval-004",
      title: "Approve inter-warehouse stock transfer",
      reference: "STO-260531-008",
      workflow: "Stock Transfer",
      ownerRole: "Operations manager",
      impact: "1,200 KG powder coat rebalance",
      status: "PENDING",
      dueAt: "2026-06-01T10:00:00+05:30",
    },
  ],
  financeImpacts: [
    {
      id: "finance-001",
      label: "On-hand inventory value",
      amount: 48600000,
      context: "Across 1,248 active SKUs and four warehouses",
      tone: "info",
    },
    {
      id: "finance-002",
      label: "Blocked receipt value",
      amount: 1024000,
      context: "PLC controller GRN awaiting incoming quality release",
      tone: "danger",
    },
    {
      id: "finance-003",
      label: "Slow-moving inventory exposure",
      amount: 1840000,
      context: "Nine SKUs with more than 90 days stock cover",
      tone: "warning",
    },
    {
      id: "finance-004",
      label: "Open dispatch value",
      amount: 4169400,
      context: "Packed, picking, and dispatch-exception orders",
      tone: "success",
    },
  ],
  vendorLinks: [
    {
      id: "vendor-001",
      vendorName: "MotionTech India",
      vendorCode: "VEN-00184",
      linkedSkus: 14,
      openGrns: 0,
      leadTimeDays: 12,
      onTimeDelivery: 92,
      exposure: 2376000,
      status: "EXPEDITE",
    },
    {
      id: "vendor-002",
      vendorName: "Bharat Metals Ltd",
      vendorCode: "VEN-00028",
      linkedSkus: 32,
      openGrns: 1,
      leadTimeDays: 8,
      onTimeDelivery: 97,
      exposure: 1494200,
      status: "ACTIVE",
    },
    {
      id: "vendor-003",
      vendorName: "ElectroCore Systems",
      vendorCode: "VEN-00146",
      linkedSkus: 18,
      openGrns: 1,
      leadTimeDays: 16,
      onTimeDelivery: 89,
      exposure: 2227200,
      status: "QUALITY_REVIEW",
    },
    {
      id: "vendor-004",
      vendorName: "Spectrum Coatings",
      vendorCode: "VEN-00091",
      linkedSkus: 9,
      openGrns: 0,
      leadTimeDays: 7,
      onTimeDelivery: 95,
      exposure: 424800,
      status: "ACTIVE",
    },
  ],
  auditLogs: [
    {
      id: "audit-001",
      action: "stock.adjustment.submitted",
      resource: "Stock adjustment",
      reference: "ADJ-260531-011",
      actor: "Kavya Raman",
      severity: "MEDIUM",
      createdAt: "2026-05-31T08:36:00+05:30",
    },
    {
      id: "audit-002",
      action: "stock.transfer.dispatched",
      resource: "Stock transfer",
      reference: "STO-260531-007",
      actor: "Ananya Rao",
      severity: "LOW",
      createdAt: "2026-05-31T08:58:00+05:30",
    },
    {
      id: "audit-003",
      action: "grn.quality_hold.applied",
      resource: "Goods receipt note",
      reference: "GRN-260530-017",
      actor: "Farhan Ali",
      severity: "HIGH",
      createdAt: "2026-05-30T17:24:00+05:30",
    },
    {
      id: "audit-004",
      action: "dispatch.exception.raised",
      resource: "Dispatch",
      reference: "DSP-260531-024",
      actor: "Kavya Raman",
      severity: "HIGH",
      createdAt: "2026-05-31T10:12:00+05:30",
    },
    {
      id: "audit-005",
      action: "reorder.exception.created",
      resource: "Item master",
      reference: "COMP-SRV-750",
      actor: "ASTRA AI",
      severity: "CRITICAL",
      createdAt: "2026-05-31T10:18:00+05:30",
    },
    {
      id: "audit-006",
      action: "bin.capacity.threshold.reached",
      resource: "Bin location",
      reference: "CHN-RM / C-02-08",
      actor: "ASTRA Rules Engine",
      severity: "MEDIUM",
      createdAt: "2026-05-31T10:24:00+05:30",
    },
  ],
};

export function getInventoryWarehouseOperationsData(): InventoryWarehouseOperationsData {
  return inventoryWarehouseOperationsData;
}
