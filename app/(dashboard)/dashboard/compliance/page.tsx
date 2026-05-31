import { ComplianceDashboard } from "@/components/compliance/compliance-dashboard";
import {
  ROLE_AUDITOR,
  ROLE_CFO,
  ROLE_FINANCE_MANAGER,
  ROLE_MANAGER,
  ROLE_ORG_ADMIN,
  ROLE_SUPER_ADMIN,
} from "@/lib/auth/constants";
import { requireDashboardAuth } from "@/lib/auth/server";
import { getComplianceDashboard } from "@/lib/compliance/data";

export default async function CompliancePage() {
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

  const data = await getComplianceDashboard(auth.organization.id);
  return <ComplianceDashboard data={data} />;
}
