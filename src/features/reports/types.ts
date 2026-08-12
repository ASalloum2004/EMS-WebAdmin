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

export interface ReportStatisticsData {
  total_requests: number;
  pending_requests: number;
  resolved_requests: number;
  rejected_requests: number;
}

export interface ReportStatisticsResponse {
  status: boolean;
  message: string;
  data: ReportStatisticsData;
}
