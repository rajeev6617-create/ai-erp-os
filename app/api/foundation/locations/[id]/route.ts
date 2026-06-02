import type { NextRequest } from "next/server";
import { ApiError } from "@/lib/api/errors";
import { getRequestMeta } from "@/lib/api/request-meta";
import { handleApiError, jsonSuccess } from "@/lib/api/response";
import { ROLE_ORG_ADMIN, ROLE_SUPER_ADMIN } from "@/lib/auth/constants";
import { locationUpdateSchema } from "@/lib/foundation/location";
import {
  deactivateLocation,
  getLocationById,
  updateLocation,
} from "@/lib/foundation/location-service";
import { withAuth, withRole } from "@/lib/middleware/with-auth";

const LOCATION_MUTATION_ROLES = [ROLE_SUPER_ADMIN, ROLE_ORG_ADMIN] as const;

function extractLocationId(pathname: string): string | null {
  const parts = pathname.split("/").filter(Boolean);
  const idx = parts.indexOf("locations");
  return idx >= 0 ? parts[idx + 1] ?? null : null;
}

export const GET = withAuth(async (request: NextRequest, auth) => {
  try {
    const id = extractLocationId(request.nextUrl.pathname);
    if (!id) {
      throw new ApiError("Missing location id", 400, "MISSING_LOCATION_ID");
    }

    const location = await getLocationById({
      organizationId: auth.organization.id,
      id,
    });
    return jsonSuccess(location);
  } catch (error) {
    return handleApiError(error);
  }
});

export const PATCH = withRole(
  [...LOCATION_MUTATION_ROLES],
  async (request: NextRequest, auth) => {
    try {
      const id = extractLocationId(request.nextUrl.pathname);
      if (!id) {
        throw new ApiError("Missing location id", 400, "MISSING_LOCATION_ID");
      }
      const input = locationUpdateSchema.parse(await request.json());
      const meta = await getRequestMeta();

      const location = await updateLocation({
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

      return jsonSuccess(location);
    } catch (error) {
      return handleApiError(error);
    }
  },
);

export const DELETE = withRole(
  [...LOCATION_MUTATION_ROLES],
  async (request: NextRequest, auth) => {
    try {
      const id = extractLocationId(request.nextUrl.pathname);
      if (!id) {
        throw new ApiError("Missing location id", 400, "MISSING_LOCATION_ID");
      }
      const meta = await getRequestMeta();

      const location = await deactivateLocation({
        organizationId: auth.organization.id,
        id,
        actor: {
          userId: auth.user.id,
          ipAddress: meta.ipAddress,
          userAgent: meta.userAgent,
          route: request.nextUrl.pathname,
        },
      });

      return jsonSuccess(location);
    } catch (error) {
      return handleApiError(error);
    }
  },
);
