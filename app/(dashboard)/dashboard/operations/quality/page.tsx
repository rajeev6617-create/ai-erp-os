import { ProductionQualityDashboard } from "@/components/operations/production-quality-dashboard";
import { requireDashboardAuth } from "@/lib/auth/server";
import { getProductionQualityOperationsData } from "@/lib/operations/production-quality-data";
import { PRODUCTION_DASHBOARD_ROLES } from "@/lib/supply-chain/access";

export default async function QualityOperationsPage() {
  await requireDashboardAuth(PRODUCTION_DASHBOARD_ROLES, "/dashboard");
  const data = getProductionQualityOperationsData();

  return <ProductionQualityDashboard data={data} view="quality" />;
}
