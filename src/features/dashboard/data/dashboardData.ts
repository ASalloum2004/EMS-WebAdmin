import type {
  DashboardData,
  DashboardViewModel,
} from "../types";

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
        periodDays: data.period.days,
        periodValue: data.summary.visitors.period,
        value: data.summary.visitors.total,
      },
      {
        key: "companies",
        periodDays: data.period.days,
        periodValue: data.summary.companies.period,
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
