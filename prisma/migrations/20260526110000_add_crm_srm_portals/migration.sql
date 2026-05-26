-- ASTRA CRM, SRM, and external portal foundation.

CREATE TYPE "PortalAccountType" AS ENUM ('CUSTOMER', 'VENDOR');
CREATE TYPE "PortalAccountStatus" AS ENUM ('INVITED', 'ACTIVE', 'SUSPENDED', 'DISABLED');
CREATE TYPE "CrmLeadStatus" AS ENUM ('NEW', 'QUALIFIED', 'NURTURING', 'CONVERTED', 'LOST');
CREATE TYPE "SalesOpportunityStage" AS ENUM ('DISCOVERY', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST');
CREATE TYPE "VendorOnboardingStatus" AS ENUM ('INVITED', 'DOCUMENTS_PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED');
CREATE TYPE "SupportTicketStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'WAITING_ON_CUSTOMER', 'RESOLVED', 'CLOSED');
CREATE TYPE "SupportTicketPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "legalName" TEXT,
    "industry" TEXT,
    "segment" TEXT,
    "gstin" VARCHAR(15),
    "pan" VARCHAR(10),
    "email" TEXT,
    "phone" VARCHAR(15),
    "billingAddress" JSONB,
    "shippingAddress" JSONB,
    "creditLimit" DECIMAL(18,2),
    "outstandingAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "portal_accounts" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "accountType" "PortalAccountType" NOT NULL,
    "customerId" TEXT,
    "vendorId" TEXT,
    "email" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "status" "PortalAccountStatus" NOT NULL DEFAULT 'INVITED',
    "lastLoginAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "portal_accounts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "portal_sessions" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "portalAccountId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "ipAddress" VARCHAR(45),
    "userAgent" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "portal_sessions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "crm_leads" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "customerId" TEXT,
    "leadNumber" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "contactName" TEXT,
    "email" TEXT,
    "phone" VARCHAR(15),
    "source" TEXT NOT NULL,
    "status" "CrmLeadStatus" NOT NULL DEFAULT 'NEW',
    "score" INTEGER NOT NULL DEFAULT 0,
    "estimatedValue" DECIMAL(18,2),
    "ownerRole" TEXT,
    "nextAction" TEXT,
    "dueAt" TIMESTAMP(3),
    "convertedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crm_leads_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "sales_opportunities" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "opportunityNumber" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "stage" "SalesOpportunityStage" NOT NULL DEFAULT 'DISCOVERY',
    "amount" DECIMAL(18,2) NOT NULL,
    "probability" INTEGER NOT NULL DEFAULT 0,
    "expectedCloseAt" TIMESTAMP(3),
    "ownerRole" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sales_opportunities_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "vendor_onboardings" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "vendorId" TEXT,
    "onboardingNumber" TEXT NOT NULL,
    "supplierName" TEXT NOT NULL,
    "contactName" TEXT,
    "email" TEXT,
    "status" "VendorOnboardingStatus" NOT NULL DEFAULT 'INVITED',
    "riskScore" INTEGER NOT NULL DEFAULT 0,
    "currentStep" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vendor_onboardings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "support_tickets" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "customerId" TEXT,
    "vendorId" TEXT,
    "ticketNumber" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "description" TEXT,
    "status" "SupportTicketStatus" NOT NULL DEFAULT 'OPEN',
    "priority" "SupportTicketPriority" NOT NULL DEFAULT 'MEDIUM',
    "channel" TEXT NOT NULL DEFAULT 'PORTAL',
    "ownerRole" TEXT,
    "dueAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "support_tickets_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "relationship_ai_insights" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" "OperationRiskSeverity" NOT NULL DEFAULT 'MEDIUM',
    "confidence" DECIMAL(5,2),
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "relationship_ai_insights_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "customers_organizationId_code_key" ON "customers"("organizationId", "code");
CREATE INDEX "customers_org_status_deleted_idx" ON "customers"("organizationId", "status", "deletedAt");
CREATE INDEX "customers_gstin_idx" ON "customers"("gstin");

CREATE UNIQUE INDEX "portal_accounts_organizationId_email_key" ON "portal_accounts"("organizationId", "email");
CREATE INDEX "portal_accounts_org_type_status_idx" ON "portal_accounts"("organizationId", "accountType", "status", "deletedAt");
CREATE INDEX "portal_accounts_customerId_idx" ON "portal_accounts"("customerId");
CREATE INDEX "portal_accounts_vendorId_idx" ON "portal_accounts"("vendorId");

CREATE UNIQUE INDEX "portal_sessions_tokenHash_key" ON "portal_sessions"("tokenHash");
CREATE INDEX "portal_sessions_organizationId_portalAccountId_idx" ON "portal_sessions"("organizationId", "portalAccountId");
CREATE INDEX "portal_sessions_portalAccountId_expiresAt_idx" ON "portal_sessions"("portalAccountId", "expiresAt");

CREATE UNIQUE INDEX "crm_leads_organizationId_leadNumber_key" ON "crm_leads"("organizationId", "leadNumber");
CREATE INDEX "crm_leads_org_status_score_idx" ON "crm_leads"("organizationId", "status", "score");
CREATE INDEX "crm_leads_customerId_idx" ON "crm_leads"("customerId");

CREATE UNIQUE INDEX "sales_opportunities_organizationId_opportunityNumber_key" ON "sales_opportunities"("organizationId", "opportunityNumber");
CREATE INDEX "sales_opps_org_stage_close_idx" ON "sales_opportunities"("organizationId", "stage", "expectedCloseAt");
CREATE INDEX "sales_opportunities_customerId_stage_idx" ON "sales_opportunities"("customerId", "stage");

CREATE UNIQUE INDEX "vendor_onboardings_organizationId_onboardingNumber_key" ON "vendor_onboardings"("organizationId", "onboardingNumber");
CREATE INDEX "vendor_onboarding_org_status_risk_idx" ON "vendor_onboardings"("organizationId", "status", "riskScore");
CREATE INDEX "vendor_onboardings_vendorId_status_idx" ON "vendor_onboardings"("vendorId", "status");

CREATE UNIQUE INDEX "support_tickets_organizationId_ticketNumber_key" ON "support_tickets"("organizationId", "ticketNumber");
CREATE INDEX "support_tickets_org_status_priority_idx" ON "support_tickets"("organizationId", "status", "priority");
CREATE INDEX "support_tickets_customerId_status_idx" ON "support_tickets"("customerId", "status");
CREATE INDEX "support_tickets_vendorId_status_idx" ON "support_tickets"("vendorId", "status");

CREATE INDEX "relationship_ai_org_module_severity_idx" ON "relationship_ai_insights"("organizationId", "module", "severity", "status");
CREATE INDEX "relationship_ai_org_entity_idx" ON "relationship_ai_insights"("organizationId", "entityType", "entityId");

ALTER TABLE "customers" ADD CONSTRAINT "customers_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "portal_accounts" ADD CONSTRAINT "portal_accounts_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "portal_accounts" ADD CONSTRAINT "portal_accounts_customerId_fkey"
  FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "portal_accounts" ADD CONSTRAINT "portal_accounts_vendorId_fkey"
  FOREIGN KEY ("vendorId") REFERENCES "vendors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "portal_sessions" ADD CONSTRAINT "portal_sessions_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "portal_sessions" ADD CONSTRAINT "portal_sessions_portalAccountId_fkey"
  FOREIGN KEY ("portalAccountId") REFERENCES "portal_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "crm_leads" ADD CONSTRAINT "crm_leads_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "crm_leads" ADD CONSTRAINT "crm_leads_customerId_fkey"
  FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "sales_opportunities" ADD CONSTRAINT "sales_opportunities_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sales_opportunities" ADD CONSTRAINT "sales_opportunities_customerId_fkey"
  FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "vendor_onboardings" ADD CONSTRAINT "vendor_onboardings_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "vendor_onboardings" ADD CONSTRAINT "vendor_onboardings_vendorId_fkey"
  FOREIGN KEY ("vendorId") REFERENCES "vendors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_customerId_fkey"
  FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_vendorId_fkey"
  FOREIGN KEY ("vendorId") REFERENCES "vendors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "relationship_ai_insights" ADD CONSTRAINT "relationship_ai_insights_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
