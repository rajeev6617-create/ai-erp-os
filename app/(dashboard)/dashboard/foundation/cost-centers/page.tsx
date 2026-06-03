import { ControllingCenterSetupDashboard } from "@/components/foundation/controlling-center-setup-dashboard";
import { ROLE_ORG_ADMIN } from "@/lib/auth/constants";
import { requireDashboardAuth } from "@/lib/auth/server";
import {
  listControllingCompanyOptions,
  listControllingDepartmentOptions,
  listControllingLocationOptions,
  listControllingUserOptions,
} from "@/lib/foundation/controlling-center-service-helpers";
import { listCostCenters } from "@/lib/foundation/cost-center-service";

export default async function CostCentersFoundationPage() {
  const auth = await requireDashboardAuth();
  const [costCenters, companies, locations, departments, users] =
    await Promise.all([
      listCostCenters({ organizationId: auth.organization.id }),
      listControllingCompanyOptions(auth.organization.id),
      listControllingLocationOptions(auth.organization.id),
      listControllingDepartmentOptions(auth.organization.id),
      listControllingUserOptions(auth.organization.id),
    ]);

  return (
    <ControllingCenterSetupDashboard
      kind="cost"
      initialCenters={costCenters}
      initialCompanies={companies}
      initialLocations={locations}
      initialDepartments={departments}
      initialUsers={users}
      canManage={auth.isSuperAdmin || auth.roles.includes(ROLE_ORG_ADMIN)}
      organizationName={auth.organization.name}
    />
  );
}
