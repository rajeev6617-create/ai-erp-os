/** Platform-wide super administrator */
export const ROLE_SUPER_ADMIN = "super-admin";

/** Organization-scoped enterprise roles */
export const ROLE_ORG_ADMIN = "organization-admin";
export const ROLE_MANAGER = "manager";
export const ROLE_CFO = "cfo";
export const ROLE_FINANCE_MANAGER = "finance-manager";
export const ROLE_AUDITOR = "auditor";
export const ROLE_EMPLOYEE = "employee";
export const ROLE_AI_AGENT = "ai-agent";

export const SYSTEM_ROLES = [
  ROLE_SUPER_ADMIN,
  ROLE_ORG_ADMIN,
  ROLE_MANAGER,
  ROLE_CFO,
  ROLE_FINANCE_MANAGER,
  ROLE_AUDITOR,
  ROLE_EMPLOYEE,
  ROLE_AI_AGENT,
] as const;

export type SystemRoleSlug = (typeof SYSTEM_ROLES)[number];

export const RESOURCES = [
  "organization",
  "user",
  "role",
  "department",
  "workflow",
  "invoice",
  "payment",
  "expense",
  "operation",
  "customer",
  "vendor",
  "portal",
  "crm",
  "srm",
  "document",
  "compliance",
  "audit",
  "integration",
  "ai_agent",
] as const;

export type Resource = (typeof RESOURCES)[number];

export const ACTIONS = [
  "create",
  "read",
  "update",
  "delete",
  "approve",
  "export",
  "manage",
] as const;

export type Action = (typeof ACTIONS)[number];

export function permissionKey(resource: string, action: string): string {
  return `${resource}:${action}`;
}
