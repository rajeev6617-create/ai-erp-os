import type { NextRequest } from "next/server";
import { ROLE_ORG_ADMIN, ROLE_SUPER_ADMIN } from "@/lib/auth/constants";
import { getRequestMeta } from "@/lib/api/request-meta";
import { handleApiError, jsonSuccess } from "@/lib/api/response";
import {
  companyCreateSchema,
  companyListQuerySchema,
} from "@/lib/foundation/company";
import {
  createCompany,
  listCompanies,
} from "@/lib/foundation/company-service";
import { withAuth, withRole } from "@/lib/middleware/with-auth";

const COMPANY_MUTATION_ROLES = [ROLE_SUPER_ADMIN, ROLE_ORG_ADMIN] as const;

export const GET = withAuth(async (request: NextRequest, auth) => {
  try {
    const query = companyListQuerySchema.parse({
      q: request.nextUrl.searchParams.get("q") ?? undefined,
      status: request.nextUrl.searchParams.get("status") ?? undefined,
    });
    const items = await listCompanies({
      organizationId: auth.organization.id,
      query,
    });
    return jsonSuccess({ items });
  } catch (error) {
    return handleApiError(error);
  }
});

export const POST = withRole(
  [...COMPANY_MUTATION_ROLES],
  async (request: NextRequest, auth) => {
    try {
      const input = companyCreateSchema.parse(await request.json());
      const meta = await getRequestMeta();
      const company = await createCompany({
        organizationId: auth.organization.id,
        input,
        actor: {
          userId: auth.user.id,
          ipAddress: meta.ipAddress,
          userAgent: meta.userAgent,
          route: request.nextUrl.pathname,
        },
      });
      return jsonSuccess(company, 201);
    } catch (error) {
      return handleApiError(error);
    }
  },
);
