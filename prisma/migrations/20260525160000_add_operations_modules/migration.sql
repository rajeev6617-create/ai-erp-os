-- First-class enterprise operations modules for P2P, OTC, R2R, and user operations.
CREATE TYPE "OperationModuleCode" AS ENUM ('P2P', 'OTC', 'R2R', 'USER_OPERATIONS');
CREATE TYPE "OperationStageStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'WAITING_APPROVAL', 'BLOCKED', 'COMPLETED');
CREATE TYPE "OperationRecordStatus" AS ENUM ('OPEN', 'WAITING_APPROVAL', 'APPROVED', 'BLOCKED', 'COMPLETED', 'EXCEPTION');
CREATE TYPE "OperationRiskSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

CREATE TABLE "operation_modules" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "code" "OperationModuleCode" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "ownerRole" TEXT,
    "financeCategory" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "operation_modules_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "operation_workflow_stages" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "stageKey" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sequence" INTEGER NOT NULL,
    "status" "OperationStageStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "slaHours" INTEGER,
    "automationLevel" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "operation_workflow_stages_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "operation_records" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "stageId" TEXT,
    "reference" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "OperationRecordStatus" NOT NULL DEFAULT 'OPEN',
    "amount" DECIMAL(18,2),
    "currency" CHAR(3) NOT NULL DEFAULT 'INR',
    "counterparty" TEXT,
    "ownerRole" TEXT,
    "dueAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "riskScore" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "operation_records_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "operation_approval_flows" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "trigger" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "approverRole" TEXT NOT NULL,
    "approvalType" "ApprovalType" NOT NULL DEFAULT 'SEQUENTIAL',
    "thresholdAmount" DECIMAL(18,2),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "operation_approval_flows_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "operation_risk_alerts" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "recordId" TEXT,
    "sourceKey" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" "OperationRiskSeverity" NOT NULL DEFAULT 'MEDIUM',
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "signalType" TEXT NOT NULL,
    "confidence" DECIMAL(5,2),
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "operation_risk_alerts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "operation_finance_impacts" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "recordId" TEXT,
    "sourceKey" TEXT NOT NULL,
    "impactType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "currency" CHAR(3) NOT NULL DEFAULT 'INR',
    "direction" TEXT NOT NULL,
    "period" TEXT,
    "recognizedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "operation_finance_impacts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "operation_audit_events" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "recordId" TEXT,
    "sourceKey" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actor" TEXT,
    "severity" "AuditSeverity" NOT NULL DEFAULT 'INFO',
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "operation_audit_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "operation_modules_organizationId_code_key"
  ON "operation_modules"("organizationId", "code");
CREATE INDEX "operation_modules_organizationId_deletedAt_idx"
  ON "operation_modules"("organizationId", "deletedAt");

CREATE UNIQUE INDEX "operation_workflow_stages_moduleId_stageKey_key"
  ON "operation_workflow_stages"("moduleId", "stageKey");
CREATE INDEX "operation_workflow_stages_organizationId_moduleId_sequence_idx"
  ON "operation_workflow_stages"("organizationId", "moduleId", "sequence");
CREATE INDEX "operation_workflow_stages_organizationId_status_idx"
  ON "operation_workflow_stages"("organizationId", "status");

CREATE UNIQUE INDEX "operation_records_organizationId_reference_key"
  ON "operation_records"("organizationId", "reference");
CREATE INDEX "operation_records_organizationId_moduleId_status_dueAt_idx"
  ON "operation_records"("organizationId", "moduleId", "status", "dueAt");
CREATE INDEX "operation_records_stageId_status_idx"
  ON "operation_records"("stageId", "status");

CREATE UNIQUE INDEX "operation_approval_flows_moduleId_sequence_key"
  ON "operation_approval_flows"("moduleId", "sequence");
CREATE UNIQUE INDEX "operation_approval_flows_moduleId_name_key"
  ON "operation_approval_flows"("moduleId", "name");
CREATE INDEX "operation_approval_flows_organizationId_moduleId_isActive_idx"
  ON "operation_approval_flows"("organizationId", "moduleId", "isActive");

CREATE UNIQUE INDEX "operation_risk_alerts_organizationId_sourceKey_key"
  ON "operation_risk_alerts"("organizationId", "sourceKey");
CREATE INDEX "operation_risk_alerts_organizationId_moduleId_severity_status_idx"
  ON "operation_risk_alerts"("organizationId", "moduleId", "severity", "status");
CREATE INDEX "operation_risk_alerts_recordId_status_idx"
  ON "operation_risk_alerts"("recordId", "status");

CREATE UNIQUE INDEX "operation_finance_impacts_organizationId_sourceKey_key"
  ON "operation_finance_impacts"("organizationId", "sourceKey");
CREATE INDEX "operation_finance_impacts_organizationId_moduleId_impactType_idx"
  ON "operation_finance_impacts"("organizationId", "moduleId", "impactType");
CREATE INDEX "operation_finance_impacts_recordId_idx"
  ON "operation_finance_impacts"("recordId");

CREATE UNIQUE INDEX "operation_audit_events_organizationId_sourceKey_key"
  ON "operation_audit_events"("organizationId", "sourceKey");
CREATE INDEX "operation_audit_events_organizationId_moduleId_createdAt_idx"
  ON "operation_audit_events"("organizationId", "moduleId", "createdAt");
CREATE INDEX "operation_audit_events_recordId_createdAt_idx"
  ON "operation_audit_events"("recordId", "createdAt");

ALTER TABLE "operation_modules" ADD CONSTRAINT "operation_modules_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "operation_workflow_stages" ADD CONSTRAINT "operation_workflow_stages_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "operation_workflow_stages" ADD CONSTRAINT "operation_workflow_stages_moduleId_fkey"
  FOREIGN KEY ("moduleId") REFERENCES "operation_modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "operation_records" ADD CONSTRAINT "operation_records_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "operation_records" ADD CONSTRAINT "operation_records_moduleId_fkey"
  FOREIGN KEY ("moduleId") REFERENCES "operation_modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "operation_records" ADD CONSTRAINT "operation_records_stageId_fkey"
  FOREIGN KEY ("stageId") REFERENCES "operation_workflow_stages"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "operation_approval_flows" ADD CONSTRAINT "operation_approval_flows_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "operation_approval_flows" ADD CONSTRAINT "operation_approval_flows_moduleId_fkey"
  FOREIGN KEY ("moduleId") REFERENCES "operation_modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "operation_risk_alerts" ADD CONSTRAINT "operation_risk_alerts_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "operation_risk_alerts" ADD CONSTRAINT "operation_risk_alerts_moduleId_fkey"
  FOREIGN KEY ("moduleId") REFERENCES "operation_modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "operation_risk_alerts" ADD CONSTRAINT "operation_risk_alerts_recordId_fkey"
  FOREIGN KEY ("recordId") REFERENCES "operation_records"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "operation_finance_impacts" ADD CONSTRAINT "operation_finance_impacts_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "operation_finance_impacts" ADD CONSTRAINT "operation_finance_impacts_moduleId_fkey"
  FOREIGN KEY ("moduleId") REFERENCES "operation_modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "operation_finance_impacts" ADD CONSTRAINT "operation_finance_impacts_recordId_fkey"
  FOREIGN KEY ("recordId") REFERENCES "operation_records"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "operation_audit_events" ADD CONSTRAINT "operation_audit_events_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "operation_audit_events" ADD CONSTRAINT "operation_audit_events_moduleId_fkey"
  FOREIGN KEY ("moduleId") REFERENCES "operation_modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "operation_audit_events" ADD CONSTRAINT "operation_audit_events_recordId_fkey"
  FOREIGN KEY ("recordId") REFERENCES "operation_records"("id") ON DELETE SET NULL ON UPDATE CASCADE;
