import "./MangementTabs.scss";

const tabs = ["Hall", "Booth", "All"] as const;

export function MangementTabs() {
  return (
    <div className="mangement-tabs" role="tablist" aria-label="Mangement view">
      {tabs.map((tab) => {
        const isActive = tab === "Hall";

        return (
          <button
            key={tab}
            type="button"
            className={
              isActive
                ? "mangement-tabs__tab mangement-tabs__tab--active"
                : "mangement-tabs__tab"
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
