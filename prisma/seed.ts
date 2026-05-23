import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import {
  PrismaClient,
  PermissionScope,
  UserStatus,
  MemberRole,
  TenantStatus,
} from "../app/generated/prisma/client";
import {
  ROLE_SUPER_ADMIN,
  ROLE_ORG_ADMIN,
  ROLE_MANAGER,
  ROLE_CFO,
  ROLE_FINANCE_MANAGER,
  ROLE_AUDITOR,
  ROLE_EMPLOYEE,
  ROLE_AI_AGENT,
  SYSTEM_ROLES,
  RESOURCES,
  ACTIONS,
} from "../lib/auth/constants";
import { hashPassword } from "../lib/auth/password";
import { seedConfigurationData } from "./seed-configuration";
import { seedFinanceData } from "./seed-finance";
import { seedWorkflows } from "./seed-workflows";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const ROLE_PERMISSIONS: Record<string, string[]> = {
  [ROLE_SUPER_ADMIN]: ["*"],
  [ROLE_ORG_ADMIN]: [
    "organization:manage",
    "user:manage",
    "role:manage",
    "department:manage",
    "workflow:manage",
    "integration:manage",
    "audit:read",
  ],
  [ROLE_CFO]: [
    "invoice:manage",
    "payment:manage",
    "expense:manage",
    "compliance:read",
    "audit:read",
    "document:read",
  ],
  [ROLE_MANAGER]: [
    "workflow:manage",
    "invoice:read",
    "payment:read",
    "expense:manage",
    "document:read",
    "department:read",
  ],
  [ROLE_FINANCE_MANAGER]: [
    "invoice:create",
    "invoice:read",
    "invoice:update",
    "payment:create",
    "payment:read",
    "expense:create",
    "expense:read",
    "expense:update",
  ],
  [ROLE_AUDITOR]: [
    "audit:read",
    "invoice:read",
    "payment:read",
    "expense:read",
    "compliance:read",
    "document:read",
  ],
  [ROLE_EMPLOYEE]: [
    "workflow:read",
    "document:read",
    "document:create",
    "expense:create",
    "expense:read",
  ],
  [ROLE_AI_AGENT]: [
    "ai_agent:manage",
    "workflow:read",
    "workflow:create",
    "document:read",
    "integration:read",
  ],
};

async function seedPermissions() {
  const permissions = [];
  for (const resource of RESOURCES) {
    for (const action of ACTIONS) {
      permissions.push({
        resource,
        action,
        scope: PermissionScope.ORGANIZATION,
        description: `${action} ${resource}`,
        isSystem: true,
      });
    }
  }
  for (const p of permissions) {
    await prisma.permission.upsert({
      where: {
        resource_action_scope: {
          resource: p.resource,
          action: p.action,
          scope: p.scope,
        },
      },
      create: p,
      update: {},
    });
  }
}

async function seedOrganization(params: {
  slug: string;
  name: string;
  isPlatform?: boolean;
}) {
  return prisma.organization.upsert({
    where: { slug: params.slug },
    create: {
      slug: params.slug,
      name: params.name,
      status: TenantStatus.ACTIVE,
      gstin: params.isPlatform ? null : "29AABCU9603R1ZM",
      pan: params.isPlatform ? null : "AABCU9603R",
    },
    update: { name: params.name },
  });
}

async function seedRolesForOrg(organizationId: string, includeSuperAdmin: boolean) {
  const rolesToSeed = includeSuperAdmin
    ? SYSTEM_ROLES
    : SYSTEM_ROLES.filter((r) => r !== ROLE_SUPER_ADMIN);

  const allPermissions = await prisma.permission.findMany();

  for (const slug of rolesToSeed) {
    const role = await prisma.role.upsert({
      where: { organizationId_slug: { organizationId, slug } },
      create: {
        organizationId,
        name: slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        slug,
        isSystem: true,
        description: `System role: ${slug}`,
      },
      update: {},
    });

    const keys = ROLE_PERMISSIONS[slug] ?? [];
    const permissionIds = new Set<string>();

    for (const key of keys) {
      if (key === "*") {
        allPermissions.forEach((p) => permissionIds.add(p.id));
        break;
      }
      const [resource, action] = key.split(":");
      const match = allPermissions.filter(
        (p) =>
          p.resource === resource &&
          (p.action === action || action === "manage"),
      );
      match.forEach((p) => permissionIds.add(p.id));
    }

    for (const permissionId of permissionIds) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: { roleId: role.id, permissionId },
        },
        create: { roleId: role.id, permissionId },
        update: {},
      });
    }
  }
}

async function assignRole(
  organizationId: string,
  userId: string,
  roleId: string,
) {
  const existing = await prisma.userRole.findFirst({
    where: {
      organizationId,
      userId,
      roleId,
      departmentId: null,
      deletedAt: null,
    },
  });
  if (!existing) {
    await prisma.userRole.create({
      data: { organizationId, userId, roleId },
    });
  }
}

async function main() {
  console.log("Seeding RBAC and demo tenant...");

  await seedPermissions();

  const platform = await seedOrganization({
    slug: process.env.PLATFORM_ORGANIZATION_SLUG ?? "platform",
    name: "AI ERP Platform",
    isPlatform: true,
  });

  const demo = await seedOrganization({
    slug: "acme-india",
    name: "Acme India Pvt Ltd",
  });

  await seedRolesForOrg(platform.id, true);
  await seedRolesForOrg(demo.id, false);

  const passwordHash = await hashPassword(
    process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe@123",
  );

  const admin = await prisma.user.upsert({
    where: { email: "admin@acme-india.local" },
    create: {
      email: "admin@acme-india.local",
      passwordHash,
      status: UserStatus.ACTIVE,
      firstName: "Org",
      lastName: "Admin",
      emailVerified: new Date(),
    },
    update: { passwordHash, status: UserStatus.ACTIVE },
  });

  const superAdmin = await prisma.user.upsert({
    where: { email: "superadmin@platform.local" },
    create: {
      email: "superadmin@platform.local",
      passwordHash,
      status: UserStatus.ACTIVE,
      firstName: "Super",
      lastName: "Admin",
      emailVerified: new Date(),
    },
    update: { passwordHash, status: UserStatus.ACTIVE },
  });

  const cfo = await prisma.user.upsert({
    where: { email: "cfo@acme-india.local" },
    create: {
      email: "cfo@acme-india.local",
      passwordHash,
      status: UserStatus.ACTIVE,
      firstName: "Ananya",
      lastName: "CFO",
      emailVerified: new Date(),
    },
    update: { passwordHash, status: UserStatus.ACTIVE },
  });

  const financeManager = await prisma.user.upsert({
    where: { email: "finance.manager@acme-india.local" },
    create: {
      email: "finance.manager@acme-india.local",
      passwordHash,
      status: UserStatus.ACTIVE,
      firstName: "Rohan",
      lastName: "Finance",
      emailVerified: new Date(),
    },
    update: { passwordHash, status: UserStatus.ACTIVE },
  });

  const auditor = await prisma.user.upsert({
    where: { email: "auditor@acme-india.local" },
    create: {
      email: "auditor@acme-india.local",
      passwordHash,
      status: UserStatus.ACTIVE,
      firstName: "Meera",
      lastName: "Audit",
      emailVerified: new Date(),
    },
    update: { passwordHash, status: UserStatus.ACTIVE },
  });

  await prisma.organizationMember.upsert({
    where: {
      organizationId_userId: {
        organizationId: demo.id,
        userId: admin.id,
      },
    },
    create: {
      organizationId: demo.id,
      userId: admin.id,
      role: MemberRole.ADMIN,
      joinedAt: new Date(),
      isPrimary: true,
    },
    update: {},
  });

  await Promise.all([
    prisma.organizationMember.upsert({
      where: {
        organizationId_userId: {
          organizationId: demo.id,
          userId: cfo.id,
        },
      },
      create: {
        organizationId: demo.id,
        userId: cfo.id,
        role: MemberRole.MANAGER,
        joinedAt: new Date(),
      },
      update: {},
    }),
    prisma.organizationMember.upsert({
      where: {
        organizationId_userId: {
          organizationId: demo.id,
          userId: financeManager.id,
        },
      },
      create: {
        organizationId: demo.id,
        userId: financeManager.id,
        role: MemberRole.MANAGER,
        joinedAt: new Date(),
      },
      update: {},
    }),
    prisma.organizationMember.upsert({
      where: {
        organizationId_userId: {
          organizationId: demo.id,
          userId: auditor.id,
        },
      },
      create: {
        organizationId: demo.id,
        userId: auditor.id,
        role: MemberRole.VIEWER,
        joinedAt: new Date(),
      },
      update: {},
    }),
  ]);

  const orgAdminRole = await prisma.role.findFirstOrThrow({
    where: { organizationId: demo.id, slug: ROLE_ORG_ADMIN },
  });

  await assignRole(demo.id, admin.id, orgAdminRole.id);

  const [cfoRole, financeManagerRole, auditorRole] = await Promise.all([
    prisma.role.findFirstOrThrow({
      where: { organizationId: demo.id, slug: ROLE_CFO },
    }),
    prisma.role.findFirstOrThrow({
      where: { organizationId: demo.id, slug: ROLE_FINANCE_MANAGER },
    }),
    prisma.role.findFirstOrThrow({
      where: { organizationId: demo.id, slug: ROLE_AUDITOR },
    }),
  ]);

  await Promise.all([
    assignRole(demo.id, cfo.id, cfoRole.id),
    assignRole(demo.id, financeManager.id, financeManagerRole.id),
    assignRole(demo.id, auditor.id, auditorRole.id),
  ]);

  const superRole = await prisma.role.findFirstOrThrow({
    where: { organizationId: platform.id, slug: ROLE_SUPER_ADMIN },
  });

  await assignRole(platform.id, superAdmin.id, superRole.id);

  await seedWorkflows(prisma, demo.id, admin.id, financeManager.id);
  await seedFinanceData(prisma, demo.id, admin.id, financeManager.id, cfo.id);
  await seedConfigurationData(prisma, demo.id, admin.id, cfo.id, financeManager.id);

  console.log("Seed complete.");
  console.log("  Demo org slug: acme-india");
  console.log("  Admin: admin@acme-india.local");
  console.log("  CFO: cfo@acme-india.local");
  console.log("  Finance manager: finance.manager@acme-india.local");
  console.log("  Auditor: auditor@acme-india.local");
  console.log("  Super admin: superadmin@platform.local");
  console.log(`  Password: ${process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe@123"}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
