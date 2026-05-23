import type { NextRequest } from "next/server";
import { getRequestMeta } from "@/lib/api/request-meta";
import { validatePermissionAccess } from "@/lib/auth/rbac";
import { writeAuditLog } from "@/lib/auth/audit";
import { requireAuth, assertTenantAccess } from "@/lib/middleware/auth";
import { validatePermissionSchema } from "@/lib/api/validators";
import { handleApiError, jsonSuccess } from "@/lib/api/response";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    const body = validatePermissionSchema.parse(await request.json());
    const meta = await getRequestMeta();

    assertTenantAccess(auth, body.organizationId);

    const result = await validatePermissionAccess({
      userId: auth.user.id,
      organizationId: body.organizationId,
      resource: body.resource,
      action: body.action,
    });

    await writeAuditLog({
      organizationId: auth.organization.id,
      userId: auth.user.id,
      action: "rbac.permission.validate",
      resource: body.resource,
      resourceId: `${body.resource}:${body.action}`,
      severity: result.allowed ? "INFO" : "WARNING",
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
      after: {
        requestedOrganizationId: body.organizationId,
        resource: body.resource,
        action: body.action,
        allowed: result.allowed,
      },
      metadata: { route: request.nextUrl.pathname },
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
