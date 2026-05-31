import { prisma } from "@/lib/db/prisma";
import type { OrganizationDashboardData } from "@/lib/organization/types";

export async function getOrganizationDashboard(
  organizationId: string,
): Promise<OrganizationDashboardData> {
  const [organization, departments, employeeCounts] = await Promise.all([
    prisma.organization.findUniqueOrThrow({
      where: { id: organizationId },
      select: {
        name: true,
        slug: true,
        legalName: true,
        status: true,
        tier: true,
        gstin: true,
        pan: true,
        timezone: true,
        currency: true,
        fiscalYearStartMonth: true,
        settings: true,
      },
    }),
    prisma.department.findMany({
      where: { organizationId, deletedAt: null },
      select: {
        id: true,
        code: true,
        name: true,
        costCenterCode: true,
      },
      orderBy: { name: "asc" },
    }),
    prisma.employeeProfile.groupBy({
      by: ["departmentId"],
      where: { organizationId, deletedAt: null, departmentId: { not: null } },
      _count: { id: true },
    }),
  ]);

  const countByDept = new Map(
    employeeCounts.map((row) => [row.departmentId, row._count.id]),
  );

  const settings = asRecord(organization.settings);

  return {
    organization: {
      name: organization.name,
      slug: organization.slug,
      legalName: organization.legalName,
      status: organization.status,
      tier: organization.tier,
      gstin: organization.gstin,
      pan: organization.pan,
      timezone: organization.timezone,
      currency: organization.currency,
      fiscalYearStartMonth: organization.fiscalYearStartMonth,
    },
    departments: departments.map((dept) => ({
      id: dept.id,
      code: dept.code,
      name: dept.name,
      costCenterCode: dept.costCenterCode,
      employeeCount: countByDept.get(dept.id) ?? 0,
    })),
    settingsSummary: [
      {
        key: "Approval delegation",
        value: settings.approvalDelegationEnabled === true ? "Enabled" : "Disabled",
      },
      {
        key: "Finance approval limit",
        value:
          typeof settings.financeApprovalLimitInr === "number"
            ? `INR ${settings.financeApprovalLimitInr.toLocaleString("en-IN")}`
            : "Not configured",
      },
      {
        key: "MFA for finance approval",
        value: settings.requireMfaForFinanceApproval === true ? "Required" : "Optional",
      },
      {
        key: "Default SLA",
        value:
          typeof settings.defaultSlaMinutes === "number"
            ? `${Math.round(settings.defaultSlaMinutes / 60)} hours`
            : "24 hours",
      },
    ],
  };
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}
