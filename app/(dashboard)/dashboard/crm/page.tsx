import { CrmDashboard } from "@/components/relationships/relationship-dashboard";
import { requireDashboardAuth } from "@/lib/auth/server";
import { CRM_DASHBOARD_ROLES } from "@/lib/relationships/access";
import { getCrmDashboard } from "@/lib/relationships/data";

export default async function CrmPage() {
  const auth = await requireDashboardAuth(CRM_DASHBOARD_ROLES, "/dashboard");
  const data = await getCrmDashboard(auth.organization.id);

  return <CrmDashboard data={data} />;
}
