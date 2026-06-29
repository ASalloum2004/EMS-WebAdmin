import "./ManagementTabs.scss";

const tabs = ["Hall", "Booth", "All"] as const;

export type ManagementTab = (typeof tabs)[number];

interface ManagementTabsProps {
  activeTab: ManagementTab;
  onTabChange: (tab: ManagementTab) => void;
}

export function ManagementTabs({
  activeTab,
  onTabChange,
}: ManagementTabsProps) {
  return (
    <div className="management-tabs" role="tablist" aria-label="Management view">
      {tabs.map((tab) => {
        const isActive = tab === activeTab;

        return (
          <button
            key={tab}
            type="button"
            onClick={() => onTabChange(tab)}
            className={
              isActive
                ? "management-tabs__tab management-tabs__tab--active"
                : "management-tabs__tab"
            }
            role="tab"
            aria-selected={isActive}
          >
            {tab}
          </button>
        );
      })}
    </div>
  );
}
