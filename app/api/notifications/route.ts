import type { NextRequest } from "next/server";
import { z } from "zod";
import { getRequestMeta } from "@/lib/api/request-meta";
import { handleApiError, jsonSuccess } from "@/lib/api/response";
import { writeAuditLog } from "@/lib/auth/audit";
import { withAuth } from "@/lib/middleware/with-auth";
import {
  getNotificationCenter,
  markNotificationsRead,
} from "@/lib/notifications/queries";

const markReadSchema = z.object({
  ids: z.array(z.string().cuid()).optional(),
});

export const GET = withAuth(async (request: NextRequest, auth) => {
  try {
    const take = Number(request.nextUrl.searchParams.get("take") ?? 20);
    return jsonSuccess(
      await getNotificationCenter({
        organizationId: auth.organization.id,
        userId: auth.user.id,
        take,
      }),
    );
  } catch (error) {
    return handleApiError(error);
  }
});

export const PATCH = withAuth(async (request: NextRequest, auth) => {
  try {
    const body = markReadSchema.parse(await request.json());
    const meta = await getRequestMeta();
    const result = await markNotificationsRead({
      organizationId: auth.organization.id,
      userId: auth.user.id,
      notificationIds: body.ids,
    });

    await writeAuditLog({
      organizationId: auth.organization.id,
      userId: auth.user.id,
      action: "notification.mark_read",
      resource: "notification",
      severity: "INFO",
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
      after: { updated: result.updated, ids: body.ids ?? "all" },
      metadata: { source: "notification_center" },
    });

    return jsonSuccess(result);
  } catch (error) {
    return handleApiError(error);
  }
});
