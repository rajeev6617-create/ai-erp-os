import { prisma } from "@/lib/db/prisma";
import type { IntegrationsDashboardData } from "@/lib/integrations/types";

export async function getIntegrationsDashboard(
  organizationId: string,
): Promise<IntegrationsDashboardData> {
  const integrations = await prisma.integration.findMany({
    where: { organizationId, deletedAt: null },
    orderBy: [{ status: "asc" }, { name: "asc" }],
  });

  const connected = integrations.filter((i) => i.status === "CONNECTED").length;
  const errored = integrations.filter((i) => i.status === "ERROR").length;

  return {
    stats: [
      {
        label: "Connected",
        value: String(connected),
        change: `${integrations.length} configured`,
        trend: "up",
      },
      {
        label: "Pending setup",
        value: String(integrations.filter((i) => i.status === "PENDING").length),
        change: "Awaiting credentials",
        trend: "neutral",
      },
      {
        label: "Errors",
        value: String(errored),
        change: errored > 0 ? "Needs attention" : "All healthy",
        trend: errored > 0 ? "down" : "up",
      },
      {
        label: "Providers",
        value: String(new Set(integrations.map((i) => i.provider)).size),
        change: "Finance, tax, collaboration",
        trend: "neutral",
      },
    ],
    integrations: integrations.map((item) => ({
      id: item.id,
      provider: item.provider,
      name: item.name,
      status: item.status,
      lastSyncAt: item.lastSyncAt?.toISOString() ?? null,
      lastError: formatLastError(item.lastError),
    })),
  };
}

function formatLastError(value: unknown): string | null {
  if (!value || typeof value !== "object") return null;
  const message = (value as Record<string, unknown>).message;
  return typeof message === "string" ? message : null;
}
