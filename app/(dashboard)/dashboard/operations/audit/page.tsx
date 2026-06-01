import { ComplianceAuditDashboard } from "@/components/operations/compliance-audit-dashboard";
import { requireDashboardAuth } from "@/lib/auth/server";
import { OPERATIONS_DASHBOARD_ROLES } from "@/lib/operations/access";
import { getComplianceAuditOperationsData } from "@/lib/operations/compliance-audit-data";

export default async function AuditOperationsPage() {
  const auth = await requireDashboardAuth(OPERATIONS_DASHBOARD_ROLES, "/dashboard");
  const data = await getComplianceAuditOperationsData(auth.organization.id);

  return <ComplianceAuditDashboard data={data} view="audit" />;
}
