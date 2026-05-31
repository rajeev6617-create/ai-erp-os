import { InventoryWarehouseDashboard } from "@/components/operations/inventory-warehouse-dashboard";
import { requireDashboardAuth } from "@/lib/auth/server";
import { getInventoryWarehouseOperationsData } from "@/lib/operations/inventory-warehouse-data";
import { INVENTORY_DASHBOARD_ROLES } from "@/lib/supply-chain/access";

export default async function InventoryOperationsPage() {
  await requireDashboardAuth(INVENTORY_DASHBOARD_ROLES, "/dashboard");
  const data = getInventoryWarehouseOperationsData();

  return <InventoryWarehouseDashboard data={data} view="inventory" />;
}
