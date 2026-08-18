export type DashboardDateRange = "last7Days" | "last30Days" | "thisMonth";

export type DashboardSummaryCardKey =
  | "visitors"
  | "companies"
  | "booths"
  | "reports";

export type DashboardSummaryCard = {
  allocatedValue?: number;
  availableRatio?: number;
  key: DashboardSummaryCardKey;
  periodValue?: number;
  value: number;
};

export type DashboardActivityTab =
  | "visitors"
  | "companies"
  | "boothRequests"
  | "leads";

export type DashboardWeeklyActivityTab =
  | "leads"
  | "events"
  | "boothRequests";

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
