import { Prisma, type PrismaClient } from "../app/generated/prisma/client";

type WarehouseCode = "WH-MUM" | "WH-BLR" | "WH-DEL";
type ItemSku =
  | "SKU-RM-CPU"
  | "SKU-RM-SENSOR"
  | "SKU-SFG-CONTROLLER"
  | "SKU-FG-ASTRA-HUB"
  | "SKU-PKG-BOX";

const WAREHOUSES: Array<{
  code: WarehouseCode;
  name: string;
  location: string;
  status: "ACTIVE" | "HOLD";
  capacityUnits: number;
  utilizationPercent: number;
  managerRole: string;
}> = [
  {
    code: "WH-MUM",
    name: "Mumbai Central Warehouse",
    location: "Mumbai, Maharashtra",
    status: "ACTIVE",
    capacityUnits: 125000,
    utilizationPercent: 78.4,
    managerRole: "manager",
  },
  {
    code: "WH-BLR",
    name: "Bengaluru Assembly Warehouse",
    location: "Bengaluru, Karnataka",
    status: "ACTIVE",
    capacityUnits: 92000,
    utilizationPercent: 83.1,
    managerRole: "manager",
  },
  {
    code: "WH-DEL",
    name: "Delhi Dispatch Hub",
    location: "Delhi NCR",
    status: "HOLD",
    capacityUnits: 65000,
    utilizationPercent: 61.7,
    managerRole: "operations-manager",
  },
];

const ITEMS: Array<{
  sku: ItemSku;
  name: string;
  itemType:
    | "RAW_MATERIAL"
    | "SEMI_FINISHED"
    | "FINISHED_GOOD"
    | "PACKAGING";
  category: string;
  uom: string;
  safetyStock: number;
  reorderPoint: number;
  onHandStock: number;
  reservedStock: number;
  availableStock: number;
  standardCost: number;
}> = [
  {
    sku: "SKU-RM-CPU",
    name: "Controller PCB Assembly",
    itemType: "RAW_MATERIAL",
    category: "Electronics",
    uom: "EA",
    safetyStock: 120,
    reorderPoint: 180,
    onHandStock: 410,
    reservedStock: 170,
    availableStock: 240,
    standardCost: 3250,
  },
  {
    sku: "SKU-RM-SENSOR",
    name: "Industrial Sensor Pack",
    itemType: "RAW_MATERIAL",
    category: "Electronics",
    uom: "EA",
    safetyStock: 80,
    reorderPoint: 100,
    onHandStock: 92,
    reservedStock: 60,
    availableStock: 32,
    standardCost: 1180,
  },
  {
    sku: "SKU-SFG-CONTROLLER",
    name: "Astra Hub Controller Core",
    itemType: "SEMI_FINISHED",
    category: "Assembly",
    uom: "EA",
    safetyStock: 60,
    reorderPoint: 90,
    onHandStock: 155,
    reservedStock: 95,
    availableStock: 60,
    standardCost: 6850,
  },
  {
    sku: "SKU-FG-ASTRA-HUB",
    name: "ASTRA Edge Hub",
    itemType: "FINISHED_GOOD",
    category: "Finished Goods",
    uom: "EA",
    safetyStock: 100,
    reorderPoint: 140,
    onHandStock: 315,
    reservedStock: 220,
    availableStock: 95,
    standardCost: 14200,
  },
  {
    sku: "SKU-PKG-BOX",
    name: "Export Packaging Kit",
    itemType: "PACKAGING",
    category: "Packaging",
    uom: "EA",
    safetyStock: 300,
    reorderPoint: 450,
    onHandStock: 980,
    reservedStock: 410,
    availableStock: 570,
    standardCost: 145,
  },
];

export async function seedSupplyChainData(
  prisma: PrismaClient,
  organizationId: string,
  actorUserId: string,
) {
  const [vendors, customers] = await Promise.all([
    prisma.vendor.findMany({
      where: { organizationId, code: { in: ["VEN-TECHNOVA", "VEN-SHAKTI"] } },
      select: { id: true, code: true, name: true },
    }),
    prisma.customer.findMany({
      where: { organizationId, code: { in: ["CUST-NORTHSTAR", "CUST-APEX"] } },
      select: { id: true, code: true, name: true },
    }),
  ]);
  const vendorIds = new Map(vendors.map((vendor) => [vendor.code, vendor]));
  const customerIds = new Map(customers.map((customer) => [customer.code, customer]));

  const warehouses = await seedWarehouses(prisma, organizationId);
  const items = await seedInventoryItems(prisma, organizationId);
  const grns = await seedGoodsReceipts(prisma, organizationId, warehouses, vendorIds);
  const dispatches = await seedDispatches(prisma, organizationId, warehouses, customerIds);
  const bom = await seedBom(prisma, organizationId, items);
  const plans = await seedProductionPlans(prisma, organizationId, warehouses, items, bom.id);
  await seedStockMovements(prisma, organizationId, warehouses, items);
  await seedQualityChecks(prisma, organizationId, warehouses, items, grns, plans);
  await seedAiAlerts(prisma, organizationId, items, dispatches, plans);
  await seedSupplyChainAudit(prisma, organizationId, actorUserId, {
    grnHoldId: grns.get("GRN-2405-119")?.id ?? null,
    dispatchExceptionId: dispatches.get("DSP-2405-045")?.id ?? null,
    bomId: bom.id,
    blockedPlanId: plans.get("PROD-0526-002")?.id ?? null,
  });

  console.log("  Inventory/Production: seeded warehouses, stock, GRNs, dispatches, BOM, plans, QC, and AI alerts");
}

async function seedWarehouses(prisma: PrismaClient, organizationId: string) {
  const rows = new Map<WarehouseCode, { id: string; name: string }>();
  for (const item of WAREHOUSES) {
    const warehouse = await prisma.warehouse.upsert({
      where: { organizationId_code: { organizationId, code: item.code } },
      create: {
        organizationId,
        code: item.code,
        name: item.name,
        location: item.location,
        status: item.status,
        capacityUnits: item.capacityUnits,
        utilizationPercent: item.utilizationPercent,
        managerRole: item.managerRole,
        metadata: asJson({ seedProfile: "inventory-production" }),
      },
      update: {
        name: item.name,
        location: item.location,
        status: item.status,
        capacityUnits: item.capacityUnits,
        utilizationPercent: item.utilizationPercent,
        managerRole: item.managerRole,
        metadata: asJson({ seedProfile: "inventory-production" }),
        deletedAt: null,
      },
      select: { id: true, name: true },
    });
    rows.set(item.code, warehouse);
  }
  return rows;
}

async function seedInventoryItems(prisma: PrismaClient, organizationId: string) {
  const rows = new Map<ItemSku, { id: string; name: string; sku: string }>();
  for (const item of ITEMS) {
    const inventoryItem = await prisma.inventoryItem.upsert({
      where: { organizationId_sku: { organizationId, sku: item.sku } },
      create: {
        organizationId,
        sku: item.sku,
        name: item.name,
        itemType: item.itemType,
        category: item.category,
        uom: item.uom,
        safetyStock: item.safetyStock,
        reorderPoint: item.reorderPoint,
        onHandStock: item.onHandStock,
        reservedStock: item.reservedStock,
        availableStock: item.availableStock,
        standardCost: item.standardCost,
        metadata: asJson({ seedProfile: "inventory-production" }),
      },
      update: {
        name: item.name,
        itemType: item.itemType,
        category: item.category,
        uom: item.uom,
        safetyStock: item.safetyStock,
        reorderPoint: item.reorderPoint,
        onHandStock: item.onHandStock,
        reservedStock: item.reservedStock,
        availableStock: item.availableStock,
        standardCost: item.standardCost,
        status: "ACTIVE",
        metadata: asJson({ seedProfile: "inventory-production" }),
        deletedAt: null,
      },
      select: { id: true, name: true, sku: true },
    });
    rows.set(item.sku, inventoryItem);
  }
  return rows;
}

async function seedGoodsReceipts(
  prisma: PrismaClient,
  organizationId: string,
  warehouses: Map<WarehouseCode, { id: string; name: string }>,
  vendors: Map<string, { id: string; name: string }>,
) {
  const rows = new Map<string, { id: string }>();
  const seeds = [
    {
      grnNumber: "GRN-2405-118",
      poNumber: "P2P-PO-1048",
      warehouseCode: "WH-MUM" as WarehouseCode,
      vendorCode: "VEN-TECHNOVA",
      supplierName: "TechNova Systems",
      status: "POSTED" as const,
      receivedHoursAgo: 20,
      postedHoursAgo: 18,
      itemCount: 2,
      totalQuantity: 250,
      qualityStatus: "PASSED",
      ownerRole: "warehouse-manager",
    },
    {
      grnNumber: "GRN-2405-119",
      poNumber: "P2P-INV-3181",
      warehouseCode: "WH-BLR" as WarehouseCode,
      vendorCode: "VEN-SHAKTI",
      supplierName: "Shakti Industrial Supplies",
      status: "QUALITY_HOLD" as const,
      receivedHoursAgo: 8,
      postedHoursAgo: null,
      itemCount: 1,
      totalQuantity: 92,
      qualityStatus: "HOLD - dimensional variance",
      ownerRole: "quality-manager",
    },
  ];

  for (const seed of seeds) {
    const row = await prisma.goodsReceiptNote.upsert({
      where: {
        organizationId_grnNumber: { organizationId, grnNumber: seed.grnNumber },
      },
      create: {
        organizationId,
        warehouseId: warehouses.get(seed.warehouseCode)?.id ?? "",
        vendorId: vendors.get(seed.vendorCode)?.id ?? null,
        grnNumber: seed.grnNumber,
        poNumber: seed.poNumber,
        supplierName: vendors.get(seed.vendorCode)?.name ?? seed.supplierName,
        status: seed.status,
        receivedAt: hoursFromNow(-seed.receivedHoursAgo),
        postedAt: seed.postedHoursAgo == null ? null : hoursFromNow(-seed.postedHoursAgo),
        itemCount: seed.itemCount,
        totalQuantity: seed.totalQuantity,
        qualityStatus: seed.qualityStatus,
        ownerRole: seed.ownerRole,
        metadata: asJson({ seedProfile: "inventory-production" }),
      },
      update: {
        warehouseId: warehouses.get(seed.warehouseCode)?.id ?? "",
        vendorId: vendors.get(seed.vendorCode)?.id ?? null,
        poNumber: seed.poNumber,
        supplierName: vendors.get(seed.vendorCode)?.name ?? seed.supplierName,
        status: seed.status,
        receivedAt: hoursFromNow(-seed.receivedHoursAgo),
        postedAt: seed.postedHoursAgo == null ? null : hoursFromNow(-seed.postedHoursAgo),
        itemCount: seed.itemCount,
        totalQuantity: seed.totalQuantity,
        qualityStatus: seed.qualityStatus,
        ownerRole: seed.ownerRole,
        metadata: asJson({ seedProfile: "inventory-production" }),
      },
      select: { id: true },
    });
    rows.set(seed.grnNumber, row);
  }
  return rows;
}

async function seedDispatches(
  prisma: PrismaClient,
  organizationId: string,
  warehouses: Map<WarehouseCode, { id: string; name: string }>,
  customers: Map<string, { id: string; name: string }>,
) {
  const rows = new Map<string, { id: string }>();
  const seeds = [
    {
      dispatchNumber: "DSP-2405-044",
      orderNumber: "OTC-SO-7702",
      warehouseCode: "WH-DEL" as WarehouseCode,
      customerCode: "CUST-NORTHSTAR",
      customerName: "Northstar Retail",
      status: "PACKED" as const,
      plannedShipInHours: 10,
      dispatchedHoursAgo: null,
      itemCount: 2,
      totalQuantity: 220,
      carrier: "Blue Dart Priority",
      ownerRole: "dispatch-manager",
    },
    {
      dispatchNumber: "DSP-2405-045",
      orderNumber: "OTC-INV-5591",
      warehouseCode: "WH-MUM" as WarehouseCode,
      customerCode: "CUST-APEX",
      customerName: "Apex Distribution",
      status: "EXCEPTION" as const,
      plannedShipInHours: -14,
      dispatchedHoursAgo: null,
      itemCount: 1,
      totalQuantity: 95,
      carrier: "Carrier pending",
      ownerRole: "dispatch-manager",
    },
  ];

  for (const seed of seeds) {
    const row = await prisma.dispatchOrder.upsert({
      where: {
        organizationId_dispatchNumber: {
          organizationId,
          dispatchNumber: seed.dispatchNumber,
        },
      },
      create: dispatchData(organizationId, warehouses, customers, seed),
      update: dispatchData(organizationId, warehouses, customers, seed),
      select: { id: true },
    });
    rows.set(seed.dispatchNumber, row);
  }
  return rows;
}

async function seedBom(
  prisma: PrismaClient,
  organizationId: string,
  items: Map<ItemSku, { id: string; name: string; sku: string }>,
) {
  const bom = await prisma.billOfMaterial.upsert({
    where: {
      organizationId_bomNumber: {
        organizationId,
        bomNumber: "BOM-ASTRA-HUB-01",
      },
    },
    create: {
      organizationId,
      outputItemId: items.get("SKU-FG-ASTRA-HUB")?.id ?? "",
      bomNumber: "BOM-ASTRA-HUB-01",
      name: "ASTRA Edge Hub Standard BOM",
      version: 1,
      status: "ACTIVE",
      yieldQuantity: 1,
      uom: "EA",
      effectiveFrom: daysFromNow(-15),
      ownerRole: "production-manager",
      metadata: asJson({ seedProfile: "inventory-production" }),
    },
    update: {
      outputItemId: items.get("SKU-FG-ASTRA-HUB")?.id ?? "",
      name: "ASTRA Edge Hub Standard BOM",
      version: 1,
      status: "ACTIVE",
      yieldQuantity: 1,
      uom: "EA",
      effectiveFrom: daysFromNow(-15),
      ownerRole: "production-manager",
      metadata: asJson({ seedProfile: "inventory-production" }),
    },
    select: { id: true },
  });

  const components = [
    {
      sku: "SKU-RM-CPU" as ItemSku,
      quantity: 1,
      scrapPercent: 1.2,
      operationStep: "controller-assembly",
    },
    {
      sku: "SKU-RM-SENSOR" as ItemSku,
      quantity: 2,
      scrapPercent: 2.5,
      operationStep: "sensor-fitment",
    },
    {
      sku: "SKU-PKG-BOX" as ItemSku,
      quantity: 1,
      scrapPercent: 0.5,
      operationStep: "packing",
    },
  ];

  for (const component of components) {
    const componentItemId = items.get(component.sku)?.id ?? "";
    await prisma.bomComponent.upsert({
      where: {
        bomId_componentItemId_operationStep: {
          bomId: bom.id,
          componentItemId,
          operationStep: component.operationStep,
        },
      },
      create: {
        organizationId,
        bomId: bom.id,
        componentItemId,
        quantity: component.quantity,
        scrapPercent: component.scrapPercent,
        operationStep: component.operationStep,
        metadata: asJson({ seedProfile: "inventory-production" }),
      },
      update: {
        quantity: component.quantity,
        scrapPercent: component.scrapPercent,
        metadata: asJson({ seedProfile: "inventory-production" }),
      },
    });
  }

  return bom;
}

async function seedProductionPlans(
  prisma: PrismaClient,
  organizationId: string,
  warehouses: Map<WarehouseCode, { id: string; name: string }>,
  items: Map<ItemSku, { id: string; name: string; sku: string }>,
  bomId: string,
) {
  const rows = new Map<string, { id: string }>();
  const seeds = [
    {
      planNumber: "PROD-0526-001",
      name: "ASTRA Edge Hub May Batch",
      status: "IN_PROGRESS" as const,
      plannedQuantity: 500,
      completedQuantity: 210,
      scheduledStartHours: -18,
      scheduledEndHours: 30,
      warehouseCode: "WH-BLR" as WarehouseCode,
      ownerRole: "production-manager",
    },
    {
      planNumber: "PROD-0526-002",
      name: "ASTRA Edge Hub Priority Batch",
      status: "BLOCKED" as const,
      plannedQuantity: 250,
      completedQuantity: 0,
      scheduledStartHours: 12,
      scheduledEndHours: 54,
      warehouseCode: "WH-BLR" as WarehouseCode,
      ownerRole: "production-manager",
    },
  ];

  for (const seed of seeds) {
    const row = await prisma.productionPlan.upsert({
      where: { organizationId_planNumber: { organizationId, planNumber: seed.planNumber } },
      create: productionPlanData(organizationId, warehouses, items, bomId, seed),
      update: productionPlanData(organizationId, warehouses, items, bomId, seed),
      select: { id: true },
    });
    rows.set(seed.planNumber, row);
  }
  return rows;
}

async function seedStockMovements(
  prisma: PrismaClient,
  organizationId: string,
  warehouses: Map<WarehouseCode, { id: string; name: string }>,
  items: Map<ItemSku, { id: string; name: string; sku: string }>,
) {
  const seeds = [
    movement("INV-MOV-9001", "WH-MUM", "SKU-RM-CPU", "GRN", "POSTED", 250, 3250, "GRN", "GRN-2405-118", -18),
    movement("INV-MOV-9002", "WH-BLR", "SKU-RM-SENSOR", "GRN", "BLOCKED", 92, 1180, "GRN", "GRN-2405-119", -8),
    movement("INV-MOV-9003", "WH-BLR", "SKU-RM-CPU", "PRODUCTION_CONSUMPTION", "POSTED", -210, 3250, "PRODUCTION", "PROD-0526-001", -4),
    movement("INV-MOV-9004", "WH-BLR", "SKU-FG-ASTRA-HUB", "PRODUCTION_OUTPUT", "POSTED", 210, 14200, "PRODUCTION", "PROD-0526-001", -2),
    movement("INV-MOV-9005", "WH-DEL", "SKU-FG-ASTRA-HUB", "DISPATCH", "DRAFT", -220, 14200, "DISPATCH", "DSP-2405-044", 10),
  ];

  for (const seed of seeds) {
    await prisma.stockMovement.upsert({
      where: {
        organizationId_movementNumber: {
          organizationId,
          movementNumber: seed.movementNumber,
        },
      },
      create: stockMovementData(organizationId, warehouses, items, seed),
      update: stockMovementData(organizationId, warehouses, items, seed),
    });
  }
}

async function seedQualityChecks(
  prisma: PrismaClient,
  organizationId: string,
  warehouses: Map<WarehouseCode, { id: string; name: string }>,
  items: Map<ItemSku, { id: string; name: string; sku: string }>,
  grns: Map<string, { id: string }>,
  plans: Map<string, { id: string }>,
) {
  const seeds = [
    quality("QC-GRN-118", "Incoming GRN inspection", "PASSED", "SKU-RM-CPU", "WH-MUM", null, "GRN-2405-118", 30, 0, -17, -16, "quality-manager", "Accepted for posting."),
    quality("QC-GRN-119", "Incoming dimensional inspection", "HOLD", "SKU-RM-SENSOR", "WH-BLR", null, "GRN-2405-119", 20, 3, 4, null, "quality-manager", "Three units outside tolerance."),
    quality("QC-PROD-001", "In-process assembly audit", "PENDING", "SKU-FG-ASTRA-HUB", "WH-BLR", "PROD-0526-001", null, 25, 0, 8, null, "quality-manager", "Sampling pending at station 3."),
    quality("QC-PROD-002", "Pre-release functional test", "FAILED", "SKU-FG-ASTRA-HUB", "WH-BLR", "PROD-0526-002", null, 15, 2, 14, null, "quality-manager", "Functional variance blocks release."),
  ];

  for (const seed of seeds) {
    await prisma.qualityCheck.upsert({
      where: { organizationId_checkNumber: { organizationId, checkNumber: seed.checkNumber } },
      create: qualityData(organizationId, warehouses, items, grns, plans, seed),
      update: qualityData(organizationId, warehouses, items, grns, plans, seed),
    });
  }
}

async function seedAiAlerts(
  prisma: PrismaClient,
  organizationId: string,
  items: Map<ItemSku, { id: string; name: string; sku: string }>,
  dispatches: Map<string, { id: string }>,
  plans: Map<string, { id: string }>,
) {
  const alerts = [
    {
      sourceKey: "inventory:alert:stockout:sensor",
      alertType: "STOCKOUT" as const,
      entityType: "inventory_item",
      entityId: items.get("SKU-RM-SENSOR")?.id ?? null,
      title: "Sensor stock below reorder point",
      description: "Available sensor stock is below reorder point while priority production is queued.",
      severity: "HIGH" as const,
      confidence: 91.4,
      recommendedAction: "Expedite open GRN review or create emergency purchase request.",
    },
    {
      sourceKey: "inventory:alert:dispatch:apex",
      alertType: "DISPATCH_DELAY" as const,
      entityType: "dispatch_order",
      entityId: dispatches.get("DSP-2405-045")?.id ?? null,
      title: "Dispatch exception threatens customer SLA",
      description: "Apex dispatch is past planned ship time and carrier assignment remains unresolved.",
      severity: "MEDIUM" as const,
      confidence: 82.2,
      recommendedAction: "Assign alternate carrier and notify customer success.",
    },
    {
      sourceKey: "production:alert:quality:blocked-batch",
      alertType: "QUALITY_FAILURE" as const,
      entityType: "production_plan",
      entityId: plans.get("PROD-0526-002")?.id ?? null,
      title: "Functional QC failure blocks batch release",
      description: "Priority batch has failed pre-release checks and requires rework disposition.",
      severity: "HIGH" as const,
      confidence: 88.9,
      recommendedAction: "Route failed sample to engineering review and hold customer promise dates.",
    },
    {
      sourceKey: "production:alert:bom:sensor-variance",
      alertType: "BOM_VARIANCE" as const,
      entityType: "inventory_item",
      entityId: items.get("SKU-RM-SENSOR")?.id ?? null,
      title: "Sensor scrap trending above BOM allowance",
      description: "Observed sensor rejects exceed standard scrap allowance for current BOM version.",
      severity: "MEDIUM" as const,
      confidence: 79.6,
      recommendedAction: "Review supplier lot and update yield assumption if variance persists.",
    },
    {
      sourceKey: "production:alert:capacity:blr",
      alertType: "CAPACITY_RISK" as const,
      entityType: "warehouse",
      entityId: null,
      title: "Assembly warehouse near capacity threshold",
      description: "Bengaluru assembly utilization is above 80% with two active production plans.",
      severity: "HIGH" as const,
      confidence: 84.3,
      recommendedAction: "Move finished goods to dispatch hub before releasing the next batch.",
    },
  ];

  for (const alert of alerts) {
    await prisma.inventoryAiAlert.upsert({
      where: {
        organizationId_sourceKey: {
          organizationId,
          sourceKey: alert.sourceKey,
        },
      },
      create: {
        organizationId,
        sourceKey: alert.sourceKey,
        alertType: alert.alertType,
        entityType: alert.entityType,
        entityId: alert.entityId,
        title: alert.title,
        description: alert.description,
        severity: alert.severity,
        confidence: alert.confidence,
        status: "OPEN",
        recommendedAction: alert.recommendedAction,
        metadata: asJson({ seedProfile: "inventory-production" }),
      },
      update: {
        alertType: alert.alertType,
        entityType: alert.entityType,
        entityId: alert.entityId,
        title: alert.title,
        description: alert.description,
        severity: alert.severity,
        confidence: alert.confidence,
        status: "OPEN",
        recommendedAction: alert.recommendedAction,
        resolvedAt: null,
        metadata: asJson({ seedProfile: "inventory-production" }),
      },
    });
  }
}

async function seedSupplyChainAudit(
  prisma: PrismaClient,
  organizationId: string,
  actorUserId: string,
  ids: {
    grnHoldId: string | null;
    dispatchExceptionId: string | null;
    bomId: string;
    blockedPlanId: string | null;
  },
) {
  const logs = [
    audit("inventory:warehouse:capacity-reviewed", "warehouse.capacity.reviewed", "warehouse", null, "INFO", { utilizationPercent: 83.1 }),
    audit("inventory:item:reorder-flagged", "inventory.reorder.flagged", "inventory", null, "WARNING", { sku: "SKU-RM-SENSOR" }),
    audit("inventory:grn:quality-hold", "grn.quality.hold", "grn", ids.grnHoldId, "WARNING", { grnNumber: "GRN-2405-119" }),
    audit("inventory:dispatch:exception", "dispatch.exception.logged", "dispatch", ids.dispatchExceptionId, "ERROR", { dispatchNumber: "DSP-2405-045" }),
    audit("production:bom:activated", "bom.version.activated", "bom", ids.bomId, "INFO", { bomNumber: "BOM-ASTRA-HUB-01", version: 1 }),
    audit("production:plan:blocked", "production.plan.blocked", "production", ids.blockedPlanId, "ERROR", { planNumber: "PROD-0526-002" }),
    audit("production:quality:failed", "quality.check.failed", "quality", ids.blockedPlanId, "ERROR", { checkNumber: "QC-PROD-002" }),
  ];

  for (const log of logs) {
    const existing = await prisma.auditLog.findFirst({
      where: {
        organizationId,
        resource: log.resource,
        action: log.action,
        correlationId: log.correlationId,
      },
      select: { id: true },
    });

    if (existing) continue;

    await prisma.auditLog.create({
      data: {
        organizationId,
        userId: actorUserId,
        action: log.action,
        resource: log.resource,
        resourceId: log.resourceId,
        severity: log.severity,
        after: asJson(log.details),
        metadata: asJson({ source: "seed", seedProfile: "inventory-production" }),
        correlationId: log.correlationId,
      },
    });
  }
}

function dispatchData(
  organizationId: string,
  warehouses: Map<WarehouseCode, { id: string; name: string }>,
  customers: Map<string, { id: string; name: string }>,
  seed: {
    dispatchNumber: string;
    orderNumber: string;
    warehouseCode: WarehouseCode;
    customerCode: string;
    customerName: string;
    status: "PACKED" | "EXCEPTION";
    plannedShipInHours: number;
    dispatchedHoursAgo: number | null;
    itemCount: number;
    totalQuantity: number;
    carrier: string;
    ownerRole: string;
  },
) {
  return {
    organizationId,
    warehouseId: warehouses.get(seed.warehouseCode)?.id ?? "",
    customerId: customers.get(seed.customerCode)?.id ?? null,
    dispatchNumber: seed.dispatchNumber,
    orderNumber: seed.orderNumber,
    customerName: customers.get(seed.customerCode)?.name ?? seed.customerName,
    status: seed.status,
    plannedShipAt: hoursFromNow(seed.plannedShipInHours),
    dispatchedAt:
      seed.dispatchedHoursAgo == null ? null : hoursFromNow(-seed.dispatchedHoursAgo),
    itemCount: seed.itemCount,
    totalQuantity: seed.totalQuantity,
    carrier: seed.carrier,
    ownerRole: seed.ownerRole,
    metadata: asJson({ seedProfile: "inventory-production" }),
  };
}

function productionPlanData(
  organizationId: string,
  warehouses: Map<WarehouseCode, { id: string; name: string }>,
  items: Map<ItemSku, { id: string; name: string; sku: string }>,
  bomId: string,
  seed: {
    planNumber: string;
    name: string;
    status: "IN_PROGRESS" | "BLOCKED";
    plannedQuantity: number;
    completedQuantity: number;
    scheduledStartHours: number;
    scheduledEndHours: number;
    warehouseCode: WarehouseCode;
    ownerRole: string;
  },
) {
  return {
    organizationId,
    warehouseId: warehouses.get(seed.warehouseCode)?.id ?? null,
    bomId,
    outputItemId: items.get("SKU-FG-ASTRA-HUB")?.id ?? "",
    planNumber: seed.planNumber,
    name: seed.name,
    status: seed.status,
    plannedQuantity: seed.plannedQuantity,
    completedQuantity: seed.completedQuantity,
    uom: "EA",
    scheduledStart: hoursFromNow(seed.scheduledStartHours),
    scheduledEnd: hoursFromNow(seed.scheduledEndHours),
    actualStart: seed.status === "IN_PROGRESS" ? hoursFromNow(-12) : null,
    actualEnd: null,
    ownerRole: seed.ownerRole,
    metadata: asJson({ seedProfile: "inventory-production" }),
  };
}

function stockMovementData(
  organizationId: string,
  warehouses: Map<WarehouseCode, { id: string; name: string }>,
  items: Map<ItemSku, { id: string; name: string; sku: string }>,
  seed: ReturnType<typeof movement>,
) {
  return {
    organizationId,
    warehouseId: warehouses.get(seed.warehouseCode)?.id ?? "",
    itemId: items.get(seed.itemSku)?.id ?? "",
    movementNumber: seed.movementNumber,
    movementType: seed.movementType,
    status: seed.status,
    quantity: seed.quantity,
    unitCost: seed.unitCost,
    referenceType: seed.referenceType,
    referenceNumber: seed.referenceNumber,
    occurredAt: hoursFromNow(seed.occurredInHours),
    postedAt: seed.status === "POSTED" ? hoursFromNow(seed.occurredInHours + 1) : null,
    metadata: asJson({ seedProfile: "inventory-production" }),
  };
}

function qualityData(
  organizationId: string,
  warehouses: Map<WarehouseCode, { id: string; name: string }>,
  items: Map<ItemSku, { id: string; name: string; sku: string }>,
  grns: Map<string, { id: string }>,
  plans: Map<string, { id: string }>,
  seed: ReturnType<typeof quality>,
) {
  return {
    organizationId,
    warehouseId: seed.warehouseCode == null ? null : warehouses.get(seed.warehouseCode)?.id ?? null,
    itemId: seed.itemSku == null ? null : items.get(seed.itemSku)?.id ?? null,
    productionPlanId: seed.planNumber == null ? null : plans.get(seed.planNumber)?.id ?? null,
    grnId: seed.grnNumber == null ? null : grns.get(seed.grnNumber)?.id ?? null,
    checkNumber: seed.checkNumber,
    checkType: seed.checkType,
    status: seed.status,
    sampleSize: seed.sampleSize,
    defectCount: seed.defectCount,
    inspectorRole: seed.inspectorRole,
    dueAt: hoursFromNow(seed.dueInHours),
    completedAt:
      seed.completedHoursAgo == null ? null : hoursFromNow(-seed.completedHoursAgo),
    notes: seed.notes,
    metadata: asJson({ seedProfile: "inventory-production" }),
  };
}

function movement(
  movementNumber: string,
  warehouseCode: WarehouseCode,
  itemSku: ItemSku,
  movementType:
    | "GRN"
    | "DISPATCH"
    | "PRODUCTION_CONSUMPTION"
    | "PRODUCTION_OUTPUT",
  status: "POSTED" | "DRAFT" | "BLOCKED",
  quantity: number,
  unitCost: number,
  referenceType: string,
  referenceNumber: string,
  occurredInHours: number,
) {
  return {
    movementNumber,
    warehouseCode,
    itemSku,
    movementType,
    status,
    quantity,
    unitCost,
    referenceType,
    referenceNumber,
    occurredInHours,
  };
}

function quality(
  checkNumber: string,
  checkType: string,
  status: "PASSED" | "HOLD" | "PENDING" | "FAILED",
  itemSku: ItemSku | null,
  warehouseCode: WarehouseCode | null,
  planNumber: string | null,
  grnNumber: string | null,
  sampleSize: number,
  defectCount: number,
  dueInHours: number,
  completedHoursAgo: number | null,
  inspectorRole: string,
  notes: string,
) {
  return {
    checkNumber,
    checkType,
    status,
    itemSku,
    warehouseCode,
    planNumber,
    grnNumber,
    sampleSize,
    defectCount,
    dueInHours,
    completedHoursAgo,
    inspectorRole,
    notes,
  };
}

function audit(
  correlationId: string,
  action: string,
  resource: string,
  resourceId: string | null,
  severity: "INFO" | "WARNING" | "ERROR",
  details: Record<string, unknown>,
) {
  return { correlationId, action, resource, resourceId, severity, details };
}

function hoursFromNow(hours: number): Date {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}

function daysFromNow(days: number): Date {
  return hoursFromNow(days * 24);
}

function asJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value ?? {})) as Prisma.InputJsonValue;
}
