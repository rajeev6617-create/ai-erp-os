-- CreateEnum
CREATE TYPE "DepartmentType" AS ENUM ('FINANCE', 'PURCHASE', 'SALES', 'STORES', 'PRODUCTION', 'QUALITY', 'HR', 'ADMIN', 'IT', 'MANAGEMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "DepartmentStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- AlterTable
-- Add company ownership as nullable first so existing department records can be
-- attached to their organization's active legal entity without data loss.
ALTER TABLE "departments"
ADD COLUMN "companyId" TEXT,
ADD COLUMN "departmentHeadUserId" TEXT,
ADD COLUMN "departmentType" "DepartmentType" NOT NULL DEFAULT 'OTHER',
ADD COLUMN "locationId" TEXT,
ADD COLUMN "status" "DepartmentStatus" NOT NULL DEFAULT 'ACTIVE',
ALTER COLUMN "code" SET DATA TYPE VARCHAR(30);

UPDATE "departments" AS department
SET "companyId" = (
  SELECT company."id"
  FROM "companies" AS company
  WHERE company."organizationId" = department."organizationId"
  ORDER BY
    CASE
      WHEN company."status" = 'ACTIVE' AND company."deletedAt" IS NULL THEN 0
      ELSE 1
    END,
    company."createdAt" ASC
  LIMIT 1
);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "departments" WHERE "companyId" IS NULL) THEN
    RAISE EXCEPTION 'Cannot add required department company ownership: an organization has departments but no company';
  END IF;
END $$;

ALTER TABLE "departments"
ALTER COLUMN "companyId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "departments_organizationId_companyId_status_deletedAt_idx" ON "departments"("organizationId", "companyId", "status", "deletedAt");

-- CreateIndex
CREATE INDEX "departments_organizationId_locationId_status_idx" ON "departments"("organizationId", "locationId", "status");

-- CreateIndex
CREATE INDEX "departments_organizationId_departmentType_idx" ON "departments"("organizationId", "departmentType");

-- CreateIndex
CREATE INDEX "departments_departmentHeadUserId_idx" ON "departments"("departmentHeadUserId");

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "departments_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "departments_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "departments_departmentHeadUserId_fkey" FOREIGN KEY ("departmentHeadUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
