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

export const ADMIN_DASHBOARD_ROLES = [
  ROLE_SUPER_ADMIN,
  ROLE_ORG_ADMIN,
] as const satisfies readonly SystemRoleSlug[];

export const DASHBOARD_ROUTE_POLICIES = [
  {
    prefix: "/dashboard/settings",
    roles: ADMIN_DASHBOARD_ROLES,
    description: "Tenant configuration and admin controls",
  },
  {
    prefix: "/dashboard/finance",
    roles: [
      ROLE_SUPER_ADMIN,
      ROLE_ORG_ADMIN,
      ROLE_MANAGER,
      ROLE_CFO,
      ROLE_FINANCE_MANAGER,
      ROLE_AUDITOR,
    ],
    description: "Finance command center",
  },
  {
    prefix: "/dashboard/operations",
    roles: [
      ROLE_SUPER_ADMIN,
      ROLE_ORG_ADMIN,
      ROLE_MANAGER,
      ROLE_CFO,
      ROLE_FINANCE_MANAGER,
      ROLE_AUDITOR,
    ],
    description: "Enterprise operations modules",
  },
  {
    prefix: "/dashboard/approvals",
    roles: [
      ROLE_SUPER_ADMIN,
      ROLE_ORG_ADMIN,
      ROLE_MANAGER,
      ROLE_CFO,
      ROLE_FINANCE_MANAGER,
      ROLE_AUDITOR,
      ROLE_EMPLOYEE,
    ],
    description: "Workflow approvals",
  },
  {
    prefix: "/dashboard/workflows",
    roles: [
      ROLE_SUPER_ADMIN,
      ROLE_ORG_ADMIN,
      ROLE_MANAGER,
      ROLE_EMPLOYEE,
      ROLE_AI_AGENT,
    ],
    description: "Workflow redirect and workflow-facing navigation",
  },
  {
    prefix: "/dashboard/compliance",
    roles: [
      ROLE_SUPER_ADMIN,
      ROLE_ORG_ADMIN,
      ROLE_MANAGER,
      ROLE_CFO,
      ROLE_AUDITOR,
    ],
    description: "Compliance workspace",
  },
  {
    prefix: "/dashboard/ai",
    roles: [ROLE_SUPER_ADMIN, ROLE_ORG_ADMIN, ROLE_MANAGER, ROLE_AI_AGENT],
    description: "AI agent operations",
  },
  {
    prefix: "/dashboard/people",
    roles: [ROLE_SUPER_ADMIN, ROLE_ORG_ADMIN, ROLE_MANAGER],
    description: "People administration",
  },
  {
    prefix: "/dashboard/organization",
    roles: ADMIN_DASHBOARD_ROLES,
    description: "Organization administration",
  },
  {
    prefix: "/dashboard/integrations",
    roles: ADMIN_DASHBOARD_ROLES,
    description: "Integration administration",
  },
  {
    prefix: "/dashboard",
    roles: DASHBOARD_ACCESS_ROLES,
    description: "Dashboard landing",
  },
] as const satisfies readonly {
  prefix: string;
  roles: readonly SystemRoleSlug[];
  description: string;
}[];

export function requiredRolesForDashboardPath(
  pathname: string,
): readonly SystemRoleSlug[] {
  return (
    DASHBOARD_ROUTE_POLICIES.find(({ prefix }) =>
      pathname === prefix || pathname.startsWith(`${prefix}/`),
    )?.roles ?? DASHBOARD_ACCESS_ROLES
  );
}

export function routeProtectionPolicyForPath(pathname: string) {
  return DASHBOARD_ROUTE_POLICIES.find(({ prefix }) =>
    pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function auditDashboardRouteProtection(
  dashboardPaths: readonly string[],
): Array<{ path: string; status: "pass" | "fail"; message: string }> {
  return dashboardPaths.map((path) => {
    const policy = routeProtectionPolicyForPath(path);
    if (!policy) {
      return {
        path,
        status: "fail",
        message: "No dashboard route protection policy matched this path.",
      };
    }

    const roles = policy.roles as readonly SystemRoleSlug[];
    if (roles.length === 0) {
      return {
        path,
        status: "fail",
        message: `Policy ${policy.prefix} has no allowed roles.`,
      };
    }

    return {
      path,
      status: "pass",
      message: `${policy.prefix} allows ${roles.join(", ")}.`,
    };
  });
}
