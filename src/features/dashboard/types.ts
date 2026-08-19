export type DashboardMetric = {
  period: number;
  total: number;
};

export type DashboardBoothSummary = {
  allocated: number;
  available: number;
  total: number;
};

export type DashboardPeriod = {
  days: number;
  end: string;
  generated_at: string;
  start: string;
  timezone: string;
};

export type DashboardSummary = {
  booths: DashboardBoothSummary;
  companies: DashboardMetric;
  leads: DashboardMetric;
  open_reports: number;
  pending_booth_requests: number;
  upcoming_events_30_days: number;
  visitors: DashboardMetric;
};

export type DashboardTrendPoint = {
  date: string;
  value: number;
};

export type DashboardTrends = {
  booth_requests: readonly DashboardTrendPoint[];
  companies: readonly DashboardTrendPoint[];
  events: readonly DashboardTrendPoint[];
  leads: readonly DashboardTrendPoint[];
  visitors: readonly DashboardTrendPoint[];
};

export type DashboardBreakdowns = {
  booth_status: {
    allocated: number;
    available: number;
  };
  request_status: {
    approved: number;
    pending: number;
    rejected: number;
  };
  visitor_gender: {
    female: number;
    male: number;
  };
};

export type DashboardData = {
  breakdowns: DashboardBreakdowns;
  period: DashboardPeriod;
  summary: DashboardSummary;
  trends: DashboardTrends;
};

export type DashboardApiResponse = {
  data: DashboardData;
};

export type DashboardSummaryCardKey =
  | "visitors"
  | "companies"
  | "pendingBoothRequests"
  | "reports";

export type DashboardSummaryCard = {
  genderBreakdown?: {
    men: number;
    women: number;
  };
  key: DashboardSummaryCardKey;
  periodDays?: number;
  periodValue?: number;
  value: number;
};

export type DashboardActivityTab =
  | "visitors"
  | "companies"
  | "boothRequests"
  | "leads"
  | "events";

export type DashboardChartPoint = {
  date: string;
  value: number;
};

export type DashboardChartSeries = {
  points: readonly DashboardChartPoint[];
};

export type DashboardRequestStatus = "pending" | "approved" | "rejected";

export type DashboardRequestOverviewItem = {
  status: DashboardRequestStatus;
  value: number;
};

export type DashboardQuickOverviewKey =
  | "upcomingEvents"
  | "pendingBoothRequests"
  | "openReports";

export type DashboardQuickOverviewItem = {
  key: DashboardQuickOverviewKey;
  value: number;
};

export type DashboardBoothOverview = {
  allocated: number;
  available: number;
  total: number;
};

export type DashboardViewModel = {
  boothOverview: DashboardBoothOverview;
  platformActivity: Readonly<
    Record<DashboardActivityTab, DashboardChartSeries>
  >;
  quickOverview: readonly DashboardQuickOverviewItem[];
  requestsOverview: readonly DashboardRequestOverviewItem[];
  summaryCards: readonly DashboardSummaryCard[];
};
