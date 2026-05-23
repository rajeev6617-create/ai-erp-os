import type { NextRequest } from "next/server";
import { getRequestMeta } from "@/lib/api/request-meta";
import { handleApiError, jsonSuccess } from "@/lib/api/response";
import { withAuth } from "@/lib/middleware/with-auth";
import { generateComplianceAiAgentInsights } from "@/lib/ai-agents/compliance";

export const GET = withAuth(async (_request: NextRequest, auth) => {
  try {
    const meta = await getRequestMeta();
    const result = await generateComplianceAiAgentInsights({
      organizationId: auth.organization.id,
      actorUserId: auth.user.id,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
      source: "api",
    });

    return jsonSuccess(result);
  } catch (error) {
    return handleApiError(error);
  }
});
