import { SrmOperationsPortalDashboard } from "@/components/operations/relationship-portal-foundation-dashboard";
import { requireDashboardAuth } from "@/lib/auth/server";
import { OPERATIONS_DASHBOARD_ROLES } from "@/lib/operations/access";
import { getSrmOperationsPortalData } from "@/lib/operations/relationship-portal-data";

export default async function SrmOperationsPage() {
  const auth = await requireDashboardAuth(OPERATIONS_DASHBOARD_ROLES, "/dashboard");
  const data = await getSrmOperationsPortalData(auth.organization.id);

  return <SrmOperationsPortalDashboard data={data} />;
}
