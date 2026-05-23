import type { NextRequest } from "next/server";
import { z } from "zod";
import { getRequestMeta } from "@/lib/api/request-meta";
import { handleApiError, jsonSuccess } from "@/lib/api/response";
import { withAuth } from "@/lib/middleware/with-auth";
import { sendApprovalReminder } from "@/lib/notifications/reminders";

const reminderSchema = z.object({
  approvalId: z.string().cuid().optional(),
});

export const POST = withAuth(async (request: NextRequest, auth) => {
  try {
    const body = reminderSchema.parse(await request.json().catch(() => ({})));
    const meta = await getRequestMeta();
    const actorName =
      [auth.user.firstName, auth.user.lastName].filter(Boolean).join(" ") ||
      auth.user.email;

    const result = await sendApprovalReminder({
      organizationId: auth.organization.id,
      actorUserId: auth.user.id,
      actorName,
      scope: "workflows",
      approvalId: body.approvalId,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    return jsonSuccess(result);
  } catch (error) {
    return handleApiError(error);
  }
});
