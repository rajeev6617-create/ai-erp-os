import type { NextRequest } from "next/server";
import { getRequestMeta } from "@/lib/api/request-meta";
import { validateRoleAccess } from "@/lib/auth/rbac";
import { writeAuditLog } from "@/lib/auth/audit";
import { requireAuth, assertTenantAccess } from "@/lib/middleware/auth";
import { validateRoleSchema } from "@/lib/api/validators";
import { handleApiError, jsonSuccess } from "@/lib/api/response";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    const body = validateRoleSchema.parse(await request.json());
    const meta = await getRequestMeta();

    assertTenantAccess(auth, body.organizationId);

    const result = await validateRoleAccess({
      userId: auth.user.id,
      organizationId: body.organizationId,
      role: body.role,
    });

    await writeAuditLog({
      organizationId: auth.organization.id,
      userId: auth.user.id,
      action: "rbac.role.validate",
      resource: "role",
      resourceId: body.role,
      severity: result.allowed ? "INFO" : "WARNING",
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
      after: {
        requestedOrganizationId: body.organizationId,
        role: body.role,
        allowed: result.allowed,
      },
      metadata: { route: request.nextUrl.pathname },
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
