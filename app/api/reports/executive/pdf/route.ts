import type { NextRequest } from "next/server";
import { getRequestMeta } from "@/lib/api/request-meta";
import { handleApiError } from "@/lib/api/response";
import { withAuth } from "@/lib/middleware/with-auth";
import { auditReportDelivery } from "@/lib/notifications/service";
import { buildPdfSummaryPlaceholder } from "@/lib/reports/mis";

export const GET = withAuth(async (request: NextRequest, auth) => {
  try {
    const meta = await getRequestMeta();
    const report = await buildPdfSummaryPlaceholder({
      organizationId: auth.organization.id,
      organizationName: auth.organization.name,
      scope: "all",
    });

    await auditReportDelivery({
      organizationId: auth.organization.id,
      actorUserId: auth.user.id,
      reportType: "pdf_summary_placeholder",
      scope: "executive",
      fileName: report.fileName,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
      metadata: {
        route: request.nextUrl.pathname,
        placeholder: true,
        reportDomain: "executive_summary",
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
