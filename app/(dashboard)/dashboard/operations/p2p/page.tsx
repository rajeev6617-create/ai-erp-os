import { notFound } from "next/navigation";
import { P2pProcureToPayDashboard } from "@/components/operations/p2p-procure-to-pay-dashboard";
import { requireDashboardAuth } from "@/lib/auth/server";
import { OPERATIONS_DASHBOARD_ROLES } from "@/lib/operations/access";
import { getOperationModuleDashboard } from "@/lib/operations/data";

export default async function P2pOperationsPage() {
  const auth = await requireDashboardAuth(OPERATIONS_DASHBOARD_ROLES, "/dashboard");
  const data = await getOperationModuleDashboard(auth.organization.id, "p2p");

  if (!data) notFound();

  return <P2pProcureToPayDashboard data={data} />;
}
