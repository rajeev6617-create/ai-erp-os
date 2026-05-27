import { ExecutiveDashboard } from "@/components/executive-intelligence/executive-dashboard";
import { requireDashboardAuth } from "@/lib/auth/server";
import { CEO_DASHBOARD_ROLES } from "@/lib/executive-intelligence/access";
import { getExecutiveDashboard } from "@/lib/executive-intelligence/data";

export default async function CeoExecutivePage() {
  const auth = await requireDashboardAuth(CEO_DASHBOARD_ROLES, "/dashboard");
  const data = await getExecutiveDashboard(auth.organization.id, "ceo");

  return <ExecutiveDashboard data={data} />;
}
