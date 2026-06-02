import type { SystemRoleSlug } from "@/lib/auth/constants";
import {
  LayoutDashboard,
  GitBranch,
  IndianRupee,
  FileCheck,
  Shield,
  Bot,
  Users,
  Building2,
  FileText,
  Settings,
  Plug,
  Workflow,
  Handshake,
  Store,
  PackageSearch,
  Warehouse,
  Factory,
  ClipboardCheck,
  BriefcaseBusiness,
  FileSearch,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  roles?: SystemRoleSlug[];
}

export const mainNavigation: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  {
    label: "Workflows",
    href: "/dashboard/workflows",
    icon: GitBranch,
    roles: [
      "super-admin",
      "organization-admin",
      "manager",
      "employee",
      "ai-agent",
    ],
  },
  {
    label: "Finance",
    href: "/dashboard/finance",
    icon: IndianRupee,
    roles: [
      "super-admin",
      "organization-admin",
      "manager",
      "cfo",
      "finance-manager",
      "auditor",
    ],
  },
  {
    label: "Operations",
    href: "/dashboard/operations",
    icon: Workflow,
    roles: [
      "super-admin",
      "organization-admin",
      "manager",
      "cfo",
      "finance-manager",
      "auditor",
    ],
  },
  {
    label: "CRM",
    href: "/dashboard/operations/crm",
    icon: Handshake,
    roles: [
      "super-admin",
      "organization-admin",
      "manager",
      "cfo",
      "finance-manager",
      "auditor",
    ],
  },
  {
    label: "SRM",
    href: "/dashboard/operations/srm",
    icon: Store,
    roles: [
      "super-admin",
      "organization-admin",
      "manager",
      "cfo",
      "finance-manager",
      "auditor",
    ],
  },
  {
    label: "Inventory",
    href: "/dashboard/operations/inventory",
    icon: PackageSearch,
    roles: [
      "super-admin",
      "organization-admin",
      "manager",
      "cfo",
      "finance-manager",
      "auditor",
    ],
  },
  {
    label: "Warehouse",
    href: "/dashboard/operations/warehouse",
    icon: Warehouse,
    roles: [
      "super-admin",
      "organization-admin",
      "manager",
      "cfo",
      "finance-manager",
      "auditor",
    ],
  },
  {
    label: "Production",
    href: "/dashboard/operations/production",
    icon: Factory,
    roles: [
      "super-admin",
      "organization-admin",
      "manager",
      "cfo",
      "finance-manager",
      "auditor",
    ],
  },
  {
    label: "Quality",
    href: "/dashboard/operations/quality",
    icon: ClipboardCheck,
    roles: [
      "super-admin",
      "organization-admin",
      "manager",
      "cfo",
      "finance-manager",
      "auditor",
    ],
  },
  {
    label: "Executive",
    href: "/dashboard/executive",
    icon: BriefcaseBusiness,
    roles: [
      "super-admin",
      "organization-admin",
      "manager",
      "cfo",
      "finance-manager",
      "auditor",
    ],
  },
  {
    label: "Approvals",
    href: "/dashboard/approvals",
    icon: FileCheck,
    roles: [
      "super-admin",
      "organization-admin",
      "manager",
      "cfo",
      "finance-manager",
      "auditor",
      "employee",
    ],
  },
  {
    label: "Compliance",
    href: "/dashboard/operations/compliance",
    icon: Shield,
    roles: [
      "super-admin",
      "organization-admin",
      "manager",
      "cfo",
      "finance-manager",
      "auditor",
    ],
  },
  {
    label: "Audit",
    href: "/dashboard/operations/audit",
    icon: FileSearch,
    roles: [
      "super-admin",
      "organization-admin",
      "manager",
      "cfo",
      "finance-manager",
      "auditor",
    ],
  },
  {
    label: "AI Agents",
    href: "/dashboard/ai",
    icon: Bot,
    roles: ["super-admin", "organization-admin", "manager", "ai-agent"],
  },
  {
    label: "Documents",
    href: "/dashboard/documents",
    icon: FileText,
  },
  {
    label: "People",
    href: "/dashboard/people",
    icon: Users,
    roles: ["super-admin", "organization-admin", "manager"],
  },
  {
    label: "Foundation - Company Setup",
    href: "/dashboard/foundation/company",
    icon: Building2,
    roles: [
      "super-admin",
      "organization-admin",
      "manager",
      "cfo",
      "finance-manager",
      "auditor",
      "employee",
      "ai-agent",
    ],
  },
  {
    label: "Organization",
    href: "/dashboard/organization",
    icon: Building2,
    roles: ["super-admin", "organization-admin"],
  },
  {
    label: "Integrations",
    href: "/dashboard/integrations",
    icon: Plug,
    roles: ["super-admin", "organization-admin"],
  },
  {
    label: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
    roles: ["super-admin", "organization-admin"],
  },
];

export function filterNavByRoles(
  items: NavItem[],
  roles: SystemRoleSlug[],
): NavItem[] {
  const isSuperAdmin = roles.includes("super-admin");
  return items.filter((item) => {
    if (!item.roles || isSuperAdmin) return true;
    return item.roles.some((r) => roles.includes(r));
  });
}
