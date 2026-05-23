import { withAuthJson } from "@/lib/middleware/with-auth";
import { getOperationsDashboard } from "@/lib/workflows/queries";

export const GET = withAuthJson(async (_req, auth) => {
  return getOperationsDashboard(auth.organization.id);
});
