"use client";

import { RoleDashboard } from "@/components/dashboard/role-dashboard";
import { useDashboard } from "@/components/providers/dashboard-provider";

export default function DashboardPage() {
  const { user } = useDashboard();
  return <RoleDashboard user={user} />;
}
