import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import {
  CompanyStatus,
  ControllingCenterStatus,
  CostCenterType,
  DepartmentStatus,
  DepartmentType,
  LocationStatus,
  LocationType,
  MemberRole,
  PrismaClient,
  TenantStatus,
  UserStatus,
} from "../app/generated/prisma/client";
import { ROLE_ORG_ADMIN } from "../lib/auth/constants";
import { seedComplianceData } from "./seed-compliance";
import { seedConfigurationData } from "./seed-configuration";
import { seedDocumentsData } from "./seed-documents";
import { seedErpFinanceTransactions } from "./seed-erp-finance";
import { seedFinanceData } from "./seed-finance";
import { seedExecutiveIntelligence } from "./seed-executive-intelligence";
import { seedIntegrationsData } from "./seed-integrations";
import { seedOperationsData } from "./seed-operations";
import { seedRelationshipPortals } from "./seed-relationships";
import { seedSupplyChainData } from "./seed-supply-chain";
import { seedWorkflows } from "./seed-workflows";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: Number(process.env.DATABASE_POOL_MAX ?? 5),
});
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const DEMO_ORG_SLUG = "acme-india";
const DEMO_ORG_NAME = "Acme India Pvt Ltd";
const ADMIN_EMAIL = "admin@acme-india.local";

async function seedOrganization() {
  return prisma.organization.upsert({
    where: { slug: DEMO_ORG_SLUG },
    create: {
      slug: DEMO_ORG_SLUG,
      name: DEMO_ORG_NAME,
      status: TenantStatus.ACTIVE,
      gstin: "29AABCU9603R1ZM",
      pan: "AABCU9603R",
      timezone: "Asia/Kolkata",
      locale: "en-IN",
      currency: "INR",
      fiscalYearStartMonth: 4,
      settings: {
        seedProfile: "production-minimal",
        seededAt: new Date().toISOString(),
      },
    },
    update: {
      name: DEMO_ORG_NAME,
      status: TenantStatus.ACTIVE,
      settings: {
        seedProfile: "production-minimal",
        seededAt: new Date().toISOString(),
      },
    },
  });
}

async function seedFoundationCompany(organizationId: string) {
  return prisma.company.upsert({
    where: {
      organizationId_companyCode: {
        organizationId,
        companyCode: "ACME",
      },
    },
    create: {
      organizationId,
      companyCode: "ACME",
      companyName: "Acme India Manufacturing Pvt Ltd",
      legalName: "Acme India Manufacturing Private Limited",
      registeredAddress: "Bistupur Industrial Estate, Jamshedpur, Jharkhand",
      country: "India",
      state: "Jharkhand",
      city: "Jamshedpur",
      currency: "INR",
      fiscalYearStart: new Date("2025-04-01T00:00:00.000Z"),
      fiscalYearEnd: new Date("2026-03-31T00:00:00.000Z"),
      status: CompanyStatus.ACTIVE,
    },
    update: {
      companyName: "Acme India Manufacturing Pvt Ltd",
      legalName: "Acme India Manufacturing Private Limited",
      registeredAddress: "Bistupur Industrial Estate, Jamshedpur, Jharkhand",
      country: "India",
      state: "Jharkhand",
      city: "Jamshedpur",
      currency: "INR",
      fiscalYearStart: new Date("2025-04-01T00:00:00.000Z"),
      fiscalYearEnd: new Date("2026-03-31T00:00:00.000Z"),
      status: CompanyStatus.ACTIVE,
      deletedAt: null,
    },
  });
}

async function seedFoundationLocations(organizationId: string, companyId: string) {
  const locations = [
    {
      locationCode: "PLT-JSR",
      locationName: "Jamshedpur Manufacturing Plant",
      locationType: LocationType.PLANT,
      address: "Adityapur Industrial Area, Jamshedpur, Jharkhand",
      country: "India",
      state: "Jharkhand",
      city: "Jamshedpur",
      pincode: "831013",
      contactPerson: "Plant Administration",
      contactEmail: "plant-admin@acme-india.local",
      contactPhone: "+91-657-555-0101",
      isPrimary: true,
    },
    {
      locationCode: "WH-JSR",
      locationName: "Jamshedpur Central Warehouse",
      locationType: LocationType.WAREHOUSE,
      address: "Gamharia Logistics Park, Jamshedpur, Jharkhand",
      country: "India",
      state: "Jharkhand",
      city: "Jamshedpur",
      pincode: "832108",
      contactPerson: "Warehouse Operations",
      contactEmail: "warehouse-jsr@acme-india.local",
      contactPhone: "+91-657-555-0102",
      isPrimary: false,
    },
    {
      locationCode: "BR-KOL",
      locationName: "Kolkata Sales Branch",
      locationType: LocationType.BRANCH,
      address: "Salt Lake Sector V, Kolkata, West Bengal",
      country: "India",
      state: "West Bengal",
      city: "Kolkata",
      pincode: "700091",
      contactPerson: "Regional Sales Office",
      contactEmail: "sales-kolkata@acme-india.local",
      contactPhone: "+91-33-5550-0103",
      isPrimary: false,
    },
  ];

  for (const location of locations) {
    await prisma.location.upsert({
      where: {
        organizationId_locationCode: {
          organizationId,
          locationCode: location.locationCode,
        },
      },
      create: {
        organizationId,
        companyId,
        ...location,
        status: LocationStatus.ACTIVE,
      },
      update: {
        companyId,
        ...location,
        status: LocationStatus.ACTIVE,
        deletedAt: null,
      },
    });
  }
}

async function seedFoundationDepartments(
  organizationId: string,
  companyId: string,
) {
  const locations = await prisma.location.findMany({
    where: { organizationId, companyId },
    select: { id: true, locationCode: true },
  });
  const locationByCode = new Map(
    locations.map((location) => [location.locationCode, location.id]),
  );
  const departments = [
    {
      departmentCode: "FIN",
      departmentName: "Finance & Accounts",
      departmentType: DepartmentType.FINANCE,
      locationId: null,
    },
    {
      departmentCode: "PUR",
      departmentName: "Purchase Department",
      departmentType: DepartmentType.PURCHASE,
      locationId: null,
    },
    {
      departmentCode: "STR",
      departmentName: "Stores Department",
      departmentType: DepartmentType.STORES,
      locationId: locationByCode.get("WH-JSR") ?? null,
    },
    {
      departmentCode: "PRD",
      departmentName: "Production Department",
      departmentType: DepartmentType.PRODUCTION,
      locationId: locationByCode.get("PLT-JSR") ?? null,
    },
    {
      departmentCode: "QLT",
      departmentName: "Quality Department",
      departmentType: DepartmentType.QUALITY,
      locationId: locationByCode.get("PLT-JSR") ?? null,
    },
    {
      departmentCode: "SLS",
      departmentName: "Sales Department",
      departmentType: DepartmentType.SALES,
      locationId: locationByCode.get("BR-KOL") ?? null,
    },
  ];

  for (const department of departments) {
    await prisma.department.upsert({
      where: {
        organizationId_departmentCode: {
          organizationId,
          departmentCode: department.departmentCode,
        },
      },
      create: {
        organizationId,
        companyId,
        ...department,
        status: DepartmentStatus.ACTIVE,
      },
      update: {
        companyId,
        ...department,
        status: DepartmentStatus.ACTIVE,
        deletedAt: null,
      },
    });
  }
}

async function seedFoundationControllingCenters(
  organizationId: string,
  companyId: string,
) {
  const [locations, departments] = await Promise.all([
    prisma.location.findMany({
      where: { organizationId, companyId },
      select: { id: true, locationCode: true },
    }),
    prisma.department.findMany({
      where: { organizationId, companyId },
      select: { id: true, departmentCode: true },
    }),
  ]);
  const locationByCode = new Map(
    locations.map((location) => [location.locationCode, location.id]),
  );
  const departmentByCode = new Map(
    departments.map((department) => [
      department.departmentCode,
      department.id,
    ]),
  );
  const validFrom = new Date("2025-04-01T00:00:00.000Z");
  const costCenters = [
    {
      costCenterCode: "CC-FIN",
      costCenterName: "Finance & Accounts Cost Center",
      costCenterType: CostCenterType.FINANCE,
      departmentId: departmentByCode.get("FIN") ?? null,
      locationId: null,
    },
    {
      costCenterCode: "CC-PUR",
      costCenterName: "Purchase Cost Center",
      costCenterType: CostCenterType.PURCHASE,
      departmentId: departmentByCode.get("PUR") ?? null,
      locationId: null,
    },
    {
      costCenterCode: "CC-PRD",
      costCenterName: "Production Cost Center",
      costCenterType: CostCenterType.PRODUCTION,
      departmentId: departmentByCode.get("PRD") ?? null,
      locationId: locationByCode.get("PLT-JSR") ?? null,
    },
    {
      costCenterCode: "CC-QLT",
      costCenterName: "Quality Cost Center",
      costCenterType: CostCenterType.QUALITY,
      departmentId: departmentByCode.get("QLT") ?? null,
      locationId: locationByCode.get("PLT-JSR") ?? null,
    },
    {
      costCenterCode: "CC-MNT",
      costCenterName: "Maintenance Cost Center",
      costCenterType: CostCenterType.MAINTENANCE,
      departmentId: null,
      locationId: locationByCode.get("PLT-JSR") ?? null,
    },
  ];
  const profitCenters = [
    {
      profitCenterCode: "PC-AUTO",
      profitCenterName: "Automobile Components Profit Center",
      businessSegment: "Auto Components",
      locationId: locationByCode.get("PLT-JSR") ?? null,
    },
    {
      profitCenterCode: "PC-SCRAP",
      profitCenterName: "Scrap Conversion Profit Center",
      businessSegment: "Manufacturing Recycling",
      locationId: locationByCode.get("PLT-JSR") ?? null,
    },
  ];

  for (const costCenter of costCenters) {
    await prisma.costCenter.upsert({
      where: {
        organizationId_costCenterCode: {
          organizationId,
          costCenterCode: costCenter.costCenterCode,
        },
      },
      create: {
        organizationId,
        companyId,
        ...costCenter,
        validFrom,
        status: ControllingCenterStatus.ACTIVE,
      },
      update: {
        companyId,
        ...costCenter,
        validFrom,
        status: ControllingCenterStatus.ACTIVE,
        deletedAt: null,
      },
    });

    if (costCenter.departmentId) {
      await prisma.department.update({
        where: { id: costCenter.departmentId },
        data: { costCenterCode: costCenter.costCenterCode },
      });
    }
  }

  for (const profitCenter of profitCenters) {
    await prisma.profitCenter.upsert({
      where: {
        organizationId_profitCenterCode: {
          organizationId,
          profitCenterCode: profitCenter.profitCenterCode,
        },
      },
      create: {
        organizationId,
        companyId,
        ...profitCenter,
        validFrom,
        status: ControllingCenterStatus.ACTIVE,
      },
      update: {
        companyId,
        ...profitCenter,
        validFrom,
        status: ControllingCenterStatus.ACTIVE,
        deletedAt: null,
      },
    });
  }
}

async function seedOrgAdminRole(organizationId: string) {
  return prisma.role.upsert({
    where: { organizationId_slug: { organizationId, slug: ROLE_ORG_ADMIN } },
    create: {
      organizationId,
      name: "Organization Admin",
      slug: ROLE_ORG_ADMIN,
      isSystem: true,
      description: "System role: organization administrator",
    },
    update: {
      name: "Organization Admin",
      isSystem: true,
      description: "System role: organization administrator",
      deletedAt: null,
    },
  });
}

async function seedAdminUser(
  organizationId: string,
  roleId: string,
  passwordHash: string,
) {
  const admin = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    create: {
      email: ADMIN_EMAIL,
      passwordHash,
      status: UserStatus.ACTIVE,
      firstName: "Org",
      lastName: "Admin",
      emailVerified: new Date(),
    },
    update: {
      passwordHash,
      status: UserStatus.ACTIVE,
      firstName: "Org",
      lastName: "Admin",
      emailVerified: new Date(),
      deletedAt: null,
    },
  });

  await prisma.organizationMember.upsert({
    where: {
      organizationId_userId: {
        organizationId,
        userId: admin.id,
      },
    },
    create: {
      organizationId,
      userId: admin.id,
      role: MemberRole.ADMIN,
      joinedAt: new Date(),
      isPrimary: true,
    },
    update: {
      role: MemberRole.ADMIN,
      isPrimary: true,
      deletedAt: null,
    },
  });

  const existingRole = await prisma.userRole.findFirst({
    where: {
      organizationId,
      userId: admin.id,
      roleId,
      departmentId: null,
      deletedAt: null,
    },
    select: { id: true },
  });

  if (!existingRole) {
    await prisma.userRole.create({
      data: { organizationId, userId: admin.id, roleId },
    });
  }

  return admin;
}

function seedAdminPassword(): string {
  const password = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe@123";
  if (process.env.NODE_ENV === "production" && password === "ChangeMe@123") {
    throw new Error("SEED_ADMIN_PASSWORD must be set to a production-safe value.");
  }
  return password;
}

async function hashSeedAdminPassword(password: string): Promise<string> {
  if (process.env.SEED_ADMIN_PASSWORD_HASH) {
    return process.env.SEED_ADMIN_PASSWORD_HASH;
  }

  const rounds = Number(process.env.SEED_BCRYPT_ROUNDS ?? 10);
  if (!Number.isInteger(rounds) || rounds < 10) {
    throw new Error("SEED_BCRYPT_ROUNDS must be an integer greater than or equal to 10.");
  }

  return bcrypt.hash(password, rounds);
}

async function main() {
  const startedAt = Date.now();
  console.log("Seeding minimal production-safe demo data...");

  const password = seedAdminPassword();
  const [organization, passwordHash] = await Promise.all([
    seedOrganization(),
    hashSeedAdminPassword(password),
  ]);
  const company = await seedFoundationCompany(organization.id);
  await seedFoundationLocations(organization.id, company.id);
  await seedFoundationDepartments(organization.id, company.id);
  await seedFoundationControllingCenters(organization.id, company.id);
  const orgAdminRole = await seedOrgAdminRole(organization.id);
  const admin = await seedAdminUser(organization.id, orgAdminRole.id, passwordHash);

  await seedWorkflows(prisma, organization.id, admin.id);
  await seedFinanceData(prisma, organization.id, admin.id, admin.id, admin.id);
  await seedOperationsData(prisma, organization.id, admin.id);
  await seedRelationshipPortals(prisma, organization.id, admin.id);
  await seedSupplyChainData(prisma, organization.id, admin.id);
  await seedExecutiveIntelligence(prisma, organization.id, admin.id);
  await seedErpFinanceTransactions(prisma, organization.id, admin.id);
  await seedComplianceData(prisma, organization.id, admin.id);
  await seedDocumentsData(prisma, organization.id, admin.id);
  await seedIntegrationsData(prisma, organization.id);
  await seedConfigurationData(
    prisma,
    organization.id,
    admin.id,
    admin.id,
    admin.id,
  );

  const elapsedSeconds = ((Date.now() - startedAt) / 1000).toFixed(2);
  console.log(`Seed complete in ${elapsedSeconds}s.`);
  console.log(`  Demo org slug: ${DEMO_ORG_SLUG}`);
  console.log(`  Admin: ${ADMIN_EMAIL}`);
  console.log(
    process.env.NODE_ENV === "production"
      ? "  Password: configured via SEED_ADMIN_PASSWORD"
      : `  Password: ${password}`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
