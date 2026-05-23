import type { NextRequest } from "next/server";
import type { AuthContext } from "@/lib/auth/types";
import { requireAuth } from "@/lib/middleware/auth";
import { requirePermission, requireRole } from "@/lib/middleware/permission";
import type { SystemRoleSlug } from "@/lib/auth/constants";
import { handleApiError, jsonSuccess } from "@/lib/api/response";

type AuthenticatedHandler = (
  request: NextRequest,
  auth: AuthContext,
) => Promise<Response>;

export function withAuth(handler: AuthenticatedHandler) {
  return async (request: NextRequest): Promise<Response> => {
    try {
      const auth = await requireAuth(request);
      return await handler(request, auth);
    } catch (error) {
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
