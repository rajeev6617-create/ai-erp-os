import type { NextRequest } from "next/server";
import { ApiError } from "@/lib/api/errors";
import { getRequestMeta } from "@/lib/api/request-meta";
import { handleApiError, jsonSuccess } from "@/lib/api/response";
import { ROLE_ORG_ADMIN, ROLE_SUPER_ADMIN } from "@/lib/auth/constants";
import { departmentUpdateSchema } from "@/lib/foundation/department";
import {
  deactivateDepartment,
  getDepartmentById,
  updateDepartment,
} from "@/lib/foundation/department-service";
import { withAuth, withRole } from "@/lib/middleware/with-auth";

const DEPARTMENT_MUTATION_ROLES = [ROLE_SUPER_ADMIN, ROLE_ORG_ADMIN] as const;

function extractDepartmentId(pathname: string): string | null {
  const parts = pathname.split("/").filter(Boolean);
  const idx = parts.indexOf("departments");
  return idx >= 0 ? parts[idx + 1] ?? null : null;
}

export const GET = withAuth(async (request: NextRequest, auth) => {
  try {
    const id = extractDepartmentId(request.nextUrl.pathname);
    if (!id) {
      throw new ApiError("Missing department id", 400, "MISSING_DEPARTMENT_ID");
    }

    const department = await getDepartmentById({
      organizationId: auth.organization.id,
      id,
    });
    return jsonSuccess(department);
  } catch (error) {
    return handleApiError(error);
  }
});

export const PATCH = withRole(
  [...DEPARTMENT_MUTATION_ROLES],
  async (request: NextRequest, auth) => {
    try {
      const id = extractDepartmentId(request.nextUrl.pathname);
      if (!id) {
        throw new ApiError(
          "Missing department id",
          400,
          "MISSING_DEPARTMENT_ID",
        );
      }
      const input = departmentUpdateSchema.parse(await request.json());
      const meta = await getRequestMeta();

      const department = await updateDepartment({
        organizationId: auth.organization.id,
        id,
        input,
        actor: {
          userId: auth.user.id,
          ipAddress: meta.ipAddress,
          userAgent: meta.userAgent,
          route: request.nextUrl.pathname,
        },
      });

      return jsonSuccess(department);
    } catch (error) {
      return handleApiError(error);
    }
  },
);

export const DELETE = withRole(
  [...DEPARTMENT_MUTATION_ROLES],
  async (request: NextRequest, auth) => {
    try {
      const id = extractDepartmentId(request.nextUrl.pathname);
      if (!id) {
        throw new ApiError(
          "Missing department id",
          400,
          "MISSING_DEPARTMENT_ID",
        );
      }
      const meta = await getRequestMeta();

      const department = await deactivateDepartment({
        organizationId: auth.organization.id,
        id,
        actor: {
          userId: auth.user.id,
          ipAddress: meta.ipAddress,
          userAgent: meta.userAgent,
          route: request.nextUrl.pathname,
        },
      });

      return jsonSuccess(department);
    } catch (error) {
      return handleApiError(error);
    }
  },
);
