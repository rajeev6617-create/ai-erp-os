import type { NextRequest } from "next/server";
import { handleApiError, jsonSuccess } from "@/lib/api/response";
import { withAuth } from "@/lib/middleware/with-auth";
import { listApprovalAuditHistory } from "@/lib/workflows/audit-history";

export const GET = withAuth(async (request: NextRequest, auth) => {
  try {
    const limit = Number(request.nextUrl.searchParams.get("limit") ?? 50);
    const approvalId = request.nextUrl.searchParams.get("approvalId");
    const history = await listApprovalAuditHistory({
      organizationId: auth.organization.id,
      auth,
      limit: Number.isFinite(limit) ? limit : 50,
      approvalId,
    });

    return jsonSuccess(history);
  } catch (error) {
    return handleApiError(error);
  }
});
