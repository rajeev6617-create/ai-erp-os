-- CreateEnum
CREATE TYPE "ExecutiveAudience" AS ENUM ('CEO', 'CFO', 'BOARD');

-- CreateEnum
CREATE TYPE "ExecutiveSignalStatus" AS ENUM ('OPEN', 'ACKNOWLEDGED', 'RESOLVED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "BoardMisStatus" AS ENUM ('DRAFT', 'READY', 'APPROVED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "executive_kpis" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "audience" "ExecutiveAudience" NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "value" DECIMAL(18,4),
    "valueText" TEXT,
    "unit" TEXT,
    "target" DECIMAL(18,4),
    "trend" TEXT NOT NULL DEFAULT 'neutral',
    "variancePercent" DECIMAL(8,2),
    "status" TEXT NOT NULL DEFAULT 'ON_TRACK',
    "period" TEXT NOT NULL,
    "ownerRole" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "executive_kpis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "executive_forecasts" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "audience" "ExecutiveAudience" NOT NULL,
    "forecastNumber" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "horizon" TEXT NOT NULL,
    "baselineValue" DECIMAL(18,4) NOT NULL,
    "predictedValue" DECIMAL(18,4) NOT NULL,
    "confidence" DECIMAL(5,2),
    "scenario" TEXT NOT NULL,
    "driverSummary" TEXT NOT NULL,
    "riskLevel" "OperationRiskSeverity" NOT NULL DEFAULT 'MEDIUM',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "executive_forecasts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "executive_anomalies" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "audience" "ExecutiveAudience" NOT NULL,
    "sourceKey" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" "OperationRiskSeverity" NOT NULL DEFAULT 'MEDIUM',
    "metric" TEXT NOT NULL,
    "actualValue" DECIMAL(18,4),
    "expectedValue" DECIMAL(18,4),
    "variancePercent" DECIMAL(8,2),
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "ExecutiveSignalStatus" NOT NULL DEFAULT 'OPEN',
    "recommendedAction" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "executive_anomalies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "executive_copilots" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "audience" "ExecutiveAudience" NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "recommendedActions" JSONB,
    "status" "ExecutiveSignalStatus" NOT NULL DEFAULT 'OPEN',
    "confidence" DECIMAL(5,2),
    "lastRunAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "executive_copilots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "executive_strategic_insights" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "audience" "ExecutiveAudience" NOT NULL,
    "sourceKey" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "narrative" TEXT NOT NULL,
    "impactArea" TEXT NOT NULL,
    "priority" "OperationRiskSeverity" NOT NULL DEFAULT 'MEDIUM',
    "confidence" DECIMAL(5,2),
    "decisionWindow" TEXT,
    "recommendedAction" TEXT,
    "status" "ExecutiveSignalStatus" NOT NULL DEFAULT 'OPEN',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "executive_strategic_insights_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "board_mis_snapshots" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "packNumber" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" "BoardMisStatus" NOT NULL DEFAULT 'DRAFT',
    "revenue" DECIMAL(18,2) NOT NULL,
    "ebitda" DECIMAL(18,2) NOT NULL,
    "cashRunwayMonths" DECIMAL(8,2),
    "riskIndex" INTEGER NOT NULL DEFAULT 0,
    "kpiSummary" JSONB,
    "governanceSummary" TEXT NOT NULL,
    "createdByRole" TEXT,
    "approvedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "board_mis_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "executive_kpis_org_audience_sort_idx" ON "executive_kpis"("organizationId", "audience", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "executive_kpis_organizationId_audience_code_period_key" ON "executive_kpis"("organizationId", "audience", "code", "period");

-- CreateIndex
CREATE INDEX "executive_forecasts_org_audience_risk_idx" ON "executive_forecasts"("organizationId", "audience", "riskLevel");

-- CreateIndex
CREATE UNIQUE INDEX "executive_forecasts_organizationId_forecastNumber_key" ON "executive_forecasts"("organizationId", "forecastNumber");

-- CreateIndex
CREATE INDEX "executive_anomalies_org_audience_severity_idx" ON "executive_anomalies"("organizationId", "audience", "severity", "status");

-- CreateIndex
CREATE UNIQUE INDEX "executive_anomalies_organizationId_sourceKey_key" ON "executive_anomalies"("organizationId", "sourceKey");

-- CreateIndex
CREATE INDEX "executive_copilots_org_audience_status_idx" ON "executive_copilots"("organizationId", "audience", "status");

-- CreateIndex
CREATE UNIQUE INDEX "executive_copilots_organizationId_audience_slug_key" ON "executive_copilots"("organizationId", "audience", "slug");

-- CreateIndex
CREATE INDEX "exec_insights_org_audience_priority_idx" ON "executive_strategic_insights"("organizationId", "audience", "priority", "status");

-- CreateIndex
CREATE UNIQUE INDEX "executive_strategic_insights_organizationId_sourceKey_key" ON "executive_strategic_insights"("organizationId", "sourceKey");

-- CreateIndex
CREATE INDEX "board_mis_org_period_status_idx" ON "board_mis_snapshots"("organizationId", "period", "status");

-- CreateIndex
CREATE UNIQUE INDEX "board_mis_snapshots_organizationId_packNumber_key" ON "board_mis_snapshots"("organizationId", "packNumber");

-- AddForeignKey
ALTER TABLE "executive_kpis" ADD CONSTRAINT "executive_kpis_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "executive_forecasts" ADD CONSTRAINT "executive_forecasts_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "executive_anomalies" ADD CONSTRAINT "executive_anomalies_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "executive_copilots" ADD CONSTRAINT "executive_copilots_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "executive_strategic_insights" ADD CONSTRAINT "executive_strategic_insights_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "board_mis_snapshots" ADD CONSTRAINT "board_mis_snapshots_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
