import { SettingsDashboard } from "@/components/dashboard/settings-dashboard";
import { requireDashboardAuth } from "@/lib/auth/server";
import { ADMIN_SETTINGS_ROLES, getConfigurationDashboard } from "@/lib/configuration/engine";

export default async function SettingsPage() {
  const auth = await requireDashboardAuth(ADMIN_SETTINGS_ROLES, "/dashboard");
  const data = await getConfigurationDashboard({
    organizationId: auth.organization.id,
    userId: auth.user.id,
  });

  return <SettingsDashboard data={data} />;
}
