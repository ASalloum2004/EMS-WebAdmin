import { useI18n } from "../../../../i18n";
import type { CompanyDirectoryView } from "../../types";
import "./CompanyViewTabs.scss";

type CompanyViewTabsProps = {
  activeView: CompanyDirectoryView;
  onViewChange: (view: CompanyDirectoryView) => void;
};

export function CompanyViewTabs({
  activeView,
  onViewChange,
}: CompanyViewTabsProps) {
  const { t } = useI18n();

  return (
    <div
      aria-label={t.company.tabs.ariaLabel}
      className="company-view-tabs"
      role="tablist"
    >
      <button
        aria-controls="company-directory-manager-panel"
        aria-selected={activeView === "manager"}
        className={`company-view-tabs__tab${
          activeView === "manager" ? " company-view-tabs__tab--active" : ""
        }`}
        onClick={() => onViewChange("manager")}
        role="tab"
        tabIndex={activeView === "manager" ? 0 : -1}
        type="button"
      >
        {t.company.tabs.viewByManager}
      </button>
      <button
        aria-controls="company-directory-company-panel"
        aria-selected={activeView === "company"}
        className={`company-view-tabs__tab${
          activeView === "company" ? " company-view-tabs__tab--active" : ""
        }`}
        onClick={() => onViewChange("company")}
        role="tab"
        tabIndex={activeView === "company" ? 0 : -1}
        type="button"
      >
        {t.company.tabs.viewByCompany}
      </button>
    </div>
  );
}
