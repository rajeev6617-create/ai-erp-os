import type { NextRequest } from "next/server";
import { withAuth } from "@/lib/middleware/with-auth";
import { handleApiError, jsonSuccess } from "@/lib/api/response";
import { approvalTabSchema } from "@/lib/api/validators-workflows";
import { listApprovalsByTab } from "@/lib/workflows/queries";

export const GET = withAuth(async (request: NextRequest, auth) => {
  try {
    const tab = approvalTabSchema.parse(
      request.nextUrl.searchParams.get("tab") ?? "pending",
    );
    const items = await listApprovalsByTab(auth.organization.id, tab);
    return jsonSuccess({ tab, items });
  } catch (error) {
    return handleApiError(error);
  }
});
