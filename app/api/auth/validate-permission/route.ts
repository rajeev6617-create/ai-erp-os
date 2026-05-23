import type { NextRequest } from "next/server";
import { validatePermissionAccess } from "@/lib/auth/rbac";
import { requireAuth, assertTenantAccess } from "@/lib/middleware/auth";
import { validatePermissionSchema } from "@/lib/api/validators";
import { handleApiError, jsonSuccess } from "@/lib/api/response";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    const body = validatePermissionSchema.parse(await request.json());

    assertTenantAccess(auth, body.organizationId);

    const result = await validatePermissionAccess({
      userId: auth.user.id,
      organizationId: body.organizationId,
      resource: body.resource,
      action: body.action,
    });

    return jsonSuccess({
      allowed: result.allowed,
      resource: body.resource,
      action: body.action,
      permissions: result.permissions,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
