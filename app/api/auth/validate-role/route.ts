import type { NextRequest } from "next/server";
import { validateRoleAccess } from "@/lib/auth/rbac";
import { requireAuth, assertTenantAccess } from "@/lib/middleware/auth";
import { validateRoleSchema } from "@/lib/api/validators";
import { handleApiError, jsonSuccess } from "@/lib/api/response";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    const body = validateRoleSchema.parse(await request.json());

    assertTenantAccess(auth, body.organizationId);

    const result = await validateRoleAccess({
      userId: auth.user.id,
      organizationId: body.organizationId,
      role: body.role,
    });

    return jsonSuccess({
      allowed: result.allowed,
      role: body.role,
      userRoles: result.roles,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
