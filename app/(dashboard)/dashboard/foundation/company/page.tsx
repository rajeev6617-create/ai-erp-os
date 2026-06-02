import { CompanySetupDashboard } from "@/components/foundation/company-setup-dashboard";
import { ROLE_ORG_ADMIN } from "@/lib/auth/constants";
import { requireDashboardAuth } from "@/lib/auth/server";
import { listCompanies } from "@/lib/foundation/company-service";

export default async function CompanyFoundationPage() {
  const auth = await requireDashboardAuth();
  const initialCompanies = await listCompanies({
    organizationId: auth.organization.id,
  });

  const canManage =
    auth.isSuperAdmin || auth.roles.includes(ROLE_ORG_ADMIN);

  return (
    <CompanySetupDashboard
      initialCompanies={initialCompanies}
      canManage={canManage}
      organizationName={auth.organization.name}
    />
  );
}
