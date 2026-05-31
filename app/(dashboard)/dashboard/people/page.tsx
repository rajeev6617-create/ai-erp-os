import { PeopleDashboard } from "@/components/people/people-dashboard";
import { ROLE_MANAGER, ROLE_ORG_ADMIN, ROLE_SUPER_ADMIN } from "@/lib/auth/constants";
import { requireDashboardAuth } from "@/lib/auth/server";
import { getPeopleDashboard } from "@/lib/people/data";

export default async function PeoplePage() {
  const auth = await requireDashboardAuth(
    [ROLE_SUPER_ADMIN, ROLE_ORG_ADMIN, ROLE_MANAGER],
    "/dashboard",
  );
  const data = await getPeopleDashboard(auth.organization.id);
  return <PeopleDashboard data={data} />;
}
