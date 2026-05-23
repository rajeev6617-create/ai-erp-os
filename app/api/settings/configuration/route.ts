import type { NextRequest } from "next/server";
import { getRequestMeta } from "@/lib/api/request-meta";
import { handleApiError, jsonSuccess } from "@/lib/api/response";
import {
  ADMIN_SETTINGS_ROLES,
  applyConfigurationMutation,
  configurationMutationSchema,
  getConfigurationDashboard,
} from "@/lib/configuration/engine";
import { withRole } from "@/lib/middleware/with-auth";

export const GET = withRole([...ADMIN_SETTINGS_ROLES], async (_request: NextRequest, auth) => {
  try {
    const data = await getConfigurationDashboard({
      organizationId: auth.organization.id,
      userId: auth.user.id,
    });
    return jsonSuccess(data);
  } catch (error) {
    return handleApiError(error);
  }
});

export const PATCH = withRole([...ADMIN_SETTINGS_ROLES], async (request: NextRequest, auth) => {
  try {
    const input = configurationMutationSchema.parse(await request.json());
    const meta = await getRequestMeta();
    const result = await applyConfigurationMutation({
      organizationId: auth.organization.id,
      actorUserId: auth.user.id,
      input,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });
    return jsonSuccess(result);
  } catch (error) {
    return handleApiError(error);
  }
});
