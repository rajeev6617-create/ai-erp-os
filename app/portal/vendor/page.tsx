import { notFound } from "next/navigation";
import { VendorPortalDashboard } from "@/components/relationships/portal-dashboard";
import { getVendorPortalDashboard } from "@/lib/relationships/data";
import { requirePortalAuth } from "@/lib/relationships/portal-auth";

export default async function VendorPortalPage() {
  const auth = await requirePortalAuth("VENDOR");
  if (!auth.account.vendorId) notFound();

  const data = await getVendorPortalDashboard(auth.organization.id, auth.account.vendorId);
  if (!data) notFound();

  return <VendorPortalDashboard data={data} />;
}
