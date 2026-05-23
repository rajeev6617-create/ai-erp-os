import type { NextRequest } from "next/server";
import { withAuth } from "@/lib/middleware/with-auth";
import { ApiError } from "@/lib/api/errors";
import { getRequestMeta } from "@/lib/api/request-meta";
import { handleApiError, jsonSuccess } from "@/lib/api/response";
import { approvalActionSchema } from "@/lib/api/validators-workflows";
import { performApprovalAction } from "@/lib/workflows/service";

function extractApprovalId(pathname: string): string | null {
  const parts = pathname.split("/").filter(Boolean);
  const idx = parts.indexOf("approvals");
  return idx >= 0 ? parts[idx + 1] ?? null : null;
}

export const POST = withAuth(async (request: NextRequest, auth) => {
  try {
    const id = extractApprovalId(request.nextUrl.pathname);
    if (!id) {
      throw new ApiError("Missing approval id", 400, "MISSING_APPROVAL_ID");
    }
    const body = approvalActionSchema.parse(await request.json());
    const meta = await getRequestMeta();

    const result = await performApprovalAction({
      approvalId: id,
      organizationId: auth.organization.id,
      userId: auth.user.id,
      roles: auth.roles,
      permissions: auth.permissions,
      isSuperAdmin: auth.isSuperAdmin,
      userDisplayName:
        [auth.user.firstName, auth.user.lastName].filter(Boolean).join(" ") ||
        auth.user.email,
      action: body.action,
      comment: body.comment,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    return jsonSuccess(result);
  } catch (error) {
    return handleApiError(error);
  }
});
