"use client";

import { RoleDashboard } from "@/components/dashboard/role-dashboard";
import { useDashboard } from "@/components/providers/dashboard-provider";
import type { HomeDashboardSnapshot } from "@/lib/dashboard/home";

export function HomeDashboardClient({ snapshot }: { snapshot: HomeDashboardSnapshot }) {
  const { user } = useDashboard();
  return <RoleDashboard user={user} snapshot={snapshot} />;
}
