import type { PrismaClient } from "../app/generated/prisma/client";

export async function seedWorkflows(
  prisma: PrismaClient,
  organizationId: string,
  _adminUserId: string,
  _financeUserId?: string,
) {
  void _adminUserId;
  void _financeUserId;

  await prisma.workflow.upsert({
    where: {
      organizationId_slug_version: {
        organizationId,
        slug: "vendor-payment",
        version: 1,
      },
    },
    create: {
      organizationId,
      name: "Vendor Payment Approval",
      slug: "vendor-payment",
      version: 1,
      status: "ACTIVE",
      triggerType: "manual",
      definition: {
        steps: [
          {
            key: "submit",
            type: "form",
            label: "Submit payment request",
          },
          {
            key: "approve",
            type: "approval",
            label: "Admin approval",
          },
        ],
      },
      tags: ["finance", "payments"],
      metadata: { seedProfile: "production-minimal" },
    },
    update: {
      name: "Vendor Payment Approval",
      status: "ACTIVE",
      triggerType: "manual",
      definition: {
        steps: [
          {
            key: "submit",
            type: "form",
            label: "Submit payment request",
          },
          {
            key: "approve",
            type: "approval",
            label: "Admin approval",
          },
        ],
      },
      tags: ["finance", "payments"],
      metadata: { seedProfile: "production-minimal" },
      deletedAt: null,
    },
  });

  console.log("  Workflow: seeded Vendor Payment Approval");
}
