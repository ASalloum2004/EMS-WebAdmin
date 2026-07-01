import { useI18n } from "../../../../i18n";
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
  const { t } = useI18n();
  const tabLabels: Record<ManagementTab, string> = {
    Hall: t.management.tabs.hall,
    Booth: t.management.tabs.booth,
    All: t.management.tabs.all,
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
