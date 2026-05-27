import { getCrmDashboard } from "@/lib/relationships/data";
import type { CrmDashboardData } from "@/lib/relationships/types";
import { getOperationModuleDashboard } from "@/lib/operations/data";
import type { OperationModuleDashboardData } from "@/lib/operations/types";

export interface OtcOperationsDashboardData {
  operations: OperationModuleDashboardData;
  crm: CrmDashboardData;
}

export async function getOtcOperationsDashboard(
  organizationId: string,
): Promise<OtcOperationsDashboardData | null> {
  const [operations, crm] = await Promise.all([
    getOperationModuleDashboard(organizationId, "otc"),
    getCrmDashboard(organizationId),
  ]);

  if (!operations) return null;

  return {
    operations,
    crm,
  };
}
