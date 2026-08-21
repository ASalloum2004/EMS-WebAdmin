import type {
  DashboardData,
  DashboardTrendPoint,
  DashboardViewModel,
} from "../types";

const LAST_DAY_PERIOD_DAYS = 1;

function getLatestDailyValue(points: readonly DashboardTrendPoint[]) {
  if (points.length === 0) {
    return 0;
  }

  return points.reduce((latestPoint, point) =>
    point.date > latestPoint.date ? point : latestPoint,
  ).value;
}

export function getDashboardViewModel(data: DashboardData): DashboardViewModel {
  return {
    boothOverview: data.summary.booths,
    platformActivity: {
      boothRequests: {
        points: data.trends.booth_requests,
      },
      companies: {
        points: data.trends.companies,
      },
      events: {
        points: data.trends.events,
      },
      leads: {
        points: data.trends.leads,
      },
      visitors: {
        points: data.trends.visitors,
      },
    },
    quickOverview: [
      {
        key: "upcomingEvents",
        value: data.summary.upcoming_events_30_days,
      },
      {
        key: "pendingBoothRequests",
        value: data.summary.pending_booth_requests,
      },
      {
        key: "openReports",
        value: data.summary.open_reports,
      },
    ],
    requestsOverview: [
      {
        status: "pending",
        value: data.breakdowns.request_status.pending,
      },
      {
        status: "approved",
        value: data.breakdowns.request_status.approved,
      },
      {
        status: "rejected",
        value: data.breakdowns.request_status.rejected,
      },
    ],
    summaryCards: [
      {
        genderBreakdown: {
          men: data.breakdowns.visitor_gender.male,
          women: data.breakdowns.visitor_gender.female,
        },
        key: "visitors",
        periodDays: LAST_DAY_PERIOD_DAYS,
        periodValue: getLatestDailyValue(data.trends.visitors),
        value: data.summary.visitors.total,
      },
      {
        key: "companies",
        periodDays: LAST_DAY_PERIOD_DAYS,
        periodValue: getLatestDailyValue(data.trends.companies),
        value: data.summary.companies.total,
      },
      {
        key: "pendingBoothRequests",
        value: data.summary.pending_booth_requests,
      },
      {
        key: "reports",
        value: data.summary.open_reports,
      },
    ],
  };
}
