import { DepartmentSetupDashboard } from "@/components/foundation/department-setup-dashboard";
import { ROLE_ORG_ADMIN } from "@/lib/auth/constants";
import { requireDashboardAuth } from "@/lib/auth/server";
import {
  listDepartmentCompanyOptions,
  listDepartmentHeadUserOptions,
  listDepartmentLocationOptions,
  listDepartmentParentOptions,
  listDepartments,
} from "@/lib/foundation/department-service";

export default async function DepartmentsFoundationPage() {
  const auth = await requireDashboardAuth();
  const [departments, companies, locations, parents, users] = await Promise.all([
    listDepartments({ organizationId: auth.organization.id }),
    listDepartmentCompanyOptions(auth.organization.id),
    listDepartmentLocationOptions(auth.organization.id),
    listDepartmentParentOptions(auth.organization.id),
    listDepartmentHeadUserOptions(auth.organization.id),
  ]);

  const canManage =
    auth.isSuperAdmin || auth.roles.includes(ROLE_ORG_ADMIN);

  return (
    <DepartmentSetupDashboard
      initialDepartments={departments}
      initialCompanies={companies}
      initialLocations={locations}
      initialParents={parents}
      initialUsers={users}
      canManage={canManage}
      organizationName={auth.organization.name}
    />
  );
}
