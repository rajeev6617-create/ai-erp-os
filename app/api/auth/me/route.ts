import type { NextRequest } from "next/server";
import { requireAuth } from "@/lib/middleware/auth";
import { handleApiError, jsonSuccess } from "@/lib/api/response";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    return jsonSuccess({
      user: auth.user,
      organization: auth.organization,
      roles: auth.roles,
      permissions: auth.permissions,
      mfaVerified: auth.mfaVerified,
      isSuperAdmin: auth.isSuperAdmin,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
