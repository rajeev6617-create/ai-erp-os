import { CrmOperationsPortalDashboard } from "@/components/operations/relationship-portal-foundation-dashboard";
import { requireDashboardAuth } from "@/lib/auth/server";
import { OPERATIONS_DASHBOARD_ROLES } from "@/lib/operations/access";
import { getCrmOperationsPortalData } from "@/lib/operations/relationship-portal-data";

export default async function CrmOperationsPage() {
  const auth = await requireDashboardAuth(OPERATIONS_DASHBOARD_ROLES, "/dashboard");
  const data = await getCrmOperationsPortalData(auth.organization.id);

  return <CrmOperationsPortalDashboard data={data} />;
}
