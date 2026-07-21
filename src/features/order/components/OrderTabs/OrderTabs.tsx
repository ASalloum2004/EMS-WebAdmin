import { useI18n } from "../../../../i18n";
import "./OrderTabs.scss";

export type OrderTab = "booth" | "event";

const tabs: OrderTab[] = ["booth", "event"];

interface OrderTabsProps {
  activeTab: OrderTab;
  onTabChange: (tab: OrderTab) => void;
}

export function OrderTabs({ activeTab, onTabChange }: OrderTabsProps) {
  const { t } = useI18n();
  const tabLabels: Record<OrderTab, string> = {
    booth: t.order.tabs.booth,
    event: t.order.tabs.event,
  };

  return (
    <div
      aria-label={t.order.tabs.ariaLabel}
      className="order-tabs"
      role="tablist"
    >
      {tabs.map((tab) => {
        const isActive = tab === activeTab;

        return (
          <button
            aria-controls={`orders-${tab}-panel`}
            aria-selected={isActive}
            className={
              isActive
                ? "order-tabs__tab order-tabs__tab--active"
                : "order-tabs__tab"
            }
            id={`orders-${tab}-tab`}
            key={tab}
            onClick={() => onTabChange(tab)}
            role="tab"
            type="button"
          >
            {tabLabels[tab]}
          </button>
        );
      })}
    </div>
  );
}
