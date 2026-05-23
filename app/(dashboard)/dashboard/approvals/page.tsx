import { OperationsDashboard } from "@/components/workflows/operations-dashboard";
import {
  ROLE_AUDITOR,
  ROLE_CFO,
  ROLE_EMPLOYEE,
  ROLE_FINANCE_MANAGER,
  ROLE_MANAGER,
  ROLE_ORG_ADMIN,
  ROLE_SUPER_ADMIN,
} from "@/lib/auth/constants";
import { requireDashboardAuth } from "@/lib/auth/server";
import { getOperationsDashboard } from "@/lib/workflows/queries";

export default async function ApprovalsPage() {
  const auth = await requireDashboardAuth(
    [
      ROLE_SUPER_ADMIN,
      ROLE_ORG_ADMIN,
      ROLE_MANAGER,
      ROLE_CFO,
      ROLE_FINANCE_MANAGER,
      ROLE_AUDITOR,
      ROLE_EMPLOYEE,
    ],
    "/dashboard",
  );

  const data = await getOperationsDashboard(auth.organization.id);
  return <OperationsDashboard initialData={data} />;
}
