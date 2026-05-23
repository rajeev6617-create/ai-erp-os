import type { NextRequest } from "next/server";
import { z } from "zod";
import { getRequestMeta } from "@/lib/api/request-meta";
import { handleApiError } from "@/lib/api/response";
import { withAuth } from "@/lib/middleware/with-auth";
import { auditReportDelivery } from "@/lib/notifications/service";
import { buildExcelMisReport } from "@/lib/reports/mis";

const scopeSchema = z.enum(["workflows", "finance", "all"]);

export const GET = withAuth(async (request: NextRequest, auth) => {
  try {
    const scope = scopeSchema.parse(request.nextUrl.searchParams.get("scope") ?? "all");
    const meta = await getRequestMeta();
    const report = await buildExcelMisReport({
      organizationId: auth.organization.id,
      organizationName: auth.organization.name,
      scope,
    });

    await auditReportDelivery({
      organizationId: auth.organization.id,
      actorUserId: auth.user.id,
      reportType: "excel_mis",
      scope,
      fileName: report.fileName,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
      metadata: { route: request.nextUrl.pathname },
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
