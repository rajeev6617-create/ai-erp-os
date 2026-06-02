import type { NextRequest } from "next/server";
import { getRequestMeta } from "@/lib/api/request-meta";
import { handleApiError, jsonSuccess } from "@/lib/api/response";
import { ROLE_ORG_ADMIN, ROLE_SUPER_ADMIN } from "@/lib/auth/constants";
import {
  departmentCreateSchema,
  departmentListQuerySchema,
} from "@/lib/foundation/department";
import {
  createDepartment,
  listDepartmentCompanyOptions,
  listDepartmentHeadUserOptions,
  listDepartmentLocationOptions,
  listDepartmentParentOptions,
  listDepartments,
} from "@/lib/foundation/department-service";
import { withAuth, withRole } from "@/lib/middleware/with-auth";

const DEPARTMENT_MUTATION_ROLES = [ROLE_SUPER_ADMIN, ROLE_ORG_ADMIN] as const;

export const GET = withAuth(async (request: NextRequest, auth) => {
  try {
    const query = departmentListQuerySchema.parse({
      q: request.nextUrl.searchParams.get("q") ?? undefined,
      status: request.nextUrl.searchParams.get("status") ?? undefined,
      departmentType:
        request.nextUrl.searchParams.get("departmentType") ?? undefined,
      companyId: request.nextUrl.searchParams.get("companyId") ?? undefined,
      locationId: request.nextUrl.searchParams.get("locationId") ?? undefined,
    });
    const [items, companies, locations, parents, users] = await Promise.all([
      listDepartments({
        organizationId: auth.organization.id,
        query,
      }),
      listDepartmentCompanyOptions(auth.organization.id),
      listDepartmentLocationOptions(auth.organization.id),
      listDepartmentParentOptions(auth.organization.id),
      listDepartmentHeadUserOptions(auth.organization.id),
    ]);
    return jsonSuccess({ items, companies, locations, parents, users });
  } catch (error) {
    return handleApiError(error);
  }
});

export const POST = withRole(
  [...DEPARTMENT_MUTATION_ROLES],
  async (request: NextRequest, auth) => {
    try {
      const input = departmentCreateSchema.parse(await request.json());
      const meta = await getRequestMeta();
      const department = await createDepartment({
        organizationId: auth.organization.id,
        input,
        actor: {
          userId: auth.user.id,
          ipAddress: meta.ipAddress,
          userAgent: meta.userAgent,
          route: request.nextUrl.pathname,
        },
      });
      return jsonSuccess(department, 201);
    } catch (error) {
      return handleApiError(error);
    }
  },
);
