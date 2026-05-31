export interface OrganizationDashboardData {
  organization: {
    name: string;
    slug: string;
    legalName: string | null;
    status: string;
    tier: string;
    gstin: string | null;
    pan: string | null;
    timezone: string;
    currency: string;
    fiscalYearStartMonth: number;
  };
  departments: Array<{
    id: string;
    code: string | null;
    name: string;
    costCenterCode: string | null;
    employeeCount: number;
  }>;
  settingsSummary: Array<{ key: string; value: string }>;
}
