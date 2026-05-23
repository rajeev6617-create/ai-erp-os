import { prisma } from "@/lib/db/prisma";
import { generateAuditorAiAgentInsights } from "@/lib/ai-agents/auditor";
import { generateCfoAiAgentInsights } from "@/lib/ai-agents/cfo";
import { generateComplianceAiAgentInsights } from "@/lib/ai-agents/compliance";
import type {
  AuditorAiAgentResult,
  CfoAiAgentResult,
  ComplianceAiAgentResult,
} from "@/lib/ai-agents/types";
import { getOperationsDashboard } from "@/lib/workflows/queries";
import type { OperationsDashboardData } from "@/lib/workflows/types";

export interface AiDashboardData {
  operations: OperationsDashboardData;
  agentOverview: {
    totalAgents: number;
    activeAgents: number;
    pausedAgents: number;
    actionsLast30Days: number;
    successRate: number;
    approvalRequired: number;
    averageLatencyMs: number;
    costInr: number;
  };
  agents: Array<{
    id: string;
    name: string;
    status: string;
    modelProvider: string;
    modelId: string;
    version: number;
    updatedAt: string;
    actionCount: number;
  }>;
  recentActions: Array<{
    id: string;
    actionType: string;
    status: string;
    agentName: string;
    requiresApproval: boolean;
    latencyMs: number | null;
    costInr: number;
    createdAt: string;
  }>;
  actionStatusCounts: Array<{
    status: string;
    count: number;
  }>;
  cfoAgent: CfoAiAgentResult;
  auditorAgent: AuditorAiAgentResult;
  complianceAgent: ComplianceAiAgentResult;
}

export async function getAiDashboard(
  organizationId: string,
  actorUserId?: string | null,
): Promise<AiDashboardData> {
  const since = new Date();
  since.setDate(since.getDate() - 30);

  const [
    operations,
    agents,
    actionRows,
    recentActions,
    cfoAgent,
    auditorAgent,
    complianceAgent,
  ] = await Promise.all([
    getOperationsDashboard(organizationId),
    prisma.aiAgent.findMany({
      where: { organizationId, deletedAt: null },
      include: { actions: { select: { id: true } } },
      orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
      take: 12,
    }),
    prisma.aiAction.findMany({
      where: { organizationId, createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
      take: 500,
    }),
    prisma.aiAction.findMany({
      where: { organizationId },
      include: { agent: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    generateCfoAiAgentInsights({ organizationId, actorUserId, source: "dashboard" }),
    generateAuditorAiAgentInsights({ organizationId, actorUserId, source: "dashboard" }),
    generateComplianceAiAgentInsights({ organizationId, actorUserId, source: "dashboard" }),
  ]);

  const succeeded = actionRows.filter((action) => action.status === "SUCCEEDED").length;
  const failed = actionRows.filter((action) => action.status === "FAILED").length;
  const completed = succeeded + failed;
  const latencyRows = actionRows.filter((action) => typeof action.latencyMs === "number");
  const costInr = actionRows.reduce(
    (sum, action) => sum + decimalToNumber(action.costInr),
    0,
  );

  return {
    operations,
    agentOverview: {
      totalAgents: agents.length,
      activeAgents: agents.filter((agent) => agent.status === "ACTIVE").length,
      pausedAgents: agents.filter((agent) => agent.status === "PAUSED").length,
      actionsLast30Days: actionRows.length,
      successRate: completed > 0 ? Math.round((succeeded / completed) * 100) : 0,
      approvalRequired: actionRows.filter((action) => action.requiresApproval).length,
      averageLatencyMs:
        latencyRows.length > 0
          ? Math.round(
              latencyRows.reduce((sum, action) => sum + (action.latencyMs ?? 0), 0) /
                latencyRows.length,
            )
          : 0,
      costInr,
    },
    agents: agents.map((agent) => ({
      id: agent.id,
      name: agent.name,
      status: agent.status,
      modelProvider: agent.modelProvider ?? "Not configured",
      modelId: agent.modelId ?? "Model pending",
      version: agent.version,
      updatedAt: agent.updatedAt.toISOString(),
      actionCount: agent.actions.length,
    })),
    recentActions: recentActions.map((action) => ({
      id: action.id,
      actionType: action.actionType,
      status: action.status,
      agentName: action.agent?.name ?? "Unassigned agent",
      requiresApproval: action.requiresApproval,
      latencyMs: action.latencyMs,
      costInr: decimalToNumber(action.costInr),
      createdAt: action.createdAt.toISOString(),
    })),
    actionStatusCounts: buildStatusCounts(actionRows.map((action) => action.status)),
    cfoAgent,
    auditorAgent,
    complianceAgent,
  };
}

function buildStatusCounts(statuses: string[]): AiDashboardData["actionStatusCounts"] {
  const map = new Map<string, number>();
  for (const status of statuses) {
    map.set(status, (map.get(status) ?? 0) + 1);
  }

  return [...map.entries()]
    .map(([status, count]) => ({ status, count }))
    .sort((a, b) => b.count - a.count);
}

function decimalToNumber(value: unknown): number {
  if (value == null) return 0;
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value) || 0;
  if (typeof value === "object" && "toString" in value) {
    const parsed = Number(value.toString());
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}
