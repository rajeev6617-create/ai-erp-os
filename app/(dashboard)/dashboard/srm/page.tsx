import { SrmDashboard } from "@/components/relationships/relationship-dashboard";
import { requireDashboardAuth } from "@/lib/auth/server";
import { SRM_DASHBOARD_ROLES } from "@/lib/relationships/access";
import { getSrmDashboard } from "@/lib/relationships/data";

export default async function SrmPage() {
  const auth = await requireDashboardAuth(SRM_DASHBOARD_ROLES, "/dashboard");
  const data = await getSrmDashboard(auth.organization.id);

  return <SrmDashboard data={data} />;
}
