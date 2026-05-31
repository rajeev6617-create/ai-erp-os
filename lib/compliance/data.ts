import { prisma } from "@/lib/db/prisma";
import type { ComplianceDashboardData } from "@/lib/compliance/types";

export async function getComplianceDashboard(
  organizationId: string,
): Promise<ComplianceDashboardData> {
  const [frameworks, assessments] = await Promise.all([
    prisma.complianceFramework.findMany({
      where: { organizationId, deletedAt: null, isActive: true },
      include: {
        requirements: { select: { id: true } },
        assessments: {
          where: {
            status: { in: ["NOT_STARTED", "IN_PROGRESS", "NON_COMPLIANT"] },
          },
          select: { id: true },
        },
      },
      orderBy: { code: "asc" },
    }),
    prisma.complianceAssessment.findMany({
      where: { organizationId },
      include: {
        framework: { select: { code: true, name: true } },
        requirement: { select: { title: true } },
        evidence: { select: { id: true } },
      },
      orderBy: [{ status: "asc" }, { periodEnd: "asc" }],
      take: 16,
    }),
  ]);

  const openCount = assessments.filter((a) =>
    ["NOT_STARTED", "IN_PROGRESS", "NON_COMPLIANT"].includes(a.status),
  ).length;
  const compliantCount = assessments.filter((a) => a.status === "COMPLIANT").length;

  return {
    stats: [
      {
        label: "Active frameworks",
        value: String(frameworks.length),
        change: `${frameworks.reduce((sum, f) => sum + f.requirements.length, 0)} obligations`,
        trend: "neutral",
      },
      {
        label: "Open assessments",
        value: String(openCount),
        change: `${assessments.filter((a) => a.status === "NON_COMPLIANT").length} non-compliant`,
        trend: openCount > 0 ? "down" : "up",
      },
      {
        label: "Compliant",
        value: String(compliantCount),
        change: "Current review period",
        trend: "up",
      },
      {
        label: "Evidence items",
        value: String(assessments.reduce((sum, a) => sum + a.evidence.length, 0)),
        change: "Linked documents",
        trend: "neutral",
      },
    ],
    frameworks: frameworks.map((fw) => ({
      id: fw.id,
      code: fw.code,
      name: fw.name,
      description: fw.description,
      requirementCount: fw.requirements.length,
      openAssessments: fw.assessments.length,
    })),
    assessments: assessments.map((a) => ({
      id: a.id,
      frameworkCode: a.framework.code,
      frameworkName: a.framework.name,
      requirementTitle: a.requirement?.title ?? null,
      status: a.status,
      score: a.score != null ? Number(a.score) : null,
      periodStart: a.periodStart.toISOString().slice(0, 10),
      periodEnd: a.periodEnd.toISOString().slice(0, 10),
      evidenceCount: a.evidence.length,
      notes: a.notes,
    })),
  };
}
