export interface DemoModeInfo {
  enabled: boolean;
  sandbox: boolean;
  environmentLabel: string;
  tenantLabel: string;
}

export function getDemoModeInfo(): DemoModeInfo {
  const enabled =
    process.env.AI_ERP_DEMO_MODE === "true" ||
    process.env.NEXT_PUBLIC_AI_ERP_DEMO_MODE === "true";
  const sandbox = enabled || process.env.AI_ERP_SANDBOX_MODE === "true";

  return {
    enabled,
    sandbox,
    environmentLabel: process.env.NEXT_PUBLIC_AI_ERP_ENV ?? (enabled ? "demo" : "production"),
    tenantLabel: process.env.NEXT_PUBLIC_AI_ERP_DEMO_TENANT ?? "Demo tenant",
  };
}
