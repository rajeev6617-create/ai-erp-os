import { ExecutiveDashboard } from "@/components/executive-intelligence/executive-dashboard";
import { requireDashboardAuth } from "@/lib/auth/server";
import { BOARD_MIS_ROLES } from "@/lib/executive-intelligence/access";
import { getExecutiveDashboard } from "@/lib/executive-intelligence/data";

export default async function BoardMisPage() {
  const auth = await requireDashboardAuth(BOARD_MIS_ROLES, "/dashboard");
  const data = await getExecutiveDashboard(auth.organization.id, "board");

  return <ExecutiveDashboard data={data} />;
}
