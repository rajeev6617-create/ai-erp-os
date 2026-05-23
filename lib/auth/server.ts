import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  ROLE_AI_AGENT,
  ROLE_AUDITOR,
  ROLE_CFO,
  ROLE_EMPLOYEE,
  ROLE_FINANCE_MANAGER,
  ROLE_MANAGER,
  ROLE_ORG_ADMIN,
  ROLE_SUPER_ADMIN,
  type SystemRoleSlug,
} from "@/lib/auth/constants";
import { ACCESS_TOKEN_COOKIE } from "@/lib/auth/cookie-names";
import { buildAuthContext } from "@/lib/auth/service";
import { hasAnyRole } from "@/lib/auth/rbac";
import type { AuthContext } from "@/lib/auth/types";

export const DASHBOARD_ACCESS_ROLES = [
  ROLE_SUPER_ADMIN,
  ROLE_ORG_ADMIN,
  ROLE_MANAGER,
  ROLE_CFO,
  ROLE_FINANCE_MANAGER,
  ROLE_AUDITOR,
  ROLE_EMPLOYEE,
  ROLE_AI_AGENT,
] as const satisfies readonly SystemRoleSlug[];

export const getServerAuth = cache(async (): Promise<AuthContext | null> => {
  const store = await cookies();
  const token = store.get(ACCESS_TOKEN_COOKIE)?.value;

  if (!token) {
    return null;
  }

  try {
    return await buildAuthContext(token);
  } catch {
    return null;
  }
});

export async function requireDashboardAuth(
  allowedRoles: readonly SystemRoleSlug[] = DASHBOARD_ACCESS_ROLES,
  forbiddenRedirect = "/login",
): Promise<AuthContext> {
  const auth = await getServerAuth();

  if (!auth) {
    redirect("/login");
  }

  if (
    !auth.isSuperAdmin &&
    allowedRoles.length > 0 &&
    !hasAnyRole(auth.roles, [...allowedRoles])
  ) {
    redirect(forbiddenRedirect);
  }

  return auth;
}
