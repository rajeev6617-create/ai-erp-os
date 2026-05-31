import { OperationsCommandCenterDashboard } from "@/components/operations/operations-command-center-dashboard";
import { requireDashboardAuth } from "@/lib/auth/server";
import { OPERATIONS_DASHBOARD_ROLES } from "@/lib/operations/access";
import { getOperationsCommandCenterData } from "@/lib/operations/command-center-data";

export default async function OperationsPage() {
  const auth = await requireDashboardAuth(OPERATIONS_DASHBOARD_ROLES, "/dashboard");
  const data = await getOperationsCommandCenterData(auth.organization.id);

  return <OperationsCommandCenterDashboard data={data} />;
}
