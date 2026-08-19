import "./DashboardTabs.scss";

type DashboardTabOption<T extends string> = {
  id: T;
  label: string;
};

interface DashboardTabsProps<T extends string> {
  activeTab: T;
  ariaLabel: string;
  idPrefix: string;
  onTabChange: (tab: T) => void;
  tabs: readonly DashboardTabOption<T>[];
}

export function DashboardTabs<T extends string>({
  activeTab,
  ariaLabel,
  idPrefix,
  onTabChange,
  tabs,
}: DashboardTabsProps<T>) {
  return (
    <div aria-label={ariaLabel} className="dashboard-tabs" role="tablist">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;

        return (
          <button
            aria-controls={`${idPrefix}-${tab.id}-panel`}
            aria-selected={isActive}
            className={
              isActive
                ? "dashboard-tabs__tab dashboard-tabs__tab--active"
                : "dashboard-tabs__tab"
            }
            id={`${idPrefix}-${tab.id}-tab`}
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            role="tab"
            tabIndex={isActive ? 0 : -1}
            type="button"
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
