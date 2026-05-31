import { IntegrationsDashboard } from "@/components/integrations/integrations-dashboard";
import { ROLE_ORG_ADMIN, ROLE_SUPER_ADMIN } from "@/lib/auth/constants";
import { requireDashboardAuth } from "@/lib/auth/server";
import { getIntegrationsDashboard } from "@/lib/integrations/data";

export default async function IntegrationsPage() {
  const auth = await requireDashboardAuth(
    [ROLE_SUPER_ADMIN, ROLE_ORG_ADMIN],
    "/dashboard",
  );
  const data = await getIntegrationsDashboard(auth.organization.id);
  return <IntegrationsDashboard data={data} />;
}
