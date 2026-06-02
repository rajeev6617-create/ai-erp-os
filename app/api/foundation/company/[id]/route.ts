import type { NextRequest } from "next/server";
import { ApiError } from "@/lib/api/errors";
import { ROLE_ORG_ADMIN, ROLE_SUPER_ADMIN } from "@/lib/auth/constants";
import { getRequestMeta } from "@/lib/api/request-meta";
import { handleApiError, jsonSuccess } from "@/lib/api/response";
import { companyUpdateSchema } from "@/lib/foundation/company";
import {
  deactivateCompany,
  getCompanyById,
  updateCompany,
} from "@/lib/foundation/company-service";
import { withAuth, withRole } from "@/lib/middleware/with-auth";

const COMPANY_MUTATION_ROLES = [ROLE_SUPER_ADMIN, ROLE_ORG_ADMIN] as const;

function extractCompanyId(pathname: string): string | null {
  const parts = pathname.split("/").filter(Boolean);
  const idx = parts.indexOf("company");
  return idx >= 0 ? parts[idx + 1] ?? null : null;
}

export const GET = withAuth(async (request: NextRequest, auth) => {
  try {
    const id = extractCompanyId(request.nextUrl.pathname);
    if (!id) {
      throw new ApiError("Missing company id", 400, "MISSING_COMPANY_ID");
    }

    const company = await getCompanyById({
      organizationId: auth.organization.id,
      id,
    });
    return jsonSuccess(company);
  } catch (error) {
    return handleApiError(error);
  }
});

export const PATCH = withRole(
  [...COMPANY_MUTATION_ROLES],
  async (request: NextRequest, auth) => {
    try {
      const id = extractCompanyId(request.nextUrl.pathname);
      if (!id) {
        throw new ApiError("Missing company id", 400, "MISSING_COMPANY_ID");
      }
      const input = companyUpdateSchema.parse(await request.json());
      const meta = await getRequestMeta();

      const company = await updateCompany({
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

      return jsonSuccess(company);
    } catch (error) {
      return handleApiError(error);
    }
  },
);

export const DELETE = withRole(
  [...COMPANY_MUTATION_ROLES],
  async (request: NextRequest, auth) => {
    try {
      const id = extractCompanyId(request.nextUrl.pathname);
      if (!id) {
        throw new ApiError("Missing company id", 400, "MISSING_COMPANY_ID");
      }
      const meta = await getRequestMeta();

      const company = await deactivateCompany({
        organizationId: auth.organization.id,
        id,
        actor: {
          userId: auth.user.id,
          ipAddress: meta.ipAddress,
          userAgent: meta.userAgent,
          route: request.nextUrl.pathname,
        },
      });

      return jsonSuccess(company);
    } catch (error) {
      return handleApiError(error);
    }
  },
);
