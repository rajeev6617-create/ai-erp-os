import type { MisReport } from "@/lib/reports/mis";
import { buildExcelMisReport, buildPdfSummaryPlaceholder } from "@/lib/reports/mis";

export async function buildWorkflowApprovalExcelReport(params: {
  organizationId: string;
  organizationName: string;
}): Promise<MisReport> {
  return buildExcelMisReport({
    organizationId: params.organizationId,
    organizationName: params.organizationName,
    scope: "workflows",
  });
}

export async function buildWorkflowExecutivePdfPlaceholder(params: {
  organizationId: string;
  organizationName: string;
}): Promise<MisReport> {
  return buildPdfSummaryPlaceholder({
    organizationId: params.organizationId,
    organizationName: params.organizationName,
    scope: "workflows",
  });
}
