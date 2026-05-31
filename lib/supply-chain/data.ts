import type { SupplyChainAlertType } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import type {
  BomComponentView,
  BomView,
  DispatchView,
  GoodsReceiptView,
  InventoryFinanceImpact,
  InventoryDashboardData,
  InventoryItemView,
  ProductionDashboardData,
  ProductionPlanView,
  QualityCheckView,
  StockMovementView,
  SupplyChainAiAlertView,
  SupplyChainAuditView,
  WarehouseApprovalView,
  WarehouseWorkflowStageView,
  WarehouseView,
} from "@/lib/supply-chain/types";

const INVENTORY_ALERT_TYPES: SupplyChainAlertType[] = [
  "STOCKOUT",
  "OVERSTOCK",
  "LATE_GRN",
  "DISPATCH_DELAY",
] as SupplyChainAlertType[];

const PRODUCTION_ALERT_TYPES: SupplyChainAlertType[] = [
  "QUALITY_FAILURE",
  "CAPACITY_RISK",
  "BOM_VARIANCE",
] as SupplyChainAlertType[];

export async function getInventoryDashboard(
  organizationId: string,
): Promise<InventoryDashboardData> {
  const [
    warehouses,
    items,
    movements,
    grns,
    dispatches,
    qualityChecks,
    alerts,
    auditLogs,
  ] = await Promise.all([
    prisma.warehouse.findMany({
      where: { organizationId, deletedAt: null },
      orderBy: [{ status: "asc" }, { utilizationPercent: "desc" }],
      take: 12,
    }),
    prisma.inventoryItem.findMany({
      where: { organizationId, deletedAt: null },
      orderBy: [{ availableStock: "asc" }, { updatedAt: "desc" }],
      take: 16,
    }),
    prisma.stockMovement.findMany({
      where: { organizationId },
      include: {
        item: { select: { name: true, sku: true } },
        warehouse: { select: { name: true } },
      },
      orderBy: [{ occurredAt: "desc" }, { updatedAt: "desc" }],
      take: 12,
    }),
    prisma.goodsReceiptNote.findMany({
      where: { organizationId },
      include: { warehouse: { select: { name: true } } },
      orderBy: [{ receivedAt: "desc" }, { updatedAt: "desc" }],
      take: 10,
    }),
    prisma.dispatchOrder.findMany({
      where: { organizationId },
      include: { warehouse: { select: { name: true } } },
      orderBy: [{ plannedShipAt: "asc" }, { updatedAt: "desc" }],
      take: 10,
    }),
    prisma.qualityCheck.findMany({
      where: { organizationId },
      include: {
        item: { select: { name: true } },
        productionPlan: { select: { planNumber: true } },
        grn: { select: { grnNumber: true } },
      },
      orderBy: [{ dueAt: "asc" }, { updatedAt: "desc" }],
      take: 8,
    }),
    prisma.inventoryAiAlert.findMany({
      where: { organizationId, alertType: { in: INVENTORY_ALERT_TYPES }, status: "OPEN" },
      orderBy: [{ severity: "desc" }, { createdAt: "desc" }],
      take: 8,
    }),
    prisma.auditLog.findMany({
      where: {
        organizationId,
        resource: { in: ["inventory", "warehouse", "stock_movement", "grn", "dispatch"] },
      },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
  ]);

  const mappedItems = items.map(mapInventoryItem);
  const mappedMovements = movements.map(mapStockMovement);
  const mappedGrns = grns.map(mapGoodsReceipt);
  const mappedDispatches = dispatches.map(mapDispatch);
  const mappedQualityChecks = qualityChecks.map(mapQualityCheck);
  const analytics = {
    stockValue: mappedItems.reduce(
      (sum, item) => sum + item.onHandStock * (item.standardCost ?? 0),
      0,
    ),
    availableUnits: mappedItems.reduce((sum, item) => sum + item.availableStock, 0),
    reservedUnits: mappedItems.reduce((sum, item) => sum + item.reservedStock, 0),
    reorderItemCount: mappedItems.filter(
      (item) => item.availableStock <= Math.max(item.reorderPoint, item.safetyStock),
    ).length,
    qualityHoldCount: grns.filter((item) => item.status === "QUALITY_HOLD").length,
    dispatchExceptionCount: dispatches.filter((item) => item.status === "EXCEPTION").length,
  };
  const financeImpact = buildInventoryFinanceImpact(
    mappedItems,
    mappedMovements,
    mappedGrns,
    mappedDispatches,
  );

  return {
    stats: [
      {
        label: "Warehouses",
        value: String(warehouses.length),
        change: `${warehouses.filter((item) => item.status === "ACTIVE").length} active`,
        trend: "up",
      },
      {
        label: "Stock value",
        value: formatInr(analytics.stockValue),
        change: `${formatCompact(analytics.availableUnits)} units available`,
        trend: "neutral",
      },
      {
        label: "Reorder risks",
        value: String(analytics.reorderItemCount),
        change: `${analytics.qualityHoldCount} GRNs on hold`,
        trend: analytics.reorderItemCount > 0 ? "down" : "up",
      },
      {
        label: "AI alerts",
        value: String(alerts.length),
        change: `${alerts.filter((item) => isEscalated(item.severity)).length} escalated`,
        trend: alerts.length > 0 ? "down" : "up",
      },
    ],
    analytics,
    workflowStages: buildWarehouseWorkflowStages(
      mappedItems,
      mappedMovements,
      mappedGrns,
      mappedDispatches,
      mappedQualityChecks,
    ),
    approvals: buildWarehouseApprovals(
      warehouses.map(mapWarehouse),
      mappedMovements,
      mappedGrns,
      mappedDispatches,
    ),
    financeImpact,
    warehouses: warehouses.map(mapWarehouse),
    items: mappedItems,
    movements: mappedMovements,
    grns: mappedGrns,
    dispatches: mappedDispatches,
    qualityChecks: mappedQualityChecks,
    alerts: alerts.map(mapAiAlert).sort(alertSort),
    auditLogs: auditLogs.map(mapAuditLog),
  };
}

function buildWarehouseWorkflowStages(
  items: InventoryItemView[],
  movements: StockMovementView[],
  grns: GoodsReceiptView[],
  dispatches: DispatchView[],
  qualityChecks: QualityCheckView[],
): WarehouseWorkflowStageView[] {
  const receivingOpen = grns.filter((item) => !["POSTED", "CANCELLED"].includes(item.status));
  const qualityOpen = qualityChecks.filter((item) =>
    ["PENDING", "HOLD", "FAILED", "REWORK"].includes(item.status),
  );
  const stockPostingOpen = movements.filter((item) => ["DRAFT", "BLOCKED"].includes(item.status));
  const replenishmentOpen = items.filter(
    (item) => item.availableStock <= Math.max(item.reorderPoint, item.safetyStock),
  );
  const pickingOpen = dispatches.filter((item) =>
    ["PLANNED", "PICKING", "PACKED"].includes(item.status),
  );
  const dispatchExceptions = dispatches.filter((item) => item.status === "EXCEPTION");

  return [
    workflowStage(
      "receiving",
      "Inbound receiving",
      "PO-linked receipts and GRN registration",
      "warehouse manager",
      receivingOpen.length,
      receivingOpen.some((item) => item.status === "QUALITY_HOLD"),
    ),
    workflowStage(
      "quality",
      "Quality gate",
      "Incoming inspection, holds, and release decisions",
      "quality manager",
      qualityOpen.length,
      qualityOpen.some((item) => ["HOLD", "FAILED"].includes(item.status)),
    ),
    workflowStage(
      "posting",
      "Stock posting",
      "Put-away confirmation and inventory ledger posting",
      "inventory controller",
      stockPostingOpen.length,
      stockPostingOpen.some((item) => item.status === "BLOCKED"),
    ),
    workflowStage(
      "replenishment",
      "Replenishment",
      "Safety stock, reorder point, and allocation review",
      "inventory planner",
      replenishmentOpen.length,
      false,
    ),
    workflowStage(
      "pick-pack",
      "Pick and pack",
      "Outbound reservation, picking, and packing readiness",
      "dispatch manager",
      pickingOpen.length,
      false,
    ),
    workflowStage(
      "dispatch",
      "Dispatch and delivery",
      "Carrier handoff, customer SLA, and delivery exceptions",
      "dispatch manager",
      dispatchExceptions.length,
      dispatchExceptions.length > 0,
    ),
  ];
}

function workflowStage(
  key: string,
  label: string,
  description: string,
  ownerRole: string,
  openItems: number,
  blocked: boolean,
): WarehouseWorkflowStageView {
  return {
    key,
    label,
    description,
    ownerRole,
    openItems,
    status: blocked ? "BLOCKED" : openItems > 0 ? "ATTENTION" : "HEALTHY",
  };
}

function buildWarehouseApprovals(
  warehouses: WarehouseView[],
  movements: StockMovementView[],
  grns: GoodsReceiptView[],
  dispatches: DispatchView[],
): WarehouseApprovalView[] {
  return [
    ...grns
      .filter((item) => item.status === "QUALITY_HOLD")
      .map((item) => ({
        id: `grn:${item.id}`,
        title: "Release inbound quality hold",
        reference: item.grnNumber,
        stage: "Quality gate",
        ownerRole: item.ownerRole ?? "quality manager",
        status: "BLOCKED" as const,
        impact: `${formatCompact(item.totalQuantity)} units awaiting release`,
      })),
    ...movements
      .filter((item) => item.status === "BLOCKED")
      .map((item) => ({
        id: `movement:${item.id}`,
        title: "Review blocked stock posting",
        reference: item.movementNumber,
        stage: "Stock posting",
        ownerRole: "inventory controller",
        status: "BLOCKED" as const,
        impact: `${formatCompact(item.quantity)} units blocked from posting`,
      })),
    ...dispatches
      .filter((item) => item.status === "EXCEPTION")
      .map((item) => ({
        id: `dispatch:${item.id}`,
        title: "Resolve dispatch exception",
        reference: item.dispatchNumber,
        stage: "Dispatch and delivery",
        ownerRole: item.ownerRole ?? "dispatch manager",
        status: "PENDING" as const,
        impact: `${formatCompact(item.totalQuantity)} units exposed to SLA delay`,
      })),
    ...warehouses
      .filter((item) => item.status === "HOLD")
      .map((item) => ({
        id: `warehouse:${item.id}`,
        title: "Review warehouse operating hold",
        reference: item.code,
        stage: "Warehouse control",
        ownerRole: item.managerRole ?? "operations manager",
        status: "PENDING" as const,
        impact: `${formatPercent(item.utilizationPercent)} utilization under review`,
      })),
  ].slice(0, 8);
}

function buildInventoryFinanceImpact(
  items: InventoryItemView[],
  movements: StockMovementView[],
  grns: GoodsReceiptView[],
  dispatches: DispatchView[],
): InventoryFinanceImpact {
  const heldGrns = new Set(
    grns.filter((item) => item.status === "QUALITY_HOLD").map((item) => item.grnNumber),
  );
  const finishedGoodsCost =
    items.find((item) => item.itemType === "FINISHED_GOOD")?.standardCost ?? 0;

  return {
    stockValue: items.reduce(
      (sum, item) => sum + item.onHandStock * (item.standardCost ?? 0),
      0,
    ),
    reservedStockValue: items.reduce(
      (sum, item) => sum + item.reservedStock * (item.standardCost ?? 0),
      0,
    ),
    movementValue: movements.reduce(
      (sum, item) => sum + item.quantity * (item.unitCost ?? 0),
      0,
    ),
    blockedReceiptValue: movements
      .filter((item) => item.referenceNumber != null && heldGrns.has(item.referenceNumber))
      .reduce((sum, item) => sum + item.quantity * (item.unitCost ?? 0), 0),
    dispatchExposure: dispatches
      .filter((item) => item.status !== "DELIVERED")
      .reduce((sum, item) => sum + item.totalQuantity * finishedGoodsCost, 0),
  };
}

export async function getProductionDashboard(
  organizationId: string,
): Promise<ProductionDashboardData> {
  const [boms, productionPlans, qualityChecks, alerts, auditLogs] = await Promise.all([
    prisma.billOfMaterial.findMany({
      where: { organizationId },
      include: {
        outputItem: { select: { name: true, sku: true } },
        components: {
          include: { componentItem: { select: { name: true, sku: true } } },
          orderBy: { operationStep: "asc" },
        },
      },
      orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
      take: 8,
    }),
    prisma.productionPlan.findMany({
      where: { organizationId },
      include: {
        outputItem: { select: { name: true, sku: true } },
        warehouse: { select: { name: true } },
        bom: { select: { bomNumber: true } },
      },
      orderBy: [{ scheduledStart: "asc" }, { updatedAt: "desc" }],
      take: 12,
    }),
    prisma.qualityCheck.findMany({
      where: { organizationId, productionPlanId: { not: null } },
      include: {
        item: { select: { name: true } },
        productionPlan: { select: { planNumber: true } },
        grn: { select: { grnNumber: true } },
      },
      orderBy: [{ dueAt: "asc" }, { updatedAt: "desc" }],
      take: 10,
    }),
    prisma.inventoryAiAlert.findMany({
      where: { organizationId, alertType: { in: PRODUCTION_ALERT_TYPES }, status: "OPEN" },
      orderBy: [{ severity: "desc" }, { createdAt: "desc" }],
      take: 8,
    }),
    prisma.auditLog.findMany({
      where: { organizationId, resource: { in: ["production", "bom", "quality"] } },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
  ]);

  const mappedPlans = productionPlans.map(mapProductionPlan);
  const plannedQty = mappedPlans.reduce((sum, item) => sum + item.plannedQuantity, 0);
  const completedQty = mappedPlans.reduce((sum, item) => sum + item.completedQuantity, 0);
  const completion =
    plannedQty > 0 ? Math.round(Math.min(100, (completedQty / plannedQty) * 100)) : 0;

  return {
    stats: [
      {
        label: "Active BOMs",
        value: String(boms.filter((item) => item.status === "ACTIVE").length),
        change: `${boms.length} total BOMs`,
        trend: "up",
      },
      {
        label: "Production plans",
        value: String(mappedPlans.length),
        change: `${mappedPlans.filter((item) => item.status === "BLOCKED").length} blocked`,
        trend: mappedPlans.some((item) => item.status === "BLOCKED") ? "down" : "up",
      },
      {
        label: "Plan completion",
        value: `${completion}%`,
        change: `${formatCompact(completedQty)} of ${formatCompact(plannedQty)} units`,
        trend: completion >= 80 ? "up" : "neutral",
      },
      {
        label: "Quality checks",
        value: String(qualityChecks.length),
        change: `${qualityChecks.filter((item) => ["FAILED", "HOLD"].includes(item.status)).length} exceptions`,
        trend: qualityChecks.some((item) => ["FAILED", "HOLD"].includes(item.status))
          ? "down"
          : "up",
      },
    ],
    boms: boms.map(mapBom),
    productionPlans: mappedPlans,
    qualityChecks: qualityChecks.map(mapQualityCheck),
    alerts: alerts.map(mapAiAlert).sort(alertSort),
    auditLogs: auditLogs.map(mapAuditLog),
  };
}

function mapWarehouse(warehouse: {
  id: string;
  code: string;
  name: string;
  location: string | null;
  status: string;
  capacityUnits: unknown;
  utilizationPercent: unknown;
  managerRole: string | null;
}): WarehouseView {
  return {
    id: warehouse.id,
    code: warehouse.code,
    name: warehouse.name,
    location: warehouse.location,
    status: warehouse.status,
    capacityUnits: decimalToNumberOrNull(warehouse.capacityUnits),
    utilizationPercent: decimalToNumberOrNull(warehouse.utilizationPercent),
    managerRole: warehouse.managerRole,
  };
}

function mapInventoryItem(item: {
  id: string;
  sku: string;
  name: string;
  itemType: string;
  category: string | null;
  uom: string;
  safetyStock: unknown;
  reorderPoint: unknown;
  onHandStock: unknown;
  reservedStock: unknown;
  availableStock: unknown;
  standardCost: unknown;
  status: string;
}): InventoryItemView {
  return {
    id: item.id,
    sku: item.sku,
    name: item.name,
    itemType: item.itemType,
    category: item.category,
    uom: item.uom,
    safetyStock: decimalToNumber(item.safetyStock),
    reorderPoint: decimalToNumber(item.reorderPoint),
    onHandStock: decimalToNumber(item.onHandStock),
    reservedStock: decimalToNumber(item.reservedStock),
    availableStock: decimalToNumber(item.availableStock),
    standardCost: decimalToNumberOrNull(item.standardCost),
    status: item.status,
  };
}

function mapStockMovement(movement: {
  id: string;
  movementNumber: string;
  movementType: string;
  status: string;
  quantity: unknown;
  unitCost: unknown;
  referenceType: string | null;
  referenceNumber: string | null;
  occurredAt: Date | null;
  item: { name: string; sku: string };
  warehouse: { name: string };
}): StockMovementView {
  return {
    id: movement.id,
    movementNumber: movement.movementNumber,
    movementType: movement.movementType,
    status: movement.status,
    quantity: decimalToNumber(movement.quantity),
    unitCost: decimalToNumberOrNull(movement.unitCost),
    referenceType: movement.referenceType,
    referenceNumber: movement.referenceNumber,
    occurredAt: movement.occurredAt?.toISOString() ?? null,
    itemName: movement.item.name,
    itemSku: movement.item.sku,
    warehouseName: movement.warehouse.name,
  };
}

function mapGoodsReceipt(grn: {
  id: string;
  grnNumber: string;
  poNumber: string | null;
  supplierName: string;
  status: string;
  receivedAt: Date | null;
  itemCount: number;
  totalQuantity: unknown;
  qualityStatus: string | null;
  ownerRole: string | null;
  warehouse: { name: string };
}): GoodsReceiptView {
  return {
    id: grn.id,
    grnNumber: grn.grnNumber,
    poNumber: grn.poNumber,
    supplierName: grn.supplierName,
    status: grn.status,
    receivedAt: grn.receivedAt?.toISOString() ?? null,
    itemCount: grn.itemCount,
    totalQuantity: decimalToNumber(grn.totalQuantity),
    qualityStatus: grn.qualityStatus,
    ownerRole: grn.ownerRole,
    warehouseName: grn.warehouse.name,
  };
}

function mapDispatch(dispatch: {
  id: string;
  dispatchNumber: string;
  orderNumber: string | null;
  customerName: string;
  status: string;
  plannedShipAt: Date | null;
  dispatchedAt: Date | null;
  itemCount: number;
  totalQuantity: unknown;
  carrier: string | null;
  ownerRole: string | null;
  warehouse: { name: string };
}): DispatchView {
  return {
    id: dispatch.id,
    dispatchNumber: dispatch.dispatchNumber,
    orderNumber: dispatch.orderNumber,
    customerName: dispatch.customerName,
    status: dispatch.status,
    plannedShipAt: dispatch.plannedShipAt?.toISOString() ?? null,
    dispatchedAt: dispatch.dispatchedAt?.toISOString() ?? null,
    itemCount: dispatch.itemCount,
    totalQuantity: decimalToNumber(dispatch.totalQuantity),
    carrier: dispatch.carrier,
    ownerRole: dispatch.ownerRole,
    warehouseName: dispatch.warehouse.name,
  };
}

function mapBom(bom: {
  id: string;
  bomNumber: string;
  name: string;
  version: number;
  status: string;
  yieldQuantity: unknown;
  uom: string;
  outputItem: { name: string; sku: string };
  components: Array<{
    id: string;
    quantity: unknown;
    scrapPercent: unknown;
    operationStep: string;
    componentItem: { name: string; sku: string };
  }>;
}): BomView {
  return {
    id: bom.id,
    bomNumber: bom.bomNumber,
    name: bom.name,
    version: bom.version,
    status: bom.status,
    outputItemName: bom.outputItem.name,
    outputSku: bom.outputItem.sku,
    yieldQuantity: decimalToNumber(bom.yieldQuantity),
    uom: bom.uom,
    componentCount: bom.components.length,
    components: bom.components.map(mapBomComponent),
  };
}

function mapBomComponent(component: {
  id: string;
  quantity: unknown;
  scrapPercent: unknown;
  operationStep: string;
  componentItem: { name: string; sku: string };
}): BomComponentView {
  return {
    id: component.id,
    componentName: component.componentItem.name,
    componentSku: component.componentItem.sku,
    quantity: decimalToNumber(component.quantity),
    scrapPercent: decimalToNumber(component.scrapPercent),
    operationStep: component.operationStep,
  };
}

function mapProductionPlan(plan: {
  id: string;
  planNumber: string;
  name: string;
  status: string;
  plannedQuantity: unknown;
  completedQuantity: unknown;
  uom: string;
  scheduledStart: Date | null;
  scheduledEnd: Date | null;
  ownerRole: string | null;
  outputItem: { name: string; sku: string };
  warehouse: { name: string } | null;
  bom: { bomNumber: string } | null;
}): ProductionPlanView {
  return {
    id: plan.id,
    planNumber: plan.planNumber,
    name: plan.name,
    status: plan.status,
    plannedQuantity: decimalToNumber(plan.plannedQuantity),
    completedQuantity: decimalToNumber(plan.completedQuantity),
    uom: plan.uom,
    scheduledStart: plan.scheduledStart?.toISOString() ?? null,
    scheduledEnd: plan.scheduledEnd?.toISOString() ?? null,
    ownerRole: plan.ownerRole,
    outputItemName: plan.outputItem.name,
    outputSku: plan.outputItem.sku,
    warehouseName: plan.warehouse?.name ?? null,
    bomNumber: plan.bom?.bomNumber ?? null,
  };
}

function mapQualityCheck(check: {
  id: string;
  checkNumber: string;
  checkType: string;
  status: string;
  sampleSize: unknown;
  defectCount: number;
  inspectorRole: string | null;
  dueAt: Date | null;
  completedAt: Date | null;
  item: { name: string } | null;
  productionPlan: { planNumber: string } | null;
  grn: { grnNumber: string } | null;
}): QualityCheckView {
  return {
    id: check.id,
    checkNumber: check.checkNumber,
    checkType: check.checkType,
    status: check.status,
    sampleSize: decimalToNumberOrNull(check.sampleSize),
    defectCount: check.defectCount,
    inspectorRole: check.inspectorRole,
    dueAt: check.dueAt?.toISOString() ?? null,
    completedAt: check.completedAt?.toISOString() ?? null,
    itemName: check.item?.name ?? null,
    planNumber: check.productionPlan?.planNumber ?? null,
    grnNumber: check.grn?.grnNumber ?? null,
  };
}

function mapAiAlert(alert: {
  id: string;
  alertType: string;
  title: string;
  description: string;
  severity: SupplyChainAiAlertView["severity"];
  confidence: unknown;
  recommendedAction: string | null;
  entityType: string | null;
}): SupplyChainAiAlertView {
  return {
    id: alert.id,
    alertType: alert.alertType,
    title: alert.title,
    description: alert.description,
    severity: alert.severity,
    confidence: decimalToNumberOrNull(alert.confidence),
    recommendedAction: alert.recommendedAction,
    entityType: alert.entityType,
  };
}

function mapAuditLog(log: {
  id: string;
  action: string;
  resource: string;
  severity: string;
  createdAt: Date;
}): SupplyChainAuditView {
  return {
    id: log.id,
    action: log.action,
    resource: log.resource,
    severity: log.severity,
    createdAt: log.createdAt.toISOString(),
  };
}

function decimalToNumber(value: unknown): number {
  return decimalToNumberOrNull(value) ?? 0;
}

function decimalToNumberOrNull(value: unknown): number | null {
  if (value == null) return null;
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value) || 0;
  if (typeof value === "object" && "toString" in value) {
    const parsed = Number(value.toString());
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function isEscalated(severity: string): boolean {
  return severity === "HIGH" || severity === "CRITICAL";
}

function alertSort(a: SupplyChainAiAlertView, b: SupplyChainAiAlertView): number {
  return severityRank(b.severity) - severityRank(a.severity);
}

function severityRank(severity: SupplyChainAiAlertView["severity"]): number {
  return {
    LOW: 1,
    MEDIUM: 2,
    HIGH: 3,
    CRITICAL: 4,
  }[severity];
}

function formatInr(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
    notation: Math.abs(amount) >= 1000000 ? "compact" : "standard",
  }).format(amount);
}

function formatCompact(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 1,
    notation: Math.abs(value) >= 1000 ? "compact" : "standard",
  }).format(value);
}

function formatPercent(value: number | null): string {
  return value == null ? "n/a" : `${Math.round(value)}%`;
}
