import { AiDashboard } from "@/components/dashboard/ai-dashboard";
import {
  ROLE_AI_AGENT,
  ROLE_MANAGER,
  ROLE_ORG_ADMIN,
  ROLE_SUPER_ADMIN,
} from "@/lib/auth/constants";
import { requireDashboardAuth } from "@/lib/auth/server";
import { getAiDashboard } from "@/lib/dashboard/ai";

export default async function AiPage() {
  const auth = await requireDashboardAuth(
    [ROLE_SUPER_ADMIN, ROLE_ORG_ADMIN, ROLE_MANAGER, ROLE_AI_AGENT],
    "/dashboard",
  );

  const data = await getAiDashboard(auth.organization.id, auth.user.id);
  return <AiDashboard data={data} />;
}
