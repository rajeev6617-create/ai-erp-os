import { prisma } from "@/lib/db/prisma";
import {
  ROLE_SUPER_ADMIN,
  type SystemRoleSlug,
  permissionKey,
} from "@/lib/auth/constants";
import { authConfig } from "@/lib/auth/config";

export interface UserRoleContext {
  roles: SystemRoleSlug[];
  permissions: string[];
  isSuperAdmin: boolean;
}

export async function resolveUserRoles(
  userId: string,
  organizationId: string,
): Promise<UserRoleContext> {
  const platformOrg = await prisma.organization.findFirst({
    where: { slug: authConfig.platformOrgSlug, deletedAt: null },
    select: { id: true },
  });

  const assignments = await prisma.userRole.findMany({
    where: {
      userId,
      deletedAt: null,
      OR: [
        { organizationId },
        ...(platformOrg ? [{ organizationId: platformOrg.id }] : []),
      ],
      AND: [
        {
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
      ],
    },
    include: {
      role: {
        select: {
          slug: true,
          rolePermissions: {
            include: {
              permission: {
                select: { resource: true, action: true },
              },
            },
          },
        },
      },
    },
  });

  const roleSlugs = new Set<SystemRoleSlug>();
  const permissions = new Set<string>();

  for (const assignment of assignments) {
    const slug = assignment.role.slug as SystemRoleSlug;
    roleSlugs.add(slug);
    for (const rp of assignment.role.rolePermissions) {
      permissions.add(
        permissionKey(rp.permission.resource, rp.permission.action),
      );
    }
  }

  const roles = [...roleSlugs];
  const isSuperAdmin = roles.includes(ROLE_SUPER_ADMIN);

  return {
    roles,
    permissions: [...permissions],
    isSuperAdmin,
  };
}

export function hasRole(roles: SystemRoleSlug[], required: SystemRoleSlug): boolean {
  return roles.includes(required);
}

export function hasAnyRole(
  roles: SystemRoleSlug[],
  required: SystemRoleSlug[],
): boolean {
  return required.some((r) => roles.includes(r));
}

export function hasPermission(
  permissions: string[],
  resource: string,
  action: string,
): boolean {
  return (
    permissions.includes(permissionKey(resource, action)) ||
    permissions.includes(permissionKey(resource, "manage"))
  );
}

export async function assertOrganizationMembership(
  userId: string,
  organizationId: string,
): Promise<boolean> {
  const member = await prisma.organizationMember.findFirst({
    where: {
      userId,
      organizationId,
      deletedAt: null,
    },
  });
  return Boolean(member);
}

export async function validateRoleAccess(params: {
  userId: string;
  organizationId: string;
  role: SystemRoleSlug;
}): Promise<{ allowed: boolean; roles: SystemRoleSlug[] }> {
  const ctx = await resolveUserRoles(params.userId, params.organizationId);
  return {
    allowed: hasRole(ctx.roles, params.role) || ctx.isSuperAdmin,
    roles: ctx.roles,
  };
}

export async function validatePermissionAccess(params: {
  userId: string;
  organizationId: string;
  resource: string;
  action: string;
}): Promise<{ allowed: boolean; permissions: string[] }> {
  const ctx = await resolveUserRoles(params.userId, params.organizationId);
  const allowed =
    ctx.isSuperAdmin ||
    hasPermission(ctx.permissions, params.resource, params.action);
  return { allowed, permissions: ctx.permissions };
}
