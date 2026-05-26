import {
  ROLE_AUDITOR,
  ROLE_CFO,
  ROLE_FINANCE_MANAGER,
  ROLE_MANAGER,
  ROLE_ORG_ADMIN,
  ROLE_SUPER_ADMIN,
  type SystemRoleSlug,
} from "@/lib/auth/constants";

export const CRM_DASHBOARD_ROLES = [
  ROLE_SUPER_ADMIN,
  ROLE_ORG_ADMIN,
  ROLE_MANAGER,
  ROLE_CFO,
  ROLE_FINANCE_MANAGER,
  ROLE_AUDITOR,
] as const satisfies readonly SystemRoleSlug[];

export const SRM_DASHBOARD_ROLES = CRM_DASHBOARD_ROLES;
