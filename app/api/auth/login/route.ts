import type { NextRequest } from "next/server";
import { login } from "@/lib/auth/service";
import {
  setAccessTokenCookie,
  setRefreshTokenCookie,
} from "@/lib/auth/cookies";
import { loginSchema } from "@/lib/api/validators";
import { getRequestMeta } from "@/lib/api/request-meta";
import { handleApiError, jsonSuccess } from "@/lib/api/response";

export async function POST(request: NextRequest) {
  try {
    const body = loginSchema.parse(await request.json());
    const meta = await getRequestMeta();

    const result = await login({ ...body, meta });

    if (result.requiresMfa) {
      return jsonSuccess({
        requiresMfa: true,
        mfaChallengeToken: result.mfaChallengeToken,
      });
    }

    if (result.refreshToken) {
      await setRefreshTokenCookie(result.refreshToken);
    }
    if (result.tokens?.accessToken) {
      await setAccessTokenCookie(result.tokens.accessToken);
    }

    return jsonSuccess({
      requiresMfa: false,
      accessToken: result.tokens?.accessToken,
      expiresIn: result.tokens?.expiresIn,
      user: result.user,
      organization: result.organization,
      roles: result.roles,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
