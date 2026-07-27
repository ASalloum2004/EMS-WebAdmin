import { useI18n } from "../../../../i18n";
import type { ActivityTab } from "../../types";
import "./ActivityTabs.scss";

type ActivityTabsProps = {
  activeTab: ActivityTab;
  onTabChange: (tab: ActivityTab) => void;
};

const tabs: ActivityTab[] = ["notifications", "reports"];

export function ActivityTabs({
  activeTab,
  onTabChange,
}: ActivityTabsProps) {
  const { t } = useI18n();

  return (
    <div
      aria-label={t.notifications.tabs.ariaLabel}
      className="activity-tabs"
      role="tablist"
    >
      {tabs.map((tab) => {
        const isActive = tab === activeTab;

        return (
          <button
            aria-controls={`recent-activity-${tab}-panel`}
            aria-selected={isActive}
            className={
              isActive
                ? "activity-tabs__tab activity-tabs__tab--active"
                : "activity-tabs__tab"
            }
            id={`recent-activity-${tab}-tab`}
            key={tab}
            onClick={() => onTabChange(tab)}
            role="tab"
            tabIndex={isActive ? 0 : -1}
            type="button"
          >
            {t.notifications.tabs[tab]}
          </button>
        );
      })}
    </div>
  );
}
