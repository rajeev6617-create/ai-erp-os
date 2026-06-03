-- CreateEnum
CREATE TYPE "CostCenterType" AS ENUM ('ADMIN', 'FINANCE', 'PURCHASE', 'SALES', 'PRODUCTION', 'QUALITY', 'MAINTENANCE', 'HR', 'IT', 'OTHER');

-- CreateEnum
CREATE TYPE "ControllingCenterStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateTable
CREATE TABLE "cost_centers" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "locationId" TEXT,
    "departmentId" TEXT,
    "costCenterCode" VARCHAR(30) NOT NULL,
    "costCenterName" TEXT NOT NULL,
    "costCenterType" "CostCenterType" NOT NULL,
    "responsibleUserId" TEXT,
    "validFrom" DATE NOT NULL,
    "validTo" DATE,
    "status" "ControllingCenterStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "cost_centers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profit_centers" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "locationId" TEXT,
    "profitCenterCode" VARCHAR(30) NOT NULL,
    "profitCenterName" TEXT NOT NULL,
    "businessSegment" TEXT,
    "responsibleUserId" TEXT,
    "validFrom" DATE NOT NULL,
    "validTo" DATE,
    "status" "ControllingCenterStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "profit_centers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "cost_centers_organizationId_companyId_status_deletedAt_idx" ON "cost_centers"("organizationId", "companyId", "status", "deletedAt");

-- CreateIndex
CREATE INDEX "cost_centers_organizationId_locationId_status_idx" ON "cost_centers"("organizationId", "locationId", "status");

-- CreateIndex
CREATE INDEX "cost_centers_organizationId_departmentId_status_idx" ON "cost_centers"("organizationId", "departmentId", "status");

-- CreateIndex
CREATE INDEX "cost_centers_responsibleUserId_idx" ON "cost_centers"("responsibleUserId");

-- CreateIndex
CREATE INDEX "cost_centers_organizationId_validFrom_validTo_idx" ON "cost_centers"("organizationId", "validFrom", "validTo");

-- CreateIndex
CREATE UNIQUE INDEX "cost_centers_organizationId_costCenterCode_key" ON "cost_centers"("organizationId", "costCenterCode");

-- CreateIndex
CREATE INDEX "profit_centers_organizationId_companyId_status_deletedAt_idx" ON "profit_centers"("organizationId", "companyId", "status", "deletedAt");

-- CreateIndex
CREATE INDEX "profit_centers_organizationId_locationId_status_idx" ON "profit_centers"("organizationId", "locationId", "status");

-- CreateIndex
CREATE INDEX "profit_centers_responsibleUserId_idx" ON "profit_centers"("responsibleUserId");

-- CreateIndex
CREATE INDEX "profit_centers_organizationId_validFrom_validTo_idx" ON "profit_centers"("organizationId", "validFrom", "validTo");

-- CreateIndex
CREATE UNIQUE INDEX "profit_centers_organizationId_profitCenterCode_key" ON "profit_centers"("organizationId", "profitCenterCode");

-- AddForeignKey
ALTER TABLE "cost_centers" ADD CONSTRAINT "cost_centers_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cost_centers" ADD CONSTRAINT "cost_centers_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cost_centers" ADD CONSTRAINT "cost_centers_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cost_centers" ADD CONSTRAINT "cost_centers_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cost_centers" ADD CONSTRAINT "cost_centers_responsibleUserId_fkey" FOREIGN KEY ("responsibleUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profit_centers" ADD CONSTRAINT "profit_centers_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profit_centers" ADD CONSTRAINT "profit_centers_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profit_centers" ADD CONSTRAINT "profit_centers_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profit_centers" ADD CONSTRAINT "profit_centers_responsibleUserId_fkey" FOREIGN KEY ("responsibleUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
