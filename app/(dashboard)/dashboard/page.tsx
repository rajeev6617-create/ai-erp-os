import { HomeDashboardClient } from "@/app/(dashboard)/dashboard/home-dashboard-client";
import { requireDashboardAuth } from "@/lib/auth/server";
import { getHomeDashboardSnapshot } from "@/lib/dashboard/home";

export default async function DashboardPage() {
  const auth = await requireDashboardAuth();
  const snapshot = await getHomeDashboardSnapshot(auth.organization.id);
  return <HomeDashboardClient snapshot={snapshot} />;
}
