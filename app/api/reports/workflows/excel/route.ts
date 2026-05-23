import type { NextRequest } from "next/server";
import { getRequestMeta } from "@/lib/api/request-meta";
import { handleApiError } from "@/lib/api/response";
import { withAuth } from "@/lib/middleware/with-auth";
import { auditReportDelivery } from "@/lib/notifications/service";
import { buildWorkflowApprovalExcelReport } from "@/lib/reports/workflows";

export const GET = withAuth(async (request: NextRequest, auth) => {
  try {
    const meta = await getRequestMeta();
    const report = await buildWorkflowApprovalExcelReport({
      organizationId: auth.organization.id,
      organizationName: auth.organization.name,
    });

    await auditReportDelivery({
      organizationId: auth.organization.id,
      actorUserId: auth.user.id,
      reportType: "excel_mis",
      scope: "workflows",
      fileName: report.fileName,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
      metadata: {
        route: request.nextUrl.pathname,
        reportDomain: "workflow_approvals",
      },
    });

    return new Response(report.body, {
      status: 200,
      headers: {
        "Content-Type": report.contentType,
        "Content-Disposition": `attachment; filename="${report.fileName}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
});
