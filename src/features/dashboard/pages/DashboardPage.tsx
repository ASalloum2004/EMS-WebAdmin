import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type CSSProperties,
  type ReactNode,
} from "react";
import {
  Building2,
  CalendarDays,
  ChevronRight,
  ClipboardList,
  Flag,
  Mars,
  Users,
  Venus,
} from "lucide-react";
import { Card } from "../../../components";
import { useOptionalProfileContext } from "../../profile/hooks";
import { useI18n } from "../../../i18n";
import { ManagementLayout } from "../../../layouts";
import { AppLink } from "../../../router";
import {
  dashboardBoothOverview,
  dashboardDateRanges,
  dashboardPlatformActivity,
  dashboardQuickOverview,
  dashboardRequestsOverview,
  dashboardSummaryCards,
} from "../data";
import {
  DashboardLineChart,
  DashboardTabs,
} from "../components";
import type {
  DashboardActivityTab,
  DashboardDateRange,
  DashboardQuickOverviewKey,
  DashboardRequestStatus,
  DashboardSummaryCardKey,
} from "../types";
import "./DashboardPage.scss";

type ProgressStyle = CSSProperties & {
  "--dashboard-progress": string;
};

const platformTabs: readonly DashboardActivityTab[] = [
  "visitors",
  "companies",
  "boothRequests",
  "leads",
  "events",
];

function getAdminName(name: string | undefined, fallbackName: string) {
  return name?.trim() || fallbackName;
}

function getPlatformActivityTabFromLocation(): DashboardActivityTab {
  const selectedTab = new URLSearchParams(window.location.search).get(
    "activity",
  );

  return platformTabs.find((tab) => tab === selectedTab) ?? "visitors";
}

export function DashboardPage() {
  const { language, t } = useI18n();
  const profile = useOptionalProfileContext()?.profile;
  const [dateRange, setDateRange] =
    useState<DashboardDateRange>("last7Days");
  const [activePlatformTab, setActivePlatformTab] =
    useState<DashboardActivityTab>(getPlatformActivityTabFromLocation);

  useEffect(() => {
    function syncPlatformActivityTab() {
      setActivePlatformTab(getPlatformActivityTabFromLocation());
    }

    window.addEventListener("popstate", syncPlatformActivityTab);
    return () => window.removeEventListener("popstate", syncPlatformActivityTab);
  }, []);
  const numberFormatter = useMemo(
    () => new Intl.NumberFormat(language === "ar" ? "ar-SY" : "en-US"),
    [language],
  );
  const percentageFormatter = useMemo(
    () =>
      new Intl.NumberFormat(language === "ar" ? "ar-SY" : "en-US", {
        maximumFractionDigits: 1,
        style: "percent",
      }),
    [language],
  );
  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(language === "ar" ? "ar-SY" : "en-US", {
        day: "numeric",
        month: "short",
        timeZone: "UTC",
      }),
    [language],
  );
  const adminName = getAdminName(profile?.name, t.dashboard.fallbackAdminName);
  const platformTabOptions = platformTabs.map((tab) => ({
    id: tab,
    label: t.dashboard.tabs[tab],
  }));
  const summaryLabels: Record<DashboardSummaryCardKey, string> = {
    companies: t.dashboard.summary.companies,
    pendingBoothRequests: t.dashboard.quickOverview.pendingBoothRequests,
    reports: t.dashboard.summary.openReports,
    visitors: t.dashboard.summary.totalVisitors,
  };
  const summaryIcons: Record<DashboardSummaryCardKey, ReactNode> = {
    companies: <Building2 aria-hidden="true" size={22} strokeWidth={1.8} />,
    pendingBoothRequests: (
      <ClipboardList aria-hidden="true" size={22} strokeWidth={1.8} />
    ),
    reports: <Flag aria-hidden="true" size={22} strokeWidth={1.8} />,
    visitors: <Users aria-hidden="true" size={22} strokeWidth={1.8} />,
  };
  const requestLabels: Record<DashboardRequestStatus, string> = {
    approved: t.dashboard.requests.approved,
    pending: t.dashboard.requests.pending,
    rejected: t.dashboard.requests.rejected,
  };
  const quickOverviewLabels: Record<
    DashboardQuickOverviewKey,
    { href: string; icon: ReactNode; subtitle: string; title: string }
  > = {
    openReports: {
      href: "/reports",
      icon: <Flag aria-hidden="true" size={20} strokeWidth={1.8} />,
      subtitle: t.dashboard.quickOverview.requiresAttention,
      title: t.dashboard.summary.openReports,
    },
    pendingBoothRequests: {
      href: "/orders",
      icon: <ClipboardList aria-hidden="true" size={20} strokeWidth={1.8} />,
      subtitle: t.dashboard.quickOverview.waitingForReview,
      title: t.dashboard.quickOverview.pendingBoothRequests,
    },
    upcomingEvents: {
      href: "/dashboard?activity=events",
      icon: <CalendarDays aria-hidden="true" size={20} strokeWidth={1.8} />,
      subtitle: t.dashboard.quickOverview.next30Days,
      title: t.dashboard.quickOverview.upcomingEvents,
    },
  };
  const requestTotal = dashboardRequestsOverview.reduce(
    (total, item) => total + item.value,
    0,
  );
  const boothAvailableRatio =
    dashboardBoothOverview.available / dashboardBoothOverview.total;

  function formatDate(day: number) {
    return dateFormatter.format(new Date(Date.UTC(2026, 7, day)));
  }

  function formatPointLabel(day: number, value: number) {
    return `${formatDate(day)}: ${numberFormatter.format(value)}`;
  }

  function handleDateRangeChange(event: ChangeEvent<HTMLSelectElement>) {
    const nextDateRange = event.target.value;

    if (
      nextDateRange === "last7Days" ||
      nextDateRange === "last30Days" ||
      nextDateRange === "thisMonth"
    ) {
      setDateRange(nextDateRange);
    }
  }

  return (
    <ManagementLayout>
      <div className="dashboard-page">
        <section className="dashboard-page__welcome" aria-label={t.dashboard.welcomeSectionAriaLabel}>
          <div>
            <p className="dashboard-page__welcome-title">
              {t.dashboard.welcomeBack}, {adminName}
            </p>
            <p className="dashboard-page__welcome-description">
              {t.dashboard.platformUpdate}
            </p>
          </div>

          <label className="dashboard-page__date-range">
            <span className="dashboard-page__sr-only">
              {t.dashboard.dateRange.label}
            </span>
            <CalendarDays aria-hidden="true" size={18} strokeWidth={1.8} />
            <select onChange={handleDateRangeChange} value={dateRange}>
              {dashboardDateRanges.map((range) => (
                <option key={range} value={range}>
                  {t.dashboard.dateRange[range]}
                </option>
              ))}
            </select>
          </label>
        </section>

        <section
          aria-label={t.dashboard.summary.ariaLabel}
          className="dashboard-page__summary"
        >
          {dashboardSummaryCards.map((summaryCard) => {
            return (
              <Card
                className={`dashboard-page__summary-card dashboard-page__summary-card--${summaryCard.key}`}
                icon={summaryIcons[summaryCard.key]}
                iconClassName="dashboard-page__summary-icon"
                key={summaryCard.key}
                title={summaryLabels[summaryCard.key]}
                titleClassName="dashboard-page__summary-label"
              >
                <strong className="dashboard-page__summary-value">
                  {numberFormatter.format(summaryCard.value)}
                </strong>

                {summaryCard.periodValue !== undefined ? (
                  <p className="dashboard-page__summary-detail">
                    {numberFormatter.format(summaryCard.periodValue)} {t.dashboard.summary.thisWeek}
                  </p>
                ) : null}

                {summaryCard.key === "visitors" &&
                summaryCard.genderBreakdown ? (
                  <dl className="dashboard-page__visitor-breakdown">
                    <div>
                      <dt>
                        <Venus aria-hidden="true" size={15} strokeWidth={2} />
                        {t.dashboard.summary.women}
                      </dt>
                      <dd>
                        {numberFormatter.format(
                          summaryCard.genderBreakdown.women,
                        )}
                      </dd>
                    </div>
                    <div>
                      <dt>
                        <Mars aria-hidden="true" size={15} strokeWidth={2} />
                        {t.dashboard.summary.men}
                      </dt>
                      <dd>
                        {numberFormatter.format(
                          summaryCard.genderBreakdown.men,
                        )}
                      </dd>
                    </div>
                  </dl>
                ) : null}

                {summaryCard.key === "reports" ? (
                  <p className="dashboard-page__summary-detail dashboard-page__summary-detail--attention">
                    {t.dashboard.summary.needsAttention}
                  </p>
                ) : null}

                {summaryCard.key === "pendingBoothRequests" ? (
                  <p className="dashboard-page__summary-detail">
                    {t.dashboard.quickOverview.waitingForReview}
                  </p>
                ) : null}
              </Card>
            );
          })}
        </section>

        <section className="dashboard-page__primary-grid">
          <Card
            actions={
              <DashboardTabs
                activeTab={activePlatformTab}
                ariaLabel={t.dashboard.platformActivityTabsAriaLabel}
                idPrefix="dashboard-platform"
                onTabChange={setActivePlatformTab}
                tabs={platformTabOptions}
              />
            }
            bodyClassName="dashboard-page__chart-body"
            className="dashboard-page__chart-card"
            title={t.dashboard.platformActivity}
          >
            <div
              aria-labelledby={`dashboard-platform-${activePlatformTab}-tab`}
              className="dashboard-page__tabpanel"
              id={`dashboard-platform-${activePlatformTab}-panel`}
              role="tabpanel"
            >
              <DashboardLineChart
                ariaLabel={t.dashboard.platformActivityChartAriaLabel}
                formatLabel={formatDate}
                formatPointLabel={formatPointLabel}
                series={dashboardPlatformActivity[activePlatformTab]}
              />
            </div>
          </Card>

          <Card
            bodyClassName="dashboard-page__booth-body"
            className="dashboard-page__booth-card"
            title={t.dashboard.boothOverview}
          >
            <div
              aria-label={t.dashboard.boothOverviewChartAriaLabel}
              className="dashboard-page__booth-donut"
              role="img"
            >
              <svg aria-hidden="true" viewBox="0 0 120 120">
                <circle className="dashboard-page__donut-track" cx="60" cy="60" r="47" />
                <circle
                  className="dashboard-page__donut-available"
                  cx="60"
                  cy="60"
                  r="47"
                  style={{
                    strokeDasharray: `${boothAvailableRatio * 295.31} 295.31`,
                  }}
                />
                <circle
                  className="dashboard-page__donut-allocated"
                  cx="60"
                  cy="60"
                  r="47"
                  style={{
                    strokeDasharray: `${(1 - boothAvailableRatio) * 295.31} 295.31`,
                    strokeDashoffset: `${-boothAvailableRatio * 295.31}`,
                  }}
                />
              </svg>
              <div className="dashboard-page__donut-content">
                <strong>{numberFormatter.format(dashboardBoothOverview.total)}</strong>
                <span>{t.dashboard.totalBooths}</span>
              </div>
            </div>

            <dl className="dashboard-page__booth-legend">
              <div>
                <dt><span className="dashboard-page__legend-dot dashboard-page__legend-dot--available" />{t.dashboard.summary.available}</dt>
                <dd>{numberFormatter.format(dashboardBoothOverview.available)}</dd>
              </div>
              <div>
                <dt><span className="dashboard-page__legend-dot dashboard-page__legend-dot--allocated" />{t.dashboard.summary.allocated}</dt>
                <dd>{numberFormatter.format(dashboardBoothOverview.allocated)}</dd>
              </div>
            </dl>
          </Card>
        </section>

        <section className="dashboard-page__secondary-grid">
          <Card
            bodyClassName="dashboard-page__requests-body"
            className="dashboard-page__requests-card"
            title={t.dashboard.requestsOverview}
          >
            <div className="dashboard-page__request-list">
              {dashboardRequestsOverview.map((request) => {
                const ratio = request.value / requestTotal;

                return (
                  <div className="dashboard-page__request-row" key={request.status}>
                    <div className="dashboard-page__request-row-heading">
                      <span>{requestLabels[request.status]}</span>
                      <strong>{numberFormatter.format(request.value)}</strong>
                    </div>
                    <div
                      aria-label={`${requestLabels[request.status]} ${percentageFormatter.format(ratio)}`}
                      aria-valuemax={1}
                      aria-valuemin={0}
                      aria-valuenow={ratio}
                      className="dashboard-page__progress-track"
                      role="progressbar"
                    >
                      <span
                        className={`dashboard-page__progress-value dashboard-page__progress-value--${request.status}`}
                        style={{
                          "--dashboard-progress": `${ratio * 100}%`,
                        } as ProgressStyle}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <AppLink className="dashboard-page__view-requests" href="/orders">
              {t.dashboard.requests.viewRequests}
              <ChevronRight aria-hidden="true" size={16} strokeWidth={2} />
            </AppLink>
          </Card>

          <Card
            bodyClassName="dashboard-page__quick-overview-body"
            className="dashboard-page__quick-overview-card"
            title={t.dashboard.quickOverview.title}
          >
            <div className="dashboard-page__quick-overview-list">
              {dashboardQuickOverview.map((item) => {
                const overview = quickOverviewLabels[item.key];

                return (
                  <AppLink
                    className="dashboard-page__quick-overview-row"
                    href={overview.href}
                    key={item.key}
                  >
                    <span className="dashboard-page__quick-overview-icon">
                      {overview.icon}
                    </span>
                    <div>
                      <strong>{overview.title}</strong>
                      <p>{overview.subtitle}</p>
                    </div>
                    <strong className="dashboard-page__quick-overview-value">
                      {numberFormatter.format(item.value)}
                    </strong>
                    <ChevronRight
                      aria-hidden="true"
                      className="dashboard-page__quick-overview-arrow"
                      size={18}
                      strokeWidth={1.8}
                    />
                  </AppLink>
                );
              })}
            </div>
          </Card>
        </section>

      </div>
    </ManagementLayout>
  );
}
