"use client";

import { useState } from "react";
import { DemoBanner } from "@/components/layout/demo-banner";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import {
  DashboardProvider,
  useDashboard,
  type DashboardSession,
} from "@/components/providers/dashboard-provider";
import type { DemoModeInfo } from "@/lib/demo/mode";

function ShellInner({
  children,
  demo,
}: {
  children: React.ReactNode;
  demo: DemoModeInfo;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, role, availableRoles, setRole } = useDashboard();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar
        roles={[role]}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <Header
          user={user}
          availableRoles={availableRoles}
          onMenuClick={() => setSidebarOpen(true)}
          onRoleChange={setRole}
        />
        <DemoBanner demo={demo} />
        <main className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

export function DashboardShell({
  children,
  session,
  demo,
}: {
  children: React.ReactNode;
  session: DashboardSession;
  demo: DemoModeInfo;
}) {
  return (
    <DashboardProvider session={session}>
      <ShellInner demo={demo}>{children}</ShellInner>
    </DashboardProvider>
  );
}
