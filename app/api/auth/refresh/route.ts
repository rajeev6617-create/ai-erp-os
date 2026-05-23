import type { NextRequest } from "next/server";
import { refreshAccessToken } from "@/lib/auth/service";
import {
  getRefreshTokenFromCookie,
  setAccessTokenCookie,
  setRefreshTokenCookie,
} from "@/lib/auth/cookies";
import { refreshSchema } from "@/lib/api/validators";
import { getRequestMeta } from "@/lib/api/request-meta";
import { handleApiError, jsonSuccess, jsonError } from "@/lib/api/response";

export async function POST(request: NextRequest) {
  try {
    const body = refreshSchema.parse(
      await request.json().catch(() => ({})),
    );
    const cookieToken = await getRefreshTokenFromCookie();
    const refreshToken = body.refreshToken ?? cookieToken;

    if (!refreshToken) {
      return jsonError("Refresh token required", 401, "MISSING_REFRESH_TOKEN");
    }

    const meta = await getRequestMeta();
    const result = await refreshAccessToken(refreshToken, meta);

    await setAccessTokenCookie(result.tokens.accessToken);
    await setRefreshTokenCookie(result.refreshToken);

    return jsonSuccess({
      accessToken: result.tokens.accessToken,
      expiresIn: result.tokens.expiresIn,
      organizationId: result.organizationId,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
