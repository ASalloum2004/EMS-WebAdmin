import { Building2, PanelsTopLeft, Users } from "lucide-react";
import { Card } from "../../../../components";
import { useI18n } from "../../../../i18n";
import type { ManagerDirectory } from "../../types";
import { DirectoryCardsSkeleton } from "../skeletons";
import "./ManagerSummaryCards.scss";

type ManagerSummaryCardsProps = {
  directory: ManagerDirectory | null;
  isLoading: boolean;
};

export function ManagerSummaryCards({
  directory,
  isLoading,
}: ManagerSummaryCardsProps) {
  const { language, t } = useI18n();

  if (isLoading) {
    return <DirectoryCardsSkeleton />;
  }

  const formatter = new Intl.NumberFormat(
    language === "ar" ? "ar-SY" : "en-US",
  );
  const cards = [
    {
      icon: <Users aria-hidden="true" size={22} strokeWidth={1.8} />,
      key: "totalManagers",
      label: t.company.manager.summary.totalManagers,
      value: directory?.totalManagers ?? null,
    },
    {
      icon: <Building2 aria-hidden="true" size={22} strokeWidth={1.8} />,
      key: "managedCompanies",
      label: t.company.manager.summary.managedCompanies,
      value: directory?.managedCompanies ?? null,
    },
    {
      icon: <PanelsTopLeft aria-hidden="true" size={22} strokeWidth={1.8} />,
      key: "managedBooths",
      label: t.company.manager.summary.managedBooths,
      value: directory?.managedBooths ?? null,
    },
  ] as const;

  return (
    <div aria-busy="false" className="manager-summary">
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
            <span
              aria-label={
                card.value === null
                  ? t.company.manager.summary.unavailable
                  : undefined
              }
            >
              {card.value === null ? "—" : formatter.format(card.value)}
            </span>
          </strong>
        </Card>
      ))}
    </div>
  );
}
