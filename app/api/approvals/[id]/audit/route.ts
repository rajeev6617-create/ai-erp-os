import type { NextRequest } from "next/server";
import { ApiError } from "@/lib/api/errors";
import { handleApiError, jsonSuccess } from "@/lib/api/response";
import { withAuth } from "@/lib/middleware/with-auth";
import { getApprovalAuditHistory } from "@/lib/workflows/audit-history";

function extractApprovalId(pathname: string): string | null {
  const parts = pathname.split("/").filter(Boolean);
  const idx = parts.indexOf("approvals");
  return idx >= 0 ? parts[idx + 1] ?? null : null;
}

export const GET = withAuth(async (request: NextRequest, auth) => {
  try {
    const approvalId = extractApprovalId(request.nextUrl.pathname);
    if (!approvalId) {
      throw new ApiError("Missing approval id", 400, "MISSING_APPROVAL_ID");
    }

    const history = await getApprovalAuditHistory({
      approvalId,
      organizationId: auth.organization.id,
      auth,
    });

    return jsonSuccess(history);
  } catch (error) {
    return handleApiError(error);
  }
});
