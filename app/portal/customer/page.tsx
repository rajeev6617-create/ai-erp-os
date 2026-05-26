import { notFound } from "next/navigation";
import { CustomerPortalDashboard } from "@/components/relationships/portal-dashboard";
import { getCustomerPortalDashboard } from "@/lib/relationships/data";
import { requirePortalAuth } from "@/lib/relationships/portal-auth";

export default async function CustomerPortalPage() {
  const auth = await requirePortalAuth("CUSTOMER");
  if (!auth.account.customerId) notFound();

  const data = await getCustomerPortalDashboard(auth.organization.id, auth.account.customerId);
  if (!data) notFound();

  return <CustomerPortalDashboard data={data} />;
}
