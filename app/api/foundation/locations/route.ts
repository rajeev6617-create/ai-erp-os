import type { NextRequest } from "next/server";
import { getRequestMeta } from "@/lib/api/request-meta";
import { handleApiError, jsonSuccess } from "@/lib/api/response";
import { ROLE_ORG_ADMIN, ROLE_SUPER_ADMIN } from "@/lib/auth/constants";
import {
  locationCreateSchema,
  locationListQuerySchema,
} from "@/lib/foundation/location";
import {
  createLocation,
  listLocationCompanyOptions,
  listLocations,
} from "@/lib/foundation/location-service";
import { withAuth, withRole } from "@/lib/middleware/with-auth";

const LOCATION_MUTATION_ROLES = [ROLE_SUPER_ADMIN, ROLE_ORG_ADMIN] as const;

export const GET = withAuth(async (request: NextRequest, auth) => {
  try {
    const query = locationListQuerySchema.parse({
      q: request.nextUrl.searchParams.get("q") ?? undefined,
      status: request.nextUrl.searchParams.get("status") ?? undefined,
      locationType: request.nextUrl.searchParams.get("locationType") ?? undefined,
      companyId: request.nextUrl.searchParams.get("companyId") ?? undefined,
    });
    const [items, companies] = await Promise.all([
      listLocations({
        organizationId: auth.organization.id,
        query,
      }),
      listLocationCompanyOptions(auth.organization.id),
    ]);
    return jsonSuccess({ items, companies });
  } catch (error) {
    return handleApiError(error);
  }
});

export const POST = withRole(
  [...LOCATION_MUTATION_ROLES],
  async (request: NextRequest, auth) => {
    try {
      const input = locationCreateSchema.parse(await request.json());
      const meta = await getRequestMeta();
      const location = await createLocation({
        organizationId: auth.organization.id,
        input,
        actor: {
          userId: auth.user.id,
          ipAddress: meta.ipAddress,
          userAgent: meta.userAgent,
          route: request.nextUrl.pathname,
        },
      });
      return jsonSuccess(location, 201);
    } catch (error) {
      return handleApiError(error);
    }
  },
);
