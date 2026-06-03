import type { NextRequest } from "next/server";
import { ApiError } from "@/lib/api/errors";
import { getRequestMeta } from "@/lib/api/request-meta";
import { handleApiError, jsonSuccess } from "@/lib/api/response";
import { ROLE_ORG_ADMIN, ROLE_SUPER_ADMIN } from "@/lib/auth/constants";
import { costCenterUpdateSchema } from "@/lib/foundation/controlling-center";
import {
  deactivateCostCenter,
  getCostCenterById,
  updateCostCenter,
} from "@/lib/foundation/cost-center-service";
import { withAuth, withRole } from "@/lib/middleware/with-auth";

const COST_CENTER_MUTATION_ROLES = [ROLE_SUPER_ADMIN, ROLE_ORG_ADMIN] as const;

function extractCostCenterId(pathname: string): string | null {
  const parts = pathname.split("/").filter(Boolean);
  const idx = parts.indexOf("cost-centers");
  return idx >= 0 ? parts[idx + 1] ?? null : null;
}

export const GET = withAuth(async (request: NextRequest, auth) => {
  try {
    const id = extractCostCenterId(request.nextUrl.pathname);
    if (!id) {
      throw new ApiError("Missing cost center id", 400, "MISSING_COST_CENTER_ID");
    }
    return jsonSuccess(
      await getCostCenterById({ organizationId: auth.organization.id, id }),
    );
  } catch (error) {
    return handleApiError(error);
  }
});

export const PATCH = withRole(
  [...COST_CENTER_MUTATION_ROLES],
  async (request: NextRequest, auth) => {
    try {
      const id = extractCostCenterId(request.nextUrl.pathname);
      if (!id) {
        throw new ApiError(
          "Missing cost center id",
          400,
          "MISSING_COST_CENTER_ID",
        );
      }
      const input = costCenterUpdateSchema.parse(await request.json());
      const meta = await getRequestMeta();
      return jsonSuccess(
        await updateCostCenter({
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
  [...COST_CENTER_MUTATION_ROLES],
  async (request: NextRequest, auth) => {
    try {
      const id = extractCostCenterId(request.nextUrl.pathname);
      if (!id) {
        throw new ApiError(
          "Missing cost center id",
          400,
          "MISSING_COST_CENTER_ID",
        );
      }
      const meta = await getRequestMeta();
      return jsonSuccess(
        await deactivateCostCenter({
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
