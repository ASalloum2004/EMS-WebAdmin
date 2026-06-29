import "./ManagementTabs.scss";

const tabs = ["Hall", "Booth", "All"] as const;

export function ManagementTabs() {
  return (
    <div className="management-tabs" role="tablist" aria-label="Management view">
      {tabs.map((tab) => {
        const isActive = tab === "Hall";

        return (
          <button
            key={tab}
            type="button"
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
