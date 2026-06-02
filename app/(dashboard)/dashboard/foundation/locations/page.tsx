import { LocationSetupDashboard } from "@/components/foundation/location-setup-dashboard";
import { ROLE_ORG_ADMIN } from "@/lib/auth/constants";
import { requireDashboardAuth } from "@/lib/auth/server";
import {
  listLocationCompanyOptions,
  listLocations,
} from "@/lib/foundation/location-service";

export default async function LocationsFoundationPage() {
  const auth = await requireDashboardAuth();
  const [initialLocations, initialCompanies] = await Promise.all([
    listLocations({ organizationId: auth.organization.id }),
    listLocationCompanyOptions(auth.organization.id),
  ]);

  const canManage =
    auth.isSuperAdmin || auth.roles.includes(ROLE_ORG_ADMIN);

  return (
    <LocationSetupDashboard
      initialLocations={initialLocations}
      initialCompanies={initialCompanies}
      canManage={canManage}
      organizationName={auth.organization.name}
    />
  );
}
