-- CreateEnum
CREATE TYPE "WarehouseStatus" AS ENUM ('ACTIVE', 'HOLD', 'CLOSED');

-- CreateEnum
CREATE TYPE "InventoryItemType" AS ENUM ('RAW_MATERIAL', 'SEMI_FINISHED', 'FINISHED_GOOD', 'PACKAGING', 'SPARE', 'CONSUMABLE');

-- CreateEnum
CREATE TYPE "InventoryMovementType" AS ENUM ('RECEIPT', 'ISSUE', 'TRANSFER', 'ADJUSTMENT', 'GRN', 'DISPATCH', 'PRODUCTION_CONSUMPTION', 'PRODUCTION_OUTPUT', 'RETURN');

-- CreateEnum
CREATE TYPE "InventoryMovementStatus" AS ENUM ('DRAFT', 'POSTED', 'REVERSED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "GrnStatus" AS ENUM ('DRAFT', 'RECEIVED', 'QUALITY_HOLD', 'POSTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DispatchStatus" AS ENUM ('PLANNED', 'PICKING', 'PACKED', 'DISPATCHED', 'DELIVERED', 'EXCEPTION');

-- CreateEnum
CREATE TYPE "BomStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ProductionPlanStatus" AS ENUM ('DRAFT', 'PLANNED', 'RELEASED', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "QualityCheckStatus" AS ENUM ('PENDING', 'PASSED', 'FAILED', 'REWORK', 'HOLD');

-- CreateEnum
CREATE TYPE "SupplyChainAlertType" AS ENUM ('STOCKOUT', 'OVERSTOCK', 'QUALITY_FAILURE', 'LATE_GRN', 'DISPATCH_DELAY', 'CAPACITY_RISK', 'BOM_VARIANCE');

-- CreateTable
CREATE TABLE "warehouses" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT,
    "status" "WarehouseStatus" NOT NULL DEFAULT 'ACTIVE',
    "capacityUnits" DECIMAL(18,4),
    "utilizationPercent" DECIMAL(5,2),
    "managerRole" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "warehouses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_items" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "itemType" "InventoryItemType" NOT NULL,
    "category" TEXT,
    "uom" TEXT NOT NULL DEFAULT 'EA',
    "safetyStock" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "reorderPoint" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "onHandStock" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "reservedStock" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "availableStock" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "standardCost" DECIMAL(18,2),
    "currency" CHAR(3) NOT NULL DEFAULT 'INR',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "inventory_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_movements" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "movementNumber" TEXT NOT NULL,
    "movementType" "InventoryMovementType" NOT NULL,
    "status" "InventoryMovementStatus" NOT NULL DEFAULT 'DRAFT',
    "quantity" DECIMAL(18,4) NOT NULL,
    "unitCost" DECIMAL(18,2),
    "currency" CHAR(3) NOT NULL DEFAULT 'INR',
    "referenceType" TEXT,
    "referenceNumber" TEXT,
    "occurredAt" TIMESTAMP(3),
    "postedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stock_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goods_receipt_notes" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "vendorId" TEXT,
    "grnNumber" TEXT NOT NULL,
    "poNumber" TEXT,
    "supplierName" TEXT NOT NULL,
    "status" "GrnStatus" NOT NULL DEFAULT 'DRAFT',
    "receivedAt" TIMESTAMP(3),
    "postedAt" TIMESTAMP(3),
    "itemCount" INTEGER NOT NULL DEFAULT 0,
    "totalQuantity" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "qualityStatus" TEXT,
    "ownerRole" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "goods_receipt_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dispatch_orders" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "customerId" TEXT,
    "dispatchNumber" TEXT NOT NULL,
    "orderNumber" TEXT,
    "customerName" TEXT NOT NULL,
    "status" "DispatchStatus" NOT NULL DEFAULT 'PLANNED',
    "plannedShipAt" TIMESTAMP(3),
    "dispatchedAt" TIMESTAMP(3),
    "itemCount" INTEGER NOT NULL DEFAULT 0,
    "totalQuantity" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "carrier" TEXT,
    "ownerRole" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dispatch_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bill_of_materials" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "outputItemId" TEXT NOT NULL,
    "bomNumber" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" "BomStatus" NOT NULL DEFAULT 'DRAFT',
    "yieldQuantity" DECIMAL(18,4) NOT NULL DEFAULT 1,
    "uom" TEXT NOT NULL DEFAULT 'EA',
    "effectiveFrom" TIMESTAMP(3),
    "effectiveTo" TIMESTAMP(3),
    "ownerRole" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bill_of_materials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bom_components" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "bomId" TEXT NOT NULL,
    "componentItemId" TEXT NOT NULL,
    "quantity" DECIMAL(18,4) NOT NULL,
    "scrapPercent" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "operationStep" TEXT NOT NULL DEFAULT 'assembly',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bom_components_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "production_plans" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "warehouseId" TEXT,
    "bomId" TEXT,
    "outputItemId" TEXT NOT NULL,
    "planNumber" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "ProductionPlanStatus" NOT NULL DEFAULT 'DRAFT',
    "plannedQuantity" DECIMAL(18,4) NOT NULL,
    "completedQuantity" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "uom" TEXT NOT NULL DEFAULT 'EA',
    "scheduledStart" TIMESTAMP(3),
    "scheduledEnd" TIMESTAMP(3),
    "actualStart" TIMESTAMP(3),
    "actualEnd" TIMESTAMP(3),
    "ownerRole" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "production_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quality_checks" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "warehouseId" TEXT,
    "itemId" TEXT,
    "productionPlanId" TEXT,
    "grnId" TEXT,
    "checkNumber" TEXT NOT NULL,
    "checkType" TEXT NOT NULL,
    "status" "QualityCheckStatus" NOT NULL DEFAULT 'PENDING',
    "sampleSize" DECIMAL(18,4),
    "defectCount" INTEGER NOT NULL DEFAULT 0,
    "inspectorRole" TEXT,
    "dueAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "notes" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quality_checks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_ai_alerts" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "sourceKey" TEXT NOT NULL,
    "alertType" "SupplyChainAlertType" NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" "OperationRiskSeverity" NOT NULL DEFAULT 'MEDIUM',
    "confidence" DECIMAL(5,2),
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "recommendedAction" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_ai_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "warehouses_org_status_deleted_idx" ON "warehouses"("organizationId", "status", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "warehouses_organizationId_code_key" ON "warehouses"("organizationId", "code");

-- CreateIndex
CREATE INDEX "inventory_items_org_type_status_idx" ON "inventory_items"("organizationId", "itemType", "status", "deletedAt");

-- CreateIndex
CREATE INDEX "inventory_items_organizationId_category_idx" ON "inventory_items"("organizationId", "category");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_items_organizationId_sku_key" ON "inventory_items"("organizationId", "sku");

-- CreateIndex
CREATE INDEX "stock_movements_org_wh_status_idx" ON "stock_movements"("organizationId", "warehouseId", "status", "occurredAt");

-- CreateIndex
CREATE INDEX "stock_movements_itemId_movementType_status_idx" ON "stock_movements"("itemId", "movementType", "status");

-- CreateIndex
CREATE UNIQUE INDEX "stock_movements_organizationId_movementNumber_key" ON "stock_movements"("organizationId", "movementNumber");

-- CreateIndex
CREATE INDEX "grns_org_status_received_idx" ON "goods_receipt_notes"("organizationId", "status", "receivedAt");

-- CreateIndex
CREATE INDEX "goods_receipt_notes_warehouseId_status_idx" ON "goods_receipt_notes"("warehouseId", "status");

-- CreateIndex
CREATE INDEX "goods_receipt_notes_vendorId_status_idx" ON "goods_receipt_notes"("vendorId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "goods_receipt_notes_organizationId_grnNumber_key" ON "goods_receipt_notes"("organizationId", "grnNumber");

-- CreateIndex
CREATE INDEX "dispatch_orders_org_status_ship_idx" ON "dispatch_orders"("organizationId", "status", "plannedShipAt");

-- CreateIndex
CREATE INDEX "dispatch_orders_warehouseId_status_idx" ON "dispatch_orders"("warehouseId", "status");

-- CreateIndex
CREATE INDEX "dispatch_orders_customerId_status_idx" ON "dispatch_orders"("customerId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "dispatch_orders_organizationId_dispatchNumber_key" ON "dispatch_orders"("organizationId", "dispatchNumber");

-- CreateIndex
CREATE INDEX "boms_org_status_version_idx" ON "bill_of_materials"("organizationId", "status", "version");

-- CreateIndex
CREATE INDEX "bill_of_materials_outputItemId_status_idx" ON "bill_of_materials"("outputItemId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "bill_of_materials_organizationId_bomNumber_key" ON "bill_of_materials"("organizationId", "bomNumber");

-- CreateIndex
CREATE INDEX "bom_components_organizationId_bomId_idx" ON "bom_components"("organizationId", "bomId");

-- CreateIndex
CREATE INDEX "bom_components_componentItemId_idx" ON "bom_components"("componentItemId");

-- CreateIndex
CREATE UNIQUE INDEX "bom_components_bomId_componentItemId_operationStep_key" ON "bom_components"("bomId", "componentItemId", "operationStep");

-- CreateIndex
CREATE INDEX "production_plans_org_status_start_idx" ON "production_plans"("organizationId", "status", "scheduledStart");

-- CreateIndex
CREATE INDEX "production_plans_warehouseId_status_idx" ON "production_plans"("warehouseId", "status");

-- CreateIndex
CREATE INDEX "production_plans_outputItemId_status_idx" ON "production_plans"("outputItemId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "production_plans_organizationId_planNumber_key" ON "production_plans"("organizationId", "planNumber");

-- CreateIndex
CREATE INDEX "quality_checks_org_status_due_idx" ON "quality_checks"("organizationId", "status", "dueAt");

-- CreateIndex
CREATE INDEX "quality_checks_productionPlanId_status_idx" ON "quality_checks"("productionPlanId", "status");

-- CreateIndex
CREATE INDEX "quality_checks_grnId_status_idx" ON "quality_checks"("grnId", "status");

-- CreateIndex
CREATE INDEX "quality_checks_itemId_status_idx" ON "quality_checks"("itemId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "quality_checks_organizationId_checkNumber_key" ON "quality_checks"("organizationId", "checkNumber");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_ai_alerts_organizationId_sourceKey_key" ON "inventory_ai_alerts"("organizationId", "sourceKey");

-- CreateIndex
CREATE INDEX "inventory_ai_alerts_org_type_severity_idx" ON "inventory_ai_alerts"("organizationId", "alertType", "severity", "status");

-- CreateIndex
CREATE INDEX "inventory_ai_alerts_org_entity_idx" ON "inventory_ai_alerts"("organizationId", "entityType", "entityId");

-- AddForeignKey
ALTER TABLE "warehouses" ADD CONSTRAINT "warehouses_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "warehouses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "inventory_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goods_receipt_notes" ADD CONSTRAINT "goods_receipt_notes_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goods_receipt_notes" ADD CONSTRAINT "goods_receipt_notes_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "warehouses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goods_receipt_notes" ADD CONSTRAINT "goods_receipt_notes_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispatch_orders" ADD CONSTRAINT "dispatch_orders_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispatch_orders" ADD CONSTRAINT "dispatch_orders_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "warehouses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispatch_orders" ADD CONSTRAINT "dispatch_orders_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bill_of_materials" ADD CONSTRAINT "bill_of_materials_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bill_of_materials" ADD CONSTRAINT "bill_of_materials_outputItemId_fkey" FOREIGN KEY ("outputItemId") REFERENCES "inventory_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bom_components" ADD CONSTRAINT "bom_components_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bom_components" ADD CONSTRAINT "bom_components_bomId_fkey" FOREIGN KEY ("bomId") REFERENCES "bill_of_materials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bom_components" ADD CONSTRAINT "bom_components_componentItemId_fkey" FOREIGN KEY ("componentItemId") REFERENCES "inventory_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_plans" ADD CONSTRAINT "production_plans_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_plans" ADD CONSTRAINT "production_plans_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "warehouses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_plans" ADD CONSTRAINT "production_plans_bomId_fkey" FOREIGN KEY ("bomId") REFERENCES "bill_of_materials"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_plans" ADD CONSTRAINT "production_plans_outputItemId_fkey" FOREIGN KEY ("outputItemId") REFERENCES "inventory_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quality_checks" ADD CONSTRAINT "quality_checks_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quality_checks" ADD CONSTRAINT "quality_checks_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "warehouses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quality_checks" ADD CONSTRAINT "quality_checks_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "inventory_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quality_checks" ADD CONSTRAINT "quality_checks_productionPlanId_fkey" FOREIGN KEY ("productionPlanId") REFERENCES "production_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quality_checks" ADD CONSTRAINT "quality_checks_grnId_fkey" FOREIGN KEY ("grnId") REFERENCES "goods_receipt_notes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_ai_alerts" ADD CONSTRAINT "inventory_ai_alerts_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
