export type ReportStatus = "pending" | "resolved" | "rejected";

export interface ReportApiData {
  admin_notes: string | null;
  created_at: string;
  description: string;
  id: number;
  status: ReportStatus;
  title: string;
}

export type ReportItem = Pick<
  ReportApiData,
  "admin_notes" | "created_at" | "id" | "status" | "title"
>;

export interface Reportable {
  id: number;
  number?: string;
  title?: string;
}

export interface ReportReporter {
  id: number;
  name: string;
}

export type ReportDetails = ReportApiData & {
  reportable: Reportable | null;
  reporter: ReportReporter | null;
};

export type ReportDetailsResponse = {
  data: ReportApiData & {
    reportable?: Reportable | null;
    reporter?: ReportReporter | null;
  };
  message: string;
  status: boolean;
};

export type ReportActionPayload = {
  notes?: string | null;
};

export type ResolveReportPayload = ReportActionPayload;

export type RejectReportPayload = ReportActionPayload;

export type ReportActionResponse = Record<string, unknown>;

export type ReportActionFieldErrors = {
  notes?: string;
};

export type ReportFilters = {
  createdDate: string;
  status: "" | ReportStatus;
};

export type ReportsResponse = {
  data: {
    current_page: number;
    data: ReportApiData[];
    last_page: number;
    per_page: number;
    total: number;
  };
  message: string;
  status: boolean;
};

export type ReportsPagination = {
  currentPage: number;
  perPage: number;
  totalItems: number;
  totalPages: number;
};

export type GetReportsResult = {
  pagination: ReportsPagination;
  reports: ReportItem[];
};

export type GetReportsParams = {
  createdDate?: string;
  page?: number;
  perPage?: number;
  search?: string;
  status?: ReportStatus;
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
