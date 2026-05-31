import { DocumentsDashboard } from "@/components/documents/documents-dashboard";
import { requireDashboardAuth } from "@/lib/auth/server";
import { getDocumentsDashboard } from "@/lib/documents/data";

export default async function DocumentsPage() {
  const auth = await requireDashboardAuth();
  const data = await getDocumentsDashboard(auth.organization.id);
  return <DocumentsDashboard data={data} />;
}
