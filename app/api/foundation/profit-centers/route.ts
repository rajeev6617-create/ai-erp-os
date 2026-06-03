import type { NextRequest } from "next/server";
import { getRequestMeta } from "@/lib/api/request-meta";
import { handleApiError, jsonSuccess } from "@/lib/api/response";
import { ROLE_ORG_ADMIN, ROLE_SUPER_ADMIN } from "@/lib/auth/constants";
import {
  profitCenterCreateSchema,
  profitCenterListQuerySchema,
} from "@/lib/foundation/controlling-center";
import {
  listControllingCompanyOptions,
  listControllingLocationOptions,
  listControllingUserOptions,
} from "@/lib/foundation/controlling-center-service-helpers";
import {
  createProfitCenter,
  listProfitCenters,
} from "@/lib/foundation/profit-center-service";
import { withAuth, withRole } from "@/lib/middleware/with-auth";

const PROFIT_CENTER_MUTATION_ROLES = [ROLE_SUPER_ADMIN, ROLE_ORG_ADMIN] as const;

export const GET = withAuth(async (request: NextRequest, auth) => {
  try {
    const query = profitCenterListQuerySchema.parse({
      q: request.nextUrl.searchParams.get("q") ?? undefined,
      status: request.nextUrl.searchParams.get("status") ?? undefined,
      companyId: request.nextUrl.searchParams.get("companyId") ?? undefined,
      locationId: request.nextUrl.searchParams.get("locationId") ?? undefined,
    });
    const [items, companies, locations, users] = await Promise.all([
      listProfitCenters({ organizationId: auth.organization.id, query }),
      listControllingCompanyOptions(auth.organization.id),
      listControllingLocationOptions(auth.organization.id),
      listControllingUserOptions(auth.organization.id),
    ]);
    return jsonSuccess({ items, companies, locations, users });
  } catch (error) {
    return handleApiError(error);
  }
});

export const POST = withRole(
  [...PROFIT_CENTER_MUTATION_ROLES],
  async (request: NextRequest, auth) => {
    try {
      const input = profitCenterCreateSchema.parse(await request.json());
      const meta = await getRequestMeta();
      const profitCenter = await createProfitCenter({
        organizationId: auth.organization.id,
        input,
        actor: {
          userId: auth.user.id,
          ipAddress: meta.ipAddress,
          userAgent: meta.userAgent,
          route: request.nextUrl.pathname,
        },
      });
      return jsonSuccess(profitCenter, 201);
    } catch (error) {
      return handleApiError(error);
    }
  },
);
