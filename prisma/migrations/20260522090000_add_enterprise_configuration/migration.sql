-- Tenant-safe enterprise configuration and customization storage.
CREATE TABLE "organization_configurations" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "configKey" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "schema" JSONB,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isEncrypted" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT,
    "updatedById" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organization_configurations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "workflow_configurations" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "name" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workflow_configurations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "workflow_sla_policies" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "workflowId" TEXT,
    "entityType" TEXT,
    "priority" TEXT,
    "targetMinutes" INTEGER NOT NULL,
    "escalationMinutes" INTEGER NOT NULL,
    "breachActions" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "workflow_sla_policies_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "finance_rules" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ruleType" TEXT NOT NULL,
    "description" TEXT,
    "thresholdAmount" DECIMAL(18,2),
    "conditions" JSONB NOT NULL,
    "actions" JSONB NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 100,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "finance_rules_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "custom_field_definitions" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "fieldKey" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "fieldType" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "options" JSONB,
    "validation" JSONB,
    "defaultValue" JSONB,
    "displayOrder" INTEGER NOT NULL DEFAULT 100,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "custom_field_definitions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "organization_configurations_organizationId_category_configKey_key"
  ON "organization_configurations"("organizationId", "category", "configKey");
CREATE INDEX "organization_configurations_organizationId_category_idx"
  ON "organization_configurations"("organizationId", "category");
CREATE INDEX "organization_configurations_updatedById_updatedAt_idx"
  ON "organization_configurations"("updatedById", "updatedAt");

CREATE UNIQUE INDEX "workflow_configurations_workflowId_version_key"
  ON "workflow_configurations"("workflowId", "version");
CREATE INDEX "workflow_configurations_organizationId_workflowId_isActive_idx"
  ON "workflow_configurations"("organizationId", "workflowId", "isActive");

CREATE INDEX "workflow_sla_policies_organizationId_isActive_deletedAt_idx"
  ON "workflow_sla_policies"("organizationId", "isActive", "deletedAt");
CREATE INDEX "workflow_sla_policies_workflowId_isActive_idx"
  ON "workflow_sla_policies"("workflowId", "isActive");

CREATE UNIQUE INDEX "finance_rules_organizationId_ruleType_name_key"
  ON "finance_rules"("organizationId", "ruleType", "name");
CREATE INDEX "finance_rules_organizationId_ruleType_isActive_deletedAt_idx"
  ON "finance_rules"("organizationId", "ruleType", "isActive", "deletedAt");

CREATE UNIQUE INDEX "custom_field_definitions_organizationId_entityType_fieldKey_key"
  ON "custom_field_definitions"("organizationId", "entityType", "fieldKey");
CREATE INDEX "custom_field_definitions_organizationId_entityType_isActive_deletedAt_idx"
  ON "custom_field_definitions"("organizationId", "entityType", "isActive", "deletedAt");

ALTER TABLE "organization_configurations" ADD CONSTRAINT "organization_configurations_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "workflow_configurations" ADD CONSTRAINT "workflow_configurations_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "workflow_configurations" ADD CONSTRAINT "workflow_configurations_workflowId_fkey"
  FOREIGN KEY ("workflowId") REFERENCES "workflows"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "workflow_sla_policies" ADD CONSTRAINT "workflow_sla_policies_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "workflow_sla_policies" ADD CONSTRAINT "workflow_sla_policies_workflowId_fkey"
  FOREIGN KEY ("workflowId") REFERENCES "workflows"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "finance_rules" ADD CONSTRAINT "finance_rules_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "custom_field_definitions" ADD CONSTRAINT "custom_field_definitions_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
