import { Building2, PanelsTopLeft, Users } from "lucide-react";
import { Card } from "../../../../components";
import { useI18n } from "../../../../i18n";
import { MOCK_MANAGER_SUMMARY } from "../../data";
import "./ManagerSummaryCards.scss";

export function ManagerSummaryCards() {
  const { language, t } = useI18n();
  const formatter = new Intl.NumberFormat(
    language === "ar" ? "ar-SY" : "en-US",
  );
  const cards = [
    {
      icon: <Users aria-hidden="true" size={22} strokeWidth={1.8} />,
      key: "totalManagers",
      label: t.company.manager.summary.totalManagers,
      value: MOCK_MANAGER_SUMMARY.totalManagers,
    },
    {
      icon: <Building2 aria-hidden="true" size={22} strokeWidth={1.8} />,
      key: "managedCompanies",
      label: t.company.manager.summary.managedCompanies,
      value: MOCK_MANAGER_SUMMARY.managedCompanies,
    },
    {
      icon: <PanelsTopLeft aria-hidden="true" size={22} strokeWidth={1.8} />,
      key: "managedBooths",
      label: t.company.manager.summary.managedBooths,
      value: MOCK_MANAGER_SUMMARY.managedBooths,
    },
  ] as const;

  return (
    <div className="manager-summary">
      {cards.map((card) => (
        <Card
          className="manager-summary__card"
          icon={card.icon}
          iconClassName="manager-summary__icon"
          key={card.key}
          title={card.label}
          titleClassName="manager-summary__label"
        >
          <strong className="manager-summary__value">
            {formatter.format(card.value)}
          </strong>
        </Card>
      ))}
    </div>
  );
}
