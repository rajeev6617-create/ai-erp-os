export interface DocumentView {
  id: string;
  title: string;
  fileName: string;
  mimeType: string;
  sizeLabel: string;
  folderPath: string;
  tags: string[];
  status: string;
  visibility: string;
  updatedAt: string;
}

export interface DocumentsDashboardData {
  stats: Array<{
    label: string;
    value: string;
    change: string;
    trend: "up" | "down" | "neutral";
  }>;
  documents: DocumentView[];
}
