export type ReportStatus = "pending" | "in_review" | "resolved";
export type ReportType = "issue" | "complaint" | "safety" | "other";

export interface ReportItem {
  id: number;
  title: string;
  description: string;
  type: ReportType;
  status: ReportStatus;
  createdAt: string;
}

export type ReportFilters = {
  status: "" | ReportStatus;
  type: "" | ReportType;
};
