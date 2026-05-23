import type { AuthContext } from "@/lib/auth/types";
import type { SystemRoleSlug } from "@/lib/auth/constants";
import { hasAnyRole, hasPermission } from "@/lib/auth/rbac";
import { ForbiddenError } from "@/lib/api/errors";

export function requireRole(
  auth: AuthContext,
  role: SystemRoleSlug | SystemRoleSlug[],
): void {
  const roles = Array.isArray(role) ? role : [role];
  if (auth.isSuperAdmin) return;
  if (!hasAnyRole(auth.roles, roles)) {
    throw new ForbiddenError("Insufficient role", "ROLE_FORBIDDEN");
  }
}

export function requirePermission(
  auth: AuthContext,
  resource: string,
  action: string,
): void {
  if (auth.isSuperAdmin) return;
  if (!hasPermission(auth.permissions, resource, action)) {
    throw new ForbiddenError("Insufficient permission", "PERMISSION_FORBIDDEN");
  }
}

export function requireRoleOrPermission(
  auth: AuthContext,
  options: {
    roles?: SystemRoleSlug[];
    resource?: string;
    action?: string;
  },
): void {
  if (auth.isSuperAdmin) return;

  const roleOk =
    options.roles?.length &&
    hasAnyRole(auth.roles, options.roles);
  const permOk =
    options.resource &&
    options.action &&
    hasPermission(auth.permissions, options.resource, options.action);

  if (!roleOk && !permOk) {
    throw new ForbiddenError("Access denied", "ACCESS_FORBIDDEN");
  }
}
