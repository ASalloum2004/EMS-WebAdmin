import { useI18n } from "../../../../i18n";
import "./ManagementTabs.scss";

export type ManagementTab = "hall" | "booth" | "eventHall";

const tabs: ManagementTab[] = ["hall", "booth", "eventHall"];

interface ManagementTabsProps {
  activeTab: ManagementTab;
  onTabChange: (tab: ManagementTab) => void;
}

export function ManagementTabs({
  activeTab,
  onTabChange,
}: ManagementTabsProps) {
  const { t } = useI18n();
  const tabLabels: Record<ManagementTab, string> = {
    hall: t.management.tabs.hall,
    booth: t.management.tabs.booth,
    eventHall: t.management.tabs.eventHall,
  };

  return (
    <div
      className="management-tabs"
      role="tablist"
      aria-label={t.management.tabs.ariaLabel}
    >
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
            {tabLabels[tab]}
          </button>
        );
      })}
    </div>
  );
}
