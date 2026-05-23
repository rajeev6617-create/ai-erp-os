import type { NextRequest } from "next/server";
import type { AuthContext } from "@/lib/auth/types";
import { writeAuditLog } from "@/lib/auth/audit";
import { getRequestMeta } from "@/lib/api/request-meta";
import { requireAuth } from "@/lib/middleware/auth";
import { requirePermission, requireRole } from "@/lib/middleware/permission";
import type { SystemRoleSlug } from "@/lib/auth/constants";
import { ForbiddenError, isAuthError } from "@/lib/api/errors";
import { handleApiError, jsonSuccess } from "@/lib/api/response";

type AuthenticatedHandler = (
  request: NextRequest,
  auth: AuthContext,
) => Promise<Response>;

export function withAuth(handler: AuthenticatedHandler) {
  return async (request: NextRequest): Promise<Response> => {
    let auth: AuthContext | null = null;
    try {
      auth = await requireAuth(request);
      return await handler(request, auth);
    } catch (error) {
      await auditApiAccessFailure(request, auth, error);
      return handleApiError(error);
    }
  };
}

export function withRole(role: SystemRoleSlug | SystemRoleSlug[], handler: AuthenticatedHandler) {
  return withAuth(async (request, auth) => {
    requireRole(auth, role);
    return handler(request, auth);
  });
}

export function withPermission(
  resource: string,
  action: string,
  handler: AuthenticatedHandler,
) {
  return withAuth(async (request, auth) => {
    requirePermission(auth, resource, action);
    return handler(request, auth);
  });
}

export function withAuthJson<T>(
  handler: (request: NextRequest, auth: AuthContext) => Promise<T>,
) {
  return withAuth(async (request, auth) => jsonSuccess(await handler(request, auth)));
}

async function auditApiAccessFailure(
  request: NextRequest,
  auth: AuthContext | null,
  error: unknown,
) {
  if (!auth) return;
  if (!isAuthorizationFailure(error)) return;

  try {
    const meta = await getRequestMeta();
    await writeAuditLog({
      organizationId: auth.organization.id,
      userId: auth.user.id,
      action: "api.access_denied",
      resource: "api",
      resourceId: request.nextUrl.pathname,
      severity: "WARNING",
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
      after: {
        method: request.method,
        path: request.nextUrl.pathname,
        code: errorCode(error),
      },
      metadata: { source: "withAuth" },
    });
  } catch (auditError) {
    console.warn("[audit] failed to record API access denial", auditError);
  }
}

function isAuthorizationFailure(error: unknown): boolean {
  if (error instanceof ForbiddenError) return true;
  return isAuthError(error) && error.status === 403;
}

function errorCode(error: unknown): string {
  if (error instanceof ForbiddenError) return error.code;
  if (isAuthError(error)) return error.code;
  return "ACCESS_DENIED";
}
