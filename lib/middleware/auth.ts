import type { NextRequest } from "next/server";
import { buildAuthContext } from "@/lib/auth/service";
import { ACCESS_TOKEN_COOKIE } from "@/lib/auth/cookie-names";
import { getBearerToken } from "@/lib/api/request-meta";
import type { AuthContext } from "@/lib/auth/types";
import { AuthError } from "@/lib/api/errors";

function getRequestToken(request: NextRequest): string | null {
  return (
    getBearerToken(request.headers.get("authorization")) ??
    request.cookies.get(ACCESS_TOKEN_COOKIE)?.value ??
    null
  );
}

export async function requireAuth(request: NextRequest): Promise<AuthContext> {
  const token = getRequestToken(request);
  if (!token) {
    throw new AuthError("Missing access token", 401, "MISSING_TOKEN");
  }
  return buildAuthContext(token);
}

export async function requireAuthOptional(
  request: NextRequest,
): Promise<AuthContext | null> {
  const token = getRequestToken(request);
  if (!token) return null;
  return buildAuthContext(token);
}

/** Enforce tenant isolation: URL/body org must match token org unless super admin */
export function assertTenantAccess(
  auth: AuthContext,
  organizationId: string,
): void {
  if (auth.isSuperAdmin) return;
  if (auth.organization.id !== organizationId) {
    throw new AuthError("Cross-tenant access denied", 403, "TENANT_FORBIDDEN");
  }
}
