import type { NextRequest } from "next/server";
import { getRequestMeta } from "@/lib/api/request-meta";
import { handleApiError, jsonSuccess } from "@/lib/api/response";
import { ROLE_ORG_ADMIN, ROLE_SUPER_ADMIN } from "@/lib/auth/constants";
import {
  costCenterCreateSchema,
  costCenterListQuerySchema,
} from "@/lib/foundation/controlling-center";
import {
  listControllingCompanyOptions,
  listControllingDepartmentOptions,
  listControllingLocationOptions,
  listControllingUserOptions,
} from "@/lib/foundation/controlling-center-service-helpers";
import {
  createCostCenter,
  listCostCenters,
} from "@/lib/foundation/cost-center-service";
import { withAuth, withRole } from "@/lib/middleware/with-auth";

const COST_CENTER_MUTATION_ROLES = [ROLE_SUPER_ADMIN, ROLE_ORG_ADMIN] as const;

export const GET = withAuth(async (request: NextRequest, auth) => {
  try {
    const query = costCenterListQuerySchema.parse({
      q: request.nextUrl.searchParams.get("q") ?? undefined,
      status: request.nextUrl.searchParams.get("status") ?? undefined,
      costCenterType:
        request.nextUrl.searchParams.get("costCenterType") ?? undefined,
      companyId: request.nextUrl.searchParams.get("companyId") ?? undefined,
      locationId: request.nextUrl.searchParams.get("locationId") ?? undefined,
      departmentId:
        request.nextUrl.searchParams.get("departmentId") ?? undefined,
    });
    const [items, companies, locations, departments, users] = await Promise.all([
      listCostCenters({ organizationId: auth.organization.id, query }),
      listControllingCompanyOptions(auth.organization.id),
      listControllingLocationOptions(auth.organization.id),
      listControllingDepartmentOptions(auth.organization.id),
      listControllingUserOptions(auth.organization.id),
    ]);
    return jsonSuccess({ items, companies, locations, departments, users });
  } catch (error) {
    return handleApiError(error);
  }
});

export const POST = withRole(
  [...COST_CENTER_MUTATION_ROLES],
  async (request: NextRequest, auth) => {
    try {
      const input = costCenterCreateSchema.parse(await request.json());
      const meta = await getRequestMeta();
      const costCenter = await createCostCenter({
        organizationId: auth.organization.id,
        input,
        actor: {
          userId: auth.user.id,
          ipAddress: meta.ipAddress,
          userAgent: meta.userAgent,
          route: request.nextUrl.pathname,
        },
      });
      return jsonSuccess(costCenter, 201);
    } catch (error) {
      return handleApiError(error);
    }
  },
);
