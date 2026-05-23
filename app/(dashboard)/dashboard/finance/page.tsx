import { FinanceDashboard } from "@/components/dashboard/finance-dashboard";
import {
  ROLE_AUDITOR,
  ROLE_CFO,
  ROLE_FINANCE_MANAGER,
  ROLE_MANAGER,
  ROLE_ORG_ADMIN,
  ROLE_SUPER_ADMIN,
} from "@/lib/auth/constants";
import { requireDashboardAuth } from "@/lib/auth/server";
import { getFinanceDashboard } from "@/lib/dashboard/finance";

export default async function FinancePage() {
  const auth = await requireDashboardAuth(
    [
      ROLE_SUPER_ADMIN,
      ROLE_ORG_ADMIN,
      ROLE_MANAGER,
      ROLE_CFO,
      ROLE_FINANCE_MANAGER,
      ROLE_AUDITOR,
    ],
    "/dashboard",
  );

  const data = await getFinanceDashboard(auth.organization.id);
  return <FinanceDashboard data={data} />;
}
