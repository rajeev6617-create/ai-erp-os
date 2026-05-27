import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import {
  MemberRole,
  PrismaClient,
  TenantStatus,
  UserStatus,
} from "../app/generated/prisma/client";
import { ROLE_ORG_ADMIN } from "../lib/auth/constants";
import { seedFinanceData } from "./seed-finance";
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
  const orgAdminRole = await seedOrgAdminRole(organization.id);
  const admin = await seedAdminUser(organization.id, orgAdminRole.id, passwordHash);

  await seedWorkflows(prisma, organization.id, admin.id);
  await seedFinanceData(prisma, organization.id, admin.id, admin.id, admin.id);
  await seedOperationsData(prisma, organization.id, admin.id);
  await seedRelationshipPortals(prisma, organization.id, admin.id);
  await seedSupplyChainData(prisma, organization.id, admin.id);

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
