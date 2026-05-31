import type { PrismaClient } from "../app/generated/prisma/client";

const INTEGRATIONS = [
  {
    provider: "razorpay",
    name: "Razorpay payments",
    status: "CONNECTED" as const,
    config: { mode: "sandbox", settlement: "T+1" },
  },
  {
    provider: "tally",
    name: "Tally Prime sync",
    status: "PENDING" as const,
    config: { syncIntervalMins: 60, entities: ["vouchers", "ledgers"] },
  },
  {
    provider: "gst_portal",
    name: "GST portal",
    status: "CONNECTED" as const,
    config: { returns: ["GSTR-1", "GSTR-3B"], autoFetch: true },
  },
  {
    provider: "slack",
    name: "Slack approvals",
    status: "ERROR" as const,
    config: { channel: "#finance-approvals" },
    lastError: { message: "OAuth token expired", code: "token_expired" },
  },
];

export async function seedIntegrationsData(prisma: PrismaClient, organizationId: string) {
  for (const item of INTEGRATIONS) {
    await prisma.integration.upsert({
      where: {
        organizationId_provider_name: {
          organizationId,
          provider: item.provider,
          name: item.name,
        },
      },
      create: {
        organizationId,
        provider: item.provider,
        name: item.name,
        status: item.status,
        config: item.config,
        lastSyncAt: item.status === "CONNECTED" ? new Date() : null,
        lastError: item.lastError ?? undefined,
        metadata: { seedProfile: "erp-integrations" },
      },
      update: {
        status: item.status,
        config: item.config,
        lastSyncAt: item.status === "CONNECTED" ? new Date() : null,
        lastError: item.lastError ?? undefined,
        deletedAt: null,
      },
    });
  }

  console.log("  Integrations: Razorpay, Tally, GST portal, Slack");
}
