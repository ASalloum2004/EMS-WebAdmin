import { useI18n } from "../../../../i18n";
import "./CompanyViewTabs.scss";

export function CompanyViewTabs() {
  const { t } = useI18n();

  return (
    <div
      aria-label={t.company.tabs.ariaLabel}
      className="company-view-tabs"
      role="tablist"
    >
      <button
        aria-disabled="true"
        aria-selected="false"
        className="company-view-tabs__tab"
        disabled
        role="tab"
        title={t.company.tabs.managerComingSoon}
        type="button"
      >
        {t.company.tabs.viewByManager}
      </button>
      <button
        aria-selected="true"
        className="company-view-tabs__tab company-view-tabs__tab--active"
        role="tab"
        type="button"
      >
        {t.company.tabs.viewByCompany}
      </button>
    </div>
  );
}
