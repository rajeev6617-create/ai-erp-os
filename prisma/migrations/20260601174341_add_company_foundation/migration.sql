-- CreateEnum
CREATE TYPE "CompanyStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateTable
CREATE TABLE "companies" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "companyCode" VARCHAR(20) NOT NULL,
    "companyName" TEXT NOT NULL,
    "legalName" TEXT NOT NULL,
    "cin" VARCHAR(21),
    "gstin" VARCHAR(15),
    "pan" VARCHAR(10),
    "registeredAddress" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "currency" CHAR(3) NOT NULL,
    "fiscalYearStart" TIMESTAMP(3) NOT NULL,
    "fiscalYearEnd" TIMESTAMP(3) NOT NULL,
    "status" "CompanyStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "companies_organizationId_status_deletedAt_idx" ON "companies"("organizationId", "status", "deletedAt");

-- CreateIndex
CREATE INDEX "companies_organizationId_companyName_idx" ON "companies"("organizationId", "companyName");

-- CreateIndex
CREATE INDEX "companies_organizationId_gstin_idx" ON "companies"("organizationId", "gstin");

-- CreateIndex
CREATE INDEX "companies_organizationId_pan_idx" ON "companies"("organizationId", "pan");

-- CreateIndex
CREATE UNIQUE INDEX "companies_organizationId_companyCode_key" ON "companies"("organizationId", "companyCode");

-- AddForeignKey
ALTER TABLE "companies" ADD CONSTRAINT "companies_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
