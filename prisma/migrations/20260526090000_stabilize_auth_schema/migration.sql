-- Align auth schema with production runtime expectations while preserving legacy sessions.

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'MfaFactorType'
    ) THEN
        CREATE TYPE "MfaFactorType" AS ENUM ('TOTP', 'SMS', 'EMAIL', 'WEBAUTHN');
    END IF;
END
$$;

CREATE TABLE IF NOT EXISTS "user_mfa_factors" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "MfaFactorType" NOT NULL,
    "label" TEXT,
    "secretVaultRef" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "lastUsedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "user_mfa_factors_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "user_mfa_factors_userId_deletedAt_idx"
    ON "user_mfa_factors"("userId", "deletedAt");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'user_mfa_factors_userId_fkey'
    ) THEN
        ALTER TABLE "user_mfa_factors"
            ADD CONSTRAINT "user_mfa_factors_userId_fkey"
            FOREIGN KEY ("userId") REFERENCES "users"("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END
$$;

ALTER TABLE "user_sessions"
    ADD COLUMN IF NOT EXISTS "tokenHash" TEXT;

ALTER TABLE "user_sessions"
    ALTER COLUMN "tokenHash" DROP NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "user_sessions_tokenHash_key"
    ON "user_sessions"("tokenHash");

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_class WHERE relname = 'organization_configurations_organizationId_category_configK_key'
    ) AND NOT EXISTS (
        SELECT 1 FROM pg_class WHERE relname = 'org_configs_org_category_key_uniq'
    ) THEN
        ALTER INDEX "organization_configurations_organizationId_category_configK_key"
            RENAME TO "org_configs_org_category_key_uniq";
    END IF;

    IF EXISTS (
        SELECT 1 FROM pg_class WHERE relname = 'custom_field_definitions_organizationId_entityType_isActive_del'
    ) AND NOT EXISTS (
        SELECT 1 FROM pg_class WHERE relname = 'custom_fields_org_entity_active_deleted_idx'
    ) THEN
        ALTER INDEX "custom_field_definitions_organizationId_entityType_isActive_del"
            RENAME TO "custom_fields_org_entity_active_deleted_idx";
    END IF;

    IF EXISTS (
        SELECT 1 FROM pg_class WHERE relname = 'operation_risk_alerts_organizationId_moduleId_severity_stat_idx'
    ) AND NOT EXISTS (
        SELECT 1 FROM pg_class WHERE relname = 'op_risk_alerts_org_module_severity_status_idx'
    ) THEN
        ALTER INDEX "operation_risk_alerts_organizationId_moduleId_severity_stat_idx"
            RENAME TO "op_risk_alerts_org_module_severity_status_idx";
    END IF;

    IF EXISTS (
        SELECT 1 FROM pg_class WHERE relname = 'operation_finance_impacts_organizationId_moduleId_impactTyp_idx'
    ) AND NOT EXISTS (
        SELECT 1 FROM pg_class WHERE relname = 'op_finance_impacts_org_module_type_idx'
    ) THEN
        ALTER INDEX "operation_finance_impacts_organizationId_moduleId_impactTyp_idx"
            RENAME TO "op_finance_impacts_org_module_type_idx";
    END IF;
END
$$;
