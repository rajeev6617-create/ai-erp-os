import { notFound } from "next/navigation";
import { OtcOrderToCashDashboard } from "@/components/operations/otc-order-to-cash-dashboard";
import { requireDashboardAuth } from "@/lib/auth/server";
import { OPERATIONS_DASHBOARD_ROLES } from "@/lib/operations/access";
import { getOtcOperationsDashboard } from "@/lib/operations/otc-data";

export default async function OtcOperationsPage() {
  const auth = await requireDashboardAuth(OPERATIONS_DASHBOARD_ROLES, "/dashboard");
  const data = await getOtcOperationsDashboard(auth.organization.id);

  if (!data) notFound();

  return <OtcOrderToCashDashboard data={data} />;
}
