import { writeAuditLog } from "@/lib/auth/audit";
import type {
  AiAgentInsight,
  AiAgentKind,
  AiAgentRequestContext,
  AiAgentRunMetadata,
  AiAgentSeverity,
} from "@/lib/ai-agents/types";

export function buildAgentMetadata(agent: AiAgentKind): AiAgentRunMetadata {
  return {
    agent,
    provider: "mock_rules_engine",
    modelId: "mock-enterprise-agent-v1",
    generatedAt: new Date().toISOString(),
    llmReady: true,
  };
}

export function insight(params: {
  id: string;
  title: string;
  description: string;
  severity: AiAgentSeverity;
  confidence: number;
  evidence: string[];
  recommendation: string;
}): AiAgentInsight {
  return params;
}

export async function auditAiInsightGeneration(params: {
  context: AiAgentRequestContext;
  agent: AiAgentKind;
  insights: AiAgentInsight[];
  categories: Record<string, number>;
}): Promise<void> {
  const highestSeverity = maxSeverity(params.insights);
  await writeAuditLog({
    organizationId: params.context.organizationId,
    userId: params.context.actorUserId ?? null,
    action: `ai_agent.${params.agent}.insights_generated`,
    resource: "ai_agent",
    resourceId: params.agent,
    severity: highestSeverity === "critical" ? "WARNING" : "INFO",
    ipAddress: params.context.ipAddress,
    userAgent: params.context.userAgent,
    after: {
      agent: params.agent,
      insightCount: params.insights.length,
      highestSeverity,
      insightIds: params.insights.map((item) => item.id),
      categories: params.categories,
    },
    metadata: {
      source: params.context.source ?? "api",
      provider: "mock_rules_engine",
      modelId: "mock-enterprise-agent-v1",
      llmReady: true,
    },
    correlationId: `ai-agent:${params.agent}`,
  });
}

export function decimalToNumber(value: unknown): number {
  if (value == null) return 0;
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value) || 0;
  if (typeof value === "object" && "toString" in value) {
    const parsed = Number(value.toString());
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

export function daysUntil(date: Date, from = new Date()): number {
  const start = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
  const end = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.ceil((end - start) / 86_400_000);
}

export function formatInr(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function severityFromScore(score: number): AiAgentSeverity {
  if (score >= 85) return "critical";
  if (score >= 65) return "high";
  if (score >= 35) return "medium";
  return "low";
}

function maxSeverity(insights: AiAgentInsight[]): AiAgentSeverity {
  const order: Record<AiAgentSeverity, number> = {
    low: 0,
    medium: 1,
    high: 2,
    critical: 3,
  };
  return insights.reduce<AiAgentSeverity>(
    (max, item) => (order[item.severity] > order[max] ? item.severity : max),
    "low",
  );
}
