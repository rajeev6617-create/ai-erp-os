import type { PrismaClient } from "../app/generated/prisma/client";

const FRAMEWORKS = [
  {
    code: "GST",
    name: "GST & e-Invoice",
    description: "Monthly GST returns, e-invoice compliance, and input tax credit controls.",
    requirements: [
      { code: "GSTR-1", title: "GSTR-1 outward supplies", frequency: "monthly", dueDay: 11 },
      { code: "GSTR-3B", title: "GSTR-3B summary return", frequency: "monthly", dueDay: 20 },
      { code: "EINV", title: "e-Invoice IRN coverage", frequency: "continuous", dueDay: null },
    ],
  },
  {
    code: "TDS",
    name: "TDS compliance",
    description: "TDS deduction, deposit, and quarterly statements.",
    requirements: [
      { code: "TDS-DEP", title: "TDS deposit within due date", frequency: "monthly", dueDay: 7 },
      { code: "24Q", title: "Form 24Q — salary TDS", frequency: "quarterly", dueDay: 31 },
    ],
  },
  {
    code: "DPDP",
    name: "DPDP readiness",
    description: "Data protection policies, consent, and access governance.",
    requirements: [
      { code: "POL-REVIEW", title: "Privacy policy annual review", frequency: "annual", dueDay: 31 },
      { code: "ACCESS-REVIEW", title: "Quarterly access review", frequency: "quarterly", dueDay: 15 },
    ],
  },
];

export async function seedComplianceData(
  prisma: PrismaClient,
  organizationId: string,
  assessedById: string,
) {
  const periodStart = new Date("2026-04-01");
  const periodEnd = new Date("2026-06-30");

  for (const fw of FRAMEWORKS) {
    const framework = await prisma.complianceFramework.upsert({
      where: {
        organizationId_code: { organizationId, code: fw.code },
      },
      create: {
        organizationId,
        code: fw.code,
        name: fw.name,
        description: fw.description,
        isActive: true,
        metadata: { seedProfile: "erp-compliance" },
      },
      update: {
        name: fw.name,
        description: fw.description,
        isActive: true,
        deletedAt: null,
      },
    });

    for (const req of fw.requirements) {
      const requirement = await prisma.complianceRequirement.upsert({
        where: {
          frameworkId_code: { frameworkId: framework.id, code: req.code },
        },
        create: {
          frameworkId: framework.id,
          code: req.code,
          title: req.title,
          frequency: req.frequency,
          dueDay: req.dueDay,
          description: `${req.title} under ${fw.name}`,
        },
        update: {
          title: req.title,
          frequency: req.frequency,
          dueDay: req.dueDay,
        },
      });

      const controlExists = await prisma.complianceControl.findFirst({
        where: { requirementId: requirement.id, name: `${req.code} control` },
        select: { id: true },
      });
      if (!controlExists) {
        await prisma.complianceControl.create({
          data: {
            requirementId: requirement.id,
            name: `${req.code} control`,
            controlType: req.code.includes("REVIEW") ? "detective" : "preventive",
            automationKey: `compliance:${fw.code.toLowerCase()}:${req.code.toLowerCase()}`,
          },
        });
      }

      const existingAssessment = await prisma.complianceAssessment.findFirst({
        where: {
          organizationId,
          frameworkId: framework.id,
          requirementId: requirement.id,
          periodStart,
          periodEnd,
        },
        select: { id: true },
      });

      const status =
        req.code === "GSTR-3B"
          ? "IN_PROGRESS"
          : req.code === "EINV"
            ? "COMPLIANT"
            : req.code === "ACCESS-REVIEW"
              ? "NON_COMPLIANT"
              : "NOT_STARTED";

      if (!existingAssessment) {
        await prisma.complianceAssessment.create({
          data: {
            organizationId,
            frameworkId: framework.id,
            requirementId: requirement.id,
            periodStart,
            periodEnd,
            status,
            score: status === "COMPLIANT" ? 96 : status === "IN_PROGRESS" ? 72 : status === "NON_COMPLIANT" ? 41 : null,
            assessedById: status !== "NOT_STARTED" ? assessedById : null,
            assessedAt: status !== "NOT_STARTED" ? new Date() : null,
            notes:
              status === "NON_COMPLIANT"
                ? "3 finance users retain stale admin permissions — remediation in progress."
                : status === "IN_PROGRESS"
                  ? "Return draft prepared; awaiting CFO sign-off."
                  : null,
            metadata: { seedProfile: "erp-compliance" },
          },
        });
      }
    }
  }

  console.log("  Compliance: GST, TDS, DPDP frameworks with assessments");
}
