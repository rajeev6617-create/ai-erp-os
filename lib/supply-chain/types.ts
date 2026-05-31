export type SupplyChainSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface SupplyChainStat {
  label: string;
  value: string;
  change: string;
  trend: "up" | "down" | "neutral";
}

export interface WarehouseView {
  id: string;
  code: string;
  name: string;
  location: string | null;
  status: string;
  capacityUnits: number | null;
  utilizationPercent: number | null;
  managerRole: string | null;
}

export interface InventoryItemView {
  id: string;
  sku: string;
  name: string;
  itemType: string;
  category: string | null;
  uom: string;
  safetyStock: number;
  reorderPoint: number;
  onHandStock: number;
  reservedStock: number;
  availableStock: number;
  standardCost: number | null;
  status: string;
}

export interface StockMovementView {
  id: string;
  movementNumber: string;
  movementType: string;
  status: string;
  quantity: number;
  unitCost: number | null;
  referenceType: string | null;
  referenceNumber: string | null;
  occurredAt: string | null;
  itemName: string;
  itemSku: string;
  warehouseName: string;
}

export interface GoodsReceiptView {
  id: string;
  grnNumber: string;
  poNumber: string | null;
  supplierName: string;
  status: string;
  receivedAt: string | null;
  itemCount: number;
  totalQuantity: number;
  qualityStatus: string | null;
  ownerRole: string | null;
  warehouseName: string;
}

export interface DispatchView {
  id: string;
  dispatchNumber: string;
  orderNumber: string | null;
  customerName: string;
  status: string;
  plannedShipAt: string | null;
  dispatchedAt: string | null;
  itemCount: number;
  totalQuantity: number;
  carrier: string | null;
  ownerRole: string | null;
  warehouseName: string;
}

export interface BomComponentView {
  id: string;
  componentName: string;
  componentSku: string;
  quantity: number;
  scrapPercent: number;
  operationStep: string;
}

export interface BomView {
  id: string;
  bomNumber: string;
  name: string;
  version: number;
  status: string;
  outputItemName: string;
  outputSku: string;
  yieldQuantity: number;
  uom: string;
  componentCount: number;
  components: BomComponentView[];
}

export interface ProductionPlanView {
  id: string;
  planNumber: string;
  name: string;
  status: string;
  plannedQuantity: number;
  completedQuantity: number;
  uom: string;
  scheduledStart: string | null;
  scheduledEnd: string | null;
  ownerRole: string | null;
  outputItemName: string;
  outputSku: string;
  warehouseName: string | null;
  bomNumber: string | null;
}

export interface QualityCheckView {
  id: string;
  checkNumber: string;
  checkType: string;
  status: string;
  sampleSize: number | null;
  defectCount: number;
  inspectorRole: string | null;
  dueAt: string | null;
  completedAt: string | null;
  itemName: string | null;
  planNumber: string | null;
  grnNumber: string | null;
}

export interface SupplyChainAiAlertView {
  id: string;
  alertType: string;
  title: string;
  description: string;
  severity: SupplyChainSeverity;
  confidence: number | null;
  recommendedAction: string | null;
  entityType: string | null;
}

export interface SupplyChainAuditView {
  id: string;
  action: string;
  resource: string;
  severity: string;
  createdAt: string;
}

export interface InventoryAnalytics {
  stockValue: number;
  availableUnits: number;
  reservedUnits: number;
  reorderItemCount: number;
  qualityHoldCount: number;
  dispatchExceptionCount: number;
}

export interface WarehouseWorkflowStageView {
  key: string;
  label: string;
  description: string;
  ownerRole: string;
  status: "HEALTHY" | "ATTENTION" | "BLOCKED";
  openItems: number;
}

export interface WarehouseApprovalView {
  id: string;
  title: string;
  reference: string;
  stage: string;
  ownerRole: string;
  status: "PENDING" | "BLOCKED";
  impact: string;
}

export interface InventoryFinanceImpact {
  stockValue: number;
  reservedStockValue: number;
  movementValue: number;
  blockedReceiptValue: number;
  dispatchExposure: number;
}

export interface InventoryDashboardData {
  stats: SupplyChainStat[];
  analytics: InventoryAnalytics;
  workflowStages: WarehouseWorkflowStageView[];
  approvals: WarehouseApprovalView[];
  financeImpact: InventoryFinanceImpact;
  warehouses: WarehouseView[];
  items: InventoryItemView[];
  movements: StockMovementView[];
  grns: GoodsReceiptView[];
  dispatches: DispatchView[];
  qualityChecks: QualityCheckView[];
  alerts: SupplyChainAiAlertView[];
  auditLogs: SupplyChainAuditView[];
}

export interface ProductionDashboardData {
  stats: SupplyChainStat[];
  boms: BomView[];
  productionPlans: ProductionPlanView[];
  qualityChecks: QualityCheckView[];
  alerts: SupplyChainAiAlertView[];
  auditLogs: SupplyChainAuditView[];
}
