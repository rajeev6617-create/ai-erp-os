import type { NextRequest } from "next/server";
import { ApiError } from "@/lib/api/errors";
import { getRequestMeta } from "@/lib/api/request-meta";
import { handleApiError, jsonSuccess } from "@/lib/api/response";
import { ROLE_ORG_ADMIN, ROLE_SUPER_ADMIN } from "@/lib/auth/constants";
import { profitCenterUpdateSchema } from "@/lib/foundation/controlling-center";
import {
  deactivateProfitCenter,
  getProfitCenterById,
  updateProfitCenter,
} from "@/lib/foundation/profit-center-service";
import { withAuth, withRole } from "@/lib/middleware/with-auth";

const PROFIT_CENTER_MUTATION_ROLES = [ROLE_SUPER_ADMIN, ROLE_ORG_ADMIN] as const;

function extractProfitCenterId(pathname: string): string | null {
  const parts = pathname.split("/").filter(Boolean);
  const idx = parts.indexOf("profit-centers");
  return idx >= 0 ? parts[idx + 1] ?? null : null;
}

export const GET = withAuth(async (request: NextRequest, auth) => {
  try {
    const id = extractProfitCenterId(request.nextUrl.pathname);
    if (!id) {
      throw new ApiError(
        "Missing profit center id",
        400,
        "MISSING_PROFIT_CENTER_ID",
      );
    }
    return jsonSuccess(
      await getProfitCenterById({ organizationId: auth.organization.id, id }),
    );
  } catch (error) {
    return handleApiError(error);
  }
});

export const PATCH = withRole(
  [...PROFIT_CENTER_MUTATION_ROLES],
  async (request: NextRequest, auth) => {
    try {
      const id = extractProfitCenterId(request.nextUrl.pathname);
      if (!id) {
        throw new ApiError(
          "Missing profit center id",
          400,
          "MISSING_PROFIT_CENTER_ID",
        );
      }
      const input = profitCenterUpdateSchema.parse(await request.json());
      const meta = await getRequestMeta();
      return jsonSuccess(
        await updateProfitCenter({
          organizationId: auth.organization.id,
          id,
          input,
          actor: {
            userId: auth.user.id,
            ipAddress: meta.ipAddress,
            userAgent: meta.userAgent,
            route: request.nextUrl.pathname,
          },
        }),
      );
    } catch (error) {
      return handleApiError(error);
    }
  },
);

export const DELETE = withRole(
  [...PROFIT_CENTER_MUTATION_ROLES],
  async (request: NextRequest, auth) => {
    try {
      const id = extractProfitCenterId(request.nextUrl.pathname);
      if (!id) {
        throw new ApiError(
          "Missing profit center id",
          400,
          "MISSING_PROFIT_CENTER_ID",
        );
      }
      const meta = await getRequestMeta();
      return jsonSuccess(
        await deactivateProfitCenter({
          organizationId: auth.organization.id,
          id,
          actor: {
            userId: auth.user.id,
            ipAddress: meta.ipAddress,
            userAgent: meta.userAgent,
            route: request.nextUrl.pathname,
          },
        }),
      );
    } catch (error) {
      return handleApiError(error);
    }
  },
);
