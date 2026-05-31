export interface IntegrationView {
  id: string;
  provider: string;
  name: string;
  status: string;
  lastSyncAt: string | null;
  lastError: string | null;
}

export interface IntegrationsDashboardData {
  stats: Array<{
    label: string;
    value: string;
    change: string;
    trend: "up" | "down" | "neutral";
  }>;
  integrations: IntegrationView[];
}
