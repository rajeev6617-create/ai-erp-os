export interface PeopleMemberView {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  employeeCode: string | null;
  department: string | null;
  designation: string | null;
}

export interface PeopleDashboardData {
  stats: Array<{
    label: string;
    value: string;
    change: string;
    trend: "up" | "down" | "neutral";
  }>;
  members: PeopleMemberView[];
}
