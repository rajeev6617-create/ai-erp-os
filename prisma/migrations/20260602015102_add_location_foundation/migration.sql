-- CreateEnum
CREATE TYPE "LocationType" AS ENUM ('PLANT', 'BRANCH', 'OFFICE', 'WAREHOUSE', 'DEPOT');

-- CreateEnum
CREATE TYPE "LocationStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateTable
CREATE TABLE "locations" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "locationCode" VARCHAR(30) NOT NULL,
    "locationName" TEXT NOT NULL,
    "locationType" "LocationType" NOT NULL,
    "gstRegistrationNumber" VARCHAR(15),
    "address" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "pincode" VARCHAR(20) NOT NULL,
    "contactPerson" TEXT,
    "contactEmail" TEXT,
    "contactPhone" VARCHAR(30),
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "status" "LocationStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "locations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "locations_organizationId_status_deletedAt_idx" ON "locations"("organizationId", "status", "deletedAt");

-- CreateIndex
CREATE INDEX "locations_organizationId_companyId_status_idx" ON "locations"("organizationId", "companyId", "status");

-- CreateIndex
CREATE INDEX "locations_organizationId_locationType_idx" ON "locations"("organizationId", "locationType");

-- CreateIndex
CREATE INDEX "locations_organizationId_city_idx" ON "locations"("organizationId", "city");

-- CreateIndex
CREATE INDEX "locations_organizationId_gstRegistrationNumber_idx" ON "locations"("organizationId", "gstRegistrationNumber");

-- CreateIndex
CREATE UNIQUE INDEX "locations_organizationId_locationCode_key" ON "locations"("organizationId", "locationCode");

-- AddForeignKey
ALTER TABLE "locations" ADD CONSTRAINT "locations_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "locations" ADD CONSTRAINT "locations_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
