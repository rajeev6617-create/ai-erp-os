import { OrganizationDashboard } from "@/components/organization/organization-dashboard";
import { ROLE_ORG_ADMIN, ROLE_SUPER_ADMIN } from "@/lib/auth/constants";
import { requireDashboardAuth } from "@/lib/auth/server";
import { getOrganizationDashboard } from "@/lib/organization/data";

export default async function OrganizationPage() {
  const auth = await requireDashboardAuth(
    [ROLE_SUPER_ADMIN, ROLE_ORG_ADMIN],
    "/dashboard",
  );
  const data = await getOrganizationDashboard(auth.organization.id);
  return <OrganizationDashboard data={data} />;
}
