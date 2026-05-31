import { prisma } from "@/lib/db/prisma";
import type { PeopleDashboardData } from "@/lib/people/types";

export async function getPeopleDashboard(
  organizationId: string,
): Promise<PeopleDashboardData> {
  const [members, employees] = await Promise.all([
    prisma.organizationMember.findMany({
      where: { organizationId, deletedAt: null },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            displayName: true,
            status: true,
          },
        },
      },
      orderBy: { joinedAt: "desc" },
    }),
    prisma.employeeProfile.findMany({
      where: { organizationId, deletedAt: null },
      include: { department: { select: { name: true } } },
    }),
  ]);

  const employeeByUser = new Map(employees.map((e) => [e.userId, e]));
  const activeMembers = members.filter((m) => m.user.status === "ACTIVE");

  return {
    stats: [
      {
        label: "Organization members",
        value: String(members.length),
        change: `${activeMembers.length} active`,
        trend: "neutral",
      },
      {
        label: "Employee profiles",
        value: String(employees.length),
        change: `${new Set(employees.map((e) => e.departmentId).filter(Boolean)).size} departments`,
        trend: "up",
      },
      {
        label: "Admins",
        value: String(members.filter((m) => m.role === "ADMIN" || m.role === "OWNER").length),
        change: "Governed access",
        trend: "neutral",
      },
      {
        label: "Invited",
        value: String(members.filter((m) => m.user.status === "INVITED").length),
        change: "Pending onboarding",
        trend: "neutral",
      },
    ],
    members: members.map((member) => {
      const profile = employeeByUser.get(member.userId);
      const name =
        member.user.displayName ??
        [member.user.firstName, member.user.lastName].filter(Boolean).join(" ") ??
        member.user.email;

      return {
        id: member.id,
        name,
        email: member.user.email,
        role: member.role,
        status: member.user.status,
        employeeCode: profile?.employeeCode ?? null,
        department: profile?.department?.name ?? null,
        designation: profile?.designation ?? null,
      };
    }),
  };
}
