import { ProductionDashboard } from "@/components/supply-chain/supply-chain-dashboard";
import { requireDashboardAuth } from "@/lib/auth/server";
import { PRODUCTION_DASHBOARD_ROLES } from "@/lib/supply-chain/access";
import { getProductionDashboard } from "@/lib/supply-chain/data";

export default async function ProductionPage() {
  const auth = await requireDashboardAuth(PRODUCTION_DASHBOARD_ROLES, "/dashboard");
  const data = await getProductionDashboard(auth.organization.id);

  return <ProductionDashboard data={data} />;
}
