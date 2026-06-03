import { ControllingCenterSetupDashboard } from "@/components/foundation/controlling-center-setup-dashboard";
import { ROLE_ORG_ADMIN } from "@/lib/auth/constants";
import { requireDashboardAuth } from "@/lib/auth/server";
import {
  listControllingCompanyOptions,
  listControllingLocationOptions,
  listControllingUserOptions,
} from "@/lib/foundation/controlling-center-service-helpers";
import { listProfitCenters } from "@/lib/foundation/profit-center-service";

export default async function ProfitCentersFoundationPage() {
  const auth = await requireDashboardAuth();
  const [profitCenters, companies, locations, users] = await Promise.all([
    listProfitCenters({ organizationId: auth.organization.id }),
    listControllingCompanyOptions(auth.organization.id),
    listControllingLocationOptions(auth.organization.id),
    listControllingUserOptions(auth.organization.id),
  ]);

  return (
    <ControllingCenterSetupDashboard
      kind="profit"
      initialCenters={profitCenters}
      initialCompanies={companies}
      initialLocations={locations}
      initialUsers={users}
      canManage={auth.isSuperAdmin || auth.roles.includes(ROLE_ORG_ADMIN)}
      organizationName={auth.organization.name}
    />
  );
}
