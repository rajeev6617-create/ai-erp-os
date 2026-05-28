import { getOperationModuleDashboard } from "@/lib/operations/data";
import type { OperationModuleDashboardData } from "@/lib/operations/types";
import { getCrmDashboard, getSrmDashboard } from "@/lib/relationships/data";
import type { CrmDashboardData, SrmDashboardData } from "@/lib/relationships/types";

export interface CrmOperationsPortalData {
  crm: CrmDashboardData;
  operations: OperationModuleDashboardData | null;
}

export interface SrmOperationsPortalData {
  srm: SrmDashboardData;
  operations: OperationModuleDashboardData | null;
}

export async function getCrmOperationsPortalData(
  organizationId: string,
): Promise<CrmOperationsPortalData> {
  const [crm, operations] = await Promise.all([
    getCrmDashboard(organizationId),
    getOperationModuleDashboard(organizationId, "otc"),
  ]);

  return { crm, operations };
}

export async function getSrmOperationsPortalData(
  organizationId: string,
): Promise<SrmOperationsPortalData> {
  const [srm, operations] = await Promise.all([
    getSrmDashboard(organizationId),
    getOperationModuleDashboard(organizationId, "p2p"),
  ]);

  return { srm, operations };
}
