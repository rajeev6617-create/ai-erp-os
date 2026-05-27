import { ExecutiveDashboard } from "@/components/executive-intelligence/executive-dashboard";
import { requireDashboardAuth } from "@/lib/auth/server";
import { CFO_DASHBOARD_ROLES } from "@/lib/executive-intelligence/access";
import { getExecutiveDashboard } from "@/lib/executive-intelligence/data";

export default async function CfoExecutivePage() {
  const auth = await requireDashboardAuth(CFO_DASHBOARD_ROLES, "/dashboard");
  const data = await getExecutiveDashboard(auth.organization.id, "cfo");

  return <ExecutiveDashboard data={data} />;
}
