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
  day: number;
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
