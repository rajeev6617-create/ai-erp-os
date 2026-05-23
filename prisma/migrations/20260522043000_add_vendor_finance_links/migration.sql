-- Add first-class vendor records and optional finance links.
CREATE TABLE "vendors" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "legalName" TEXT,
    "vendorType" TEXT NOT NULL DEFAULT 'SUPPLIER',
    "gstin" VARCHAR(15),
    "pan" VARCHAR(10),
    "email" TEXT,
    "phone" VARCHAR(15),
    "paymentTermsDays" INTEGER NOT NULL DEFAULT 30,
    "address" JSONB,
    "bankDetails" JSONB,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "vendors_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "invoices" ADD COLUMN "vendorId" TEXT;
ALTER TABLE "payments" ADD COLUMN "vendorId" TEXT;
ALTER TABLE "expenses" ADD COLUMN "vendorId" TEXT;

CREATE UNIQUE INDEX "vendors_organizationId_code_key" ON "vendors"("organizationId", "code");
CREATE INDEX "vendors_organizationId_status_deletedAt_idx" ON "vendors"("organizationId", "status", "deletedAt");
CREATE INDEX "vendors_gstin_idx" ON "vendors"("gstin");
CREATE INDEX "invoices_vendorId_status_idx" ON "invoices"("vendorId", "status");
CREATE INDEX "payments_vendorId_status_idx" ON "payments"("vendorId", "status");
CREATE INDEX "expenses_vendorId_status_idx" ON "expenses"("vendorId", "status");

ALTER TABLE "vendors" ADD CONSTRAINT "vendors_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_vendorId_fkey"
  FOREIGN KEY ("vendorId") REFERENCES "vendors"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "payments" ADD CONSTRAINT "payments_vendorId_fkey"
  FOREIGN KEY ("vendorId") REFERENCES "vendors"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_vendorId_fkey"
  FOREIGN KEY ("vendorId") REFERENCES "vendors"("id") ON DELETE SET NULL ON UPDATE CASCADE;
