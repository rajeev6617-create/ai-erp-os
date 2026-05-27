import { InventoryDashboard } from "@/components/supply-chain/supply-chain-dashboard";
import { requireDashboardAuth } from "@/lib/auth/server";
import { INVENTORY_DASHBOARD_ROLES } from "@/lib/supply-chain/access";
import { getInventoryDashboard } from "@/lib/supply-chain/data";

export default async function InventoryPage() {
  const auth = await requireDashboardAuth(INVENTORY_DASHBOARD_ROLES, "/dashboard");
  const data = await getInventoryDashboard(auth.organization.id);

  return <InventoryDashboard data={data} />;
}
