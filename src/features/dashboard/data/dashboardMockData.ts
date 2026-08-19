import type {
  DashboardActivityTab,
  DashboardBoothOverview,
  DashboardChartSeries,
  DashboardQuickOverviewItem,
  DashboardRequestOverviewItem,
  DashboardSummaryCard,
} from "../types";

export const dashboardSummaryCards: readonly DashboardSummaryCard[] = [
  {
    genderBreakdown: {
      men: 2,
      women: 1,
    },
    key: "visitors",
    periodValue: 3,
    value: 3,
  },
  {
    key: "companies",
    periodValue: 11,
    value: 11,
  },
  {
    key: "pendingBoothRequests",
    value: 5,
  },
  {
    key: "reports",
    value: 7,
  },
];

export const dashboardPlatformActivity: Readonly<
  Record<DashboardActivityTab, DashboardChartSeries>
> = {
  visitors: {
    points: [
      { day: 12, value: 0 },
      { day: 13, value: 0 },
      { day: 14, value: 0 },
      { day: 15, value: 0 },
      { day: 16, value: 0 },
      { day: 17, value: 11 },
      { day: 18, value: 0 },
    ],
  },
  companies: {
    points: [
      { day: 12, value: 1 },
      { day: 13, value: 2 },
      { day: 14, value: 2 },
      { day: 15, value: 4 },
      { day: 16, value: 3 },
      { day: 17, value: 6 },
      { day: 18, value: 5 },
    ],
  },
  boothRequests: {
    points: [
      { day: 12, value: 2 },
      { day: 13, value: 1 },
      { day: 14, value: 4 },
      { day: 15, value: 3 },
      { day: 16, value: 5 },
      { day: 17, value: 2 },
      { day: 18, value: 4 },
    ],
  },
  leads: {
    points: [
      { day: 12, value: 4 },
      { day: 13, value: 6 },
      { day: 14, value: 3 },
      { day: 15, value: 7 },
      { day: 16, value: 5 },
      { day: 17, value: 8 },
      { day: 18, value: 6 },
    ],
  },
  events: {
    points: [
      { day: 12, value: 1 },
      { day: 13, value: 2 },
      { day: 14, value: 1 },
      { day: 15, value: 3 },
      { day: 16, value: 2 },
      { day: 17, value: 4 },
      { day: 18, value: 3 },
    ],
  },
};

export const dashboardBoothOverview: DashboardBoothOverview = {
  allocated: 10,
  available: 451,
  total: 461,
};

export const dashboardRequestsOverview: readonly DashboardRequestOverviewItem[] = [
  { status: "pending", value: 5 },
  { status: "approved", value: 2 },
  { status: "rejected", value: 2 },
];

export const dashboardQuickOverview: readonly DashboardQuickOverviewItem[] = [
  { key: "upcomingEvents", value: 4 },
  { key: "pendingBoothRequests", value: 5 },
  { key: "openReports", value: 7 },
];
