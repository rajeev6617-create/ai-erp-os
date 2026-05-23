import { DashboardShell } from "@/components/layout/dashboard-shell";
import { requireDashboardAuth } from "@/lib/auth/server";
import { getDemoModeInfo } from "@/lib/demo/mode";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = await requireDashboardAuth();

  return (
    <DashboardShell
      demo={getDemoModeInfo()}
      session={{
        user: auth.user,
        organization: auth.organization,
        roles: auth.roles,
        permissions: auth.permissions,
        mfaVerified: auth.mfaVerified,
        isSuperAdmin: auth.isSuperAdmin,
      }}
    >
      {children}
    </DashboardShell>
  );
}
