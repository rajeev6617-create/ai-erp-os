export interface ComplianceStat {
  label: string;
  value: string;
  change: string;
  trend: "up" | "down" | "neutral";
}

export interface ComplianceFrameworkView {
  id: string;
  code: string;
  name: string;
  description: string | null;
  requirementCount: number;
  openAssessments: number;
}

export interface ComplianceAssessmentView {
  id: string;
  frameworkCode: string;
  frameworkName: string;
  requirementTitle: string | null;
  status: string;
  score: number | null;
  periodStart: string;
  periodEnd: string;
  evidenceCount: number;
  notes: string | null;
}

export interface ComplianceDashboardData {
  stats: ComplianceStat[];
  frameworks: ComplianceFrameworkView[];
  assessments: ComplianceAssessmentView[];
}
