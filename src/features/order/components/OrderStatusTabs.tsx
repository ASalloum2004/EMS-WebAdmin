import { useI18n } from "../../../i18n";
import { orderStatusTabs, type OrderStatusTab } from "../types";
import "./OrderStatusTabs.scss";

interface OrderStatusTabsProps {
  activeTab: OrderStatusTab;
  onTabChange: (tab: OrderStatusTab) => void;
}

export function OrderStatusTabs({
  activeTab,
  onTabChange,
}: OrderStatusTabsProps) {
  const { t } = useI18n();
  const tabLabels: Record<OrderStatusTab, string> = {
    all: t.order.tabs.all,
    pending: t.order.tabs.pending,
    approved: t.order.tabs.approved,
    rejected: t.order.tabs.rejected,
  };

  return (
    <div
      className="order-status-tabs"
      role="tablist"
      aria-label={t.order.tabs.ariaLabel}
    >
      {orderStatusTabs.map((tab) => {
        const isActive = tab === activeTab;

        return (
          <button
            className={
              isActive
                ? "order-status-tabs__tab order-status-tabs__tab--active"
                : "order-status-tabs__tab"
            }
            key={tab}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onTabChange(tab)}
          >
            {tabLabels[tab]}
          </button>
        );
      })}
    </div>
  );
}
