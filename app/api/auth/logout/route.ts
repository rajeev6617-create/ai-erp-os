import type { NextRequest } from "next/server";
import { logout } from "@/lib/auth/service";
import {
  clearAccessTokenCookie,
  clearRefreshTokenCookie,
} from "@/lib/auth/cookies";
import { requireAuth } from "@/lib/middleware/auth";
import { getRequestMeta } from "@/lib/api/request-meta";
import { handleApiError, jsonSuccess } from "@/lib/api/response";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    const meta = await getRequestMeta();

    await logout(auth.sessionId, auth.user.id, auth.organization.id, meta);
  } catch (error) {
    const response = handleApiError(error);
    if (response.status !== 401) {
      return response;
    }
  } finally {
    await clearAccessTokenCookie();
    await clearRefreshTokenCookie();
  }

  return jsonSuccess({ loggedOut: true });
}
