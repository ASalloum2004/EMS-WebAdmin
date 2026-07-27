import { useMemo } from "react";
import { DataTable, type DataTableColumn } from "../../../../components";
import { useI18n } from "../../../../i18n";
import type { ManagerListItem } from "../../types";
import { ManagerAvatar } from "../ManagerAvatar";
import "./ManagerTable.scss";

const EMPTY_VALUE = "—";

type ManagerTableProps = {
  emptyMessage: string;
  managers: ManagerListItem[];
  onOpenManager: (manager: ManagerListItem) => void;
};

function ManagerIdentity({ manager }: { manager: ManagerListItem }) {
  return (
    <span className="manager-identity">
      <ManagerAvatar manager={manager} />
      <span className="manager-identity__name">
        {manager.name || EMPTY_VALUE}
      </span>
    </span>
  );
}

export function ManagerTable({
  emptyMessage,
  managers,
  onOpenManager,
}: ManagerTableProps) {
  const { language, t } = useI18n();
  const formatter = useMemo(
    () =>
      new Intl.NumberFormat(language === "ar" ? "ar-SY" : "en-US", {
        maximumFractionDigits: 0,
        useGrouping: false,
      }),
    [language],
  );
  const columns = useMemo<Array<DataTableColumn<ManagerListItem>>>(
    () => [
      {
        className: "manager-table__cell--manager",
        key: "manager",
        label: t.company.manager.table.manager,
        render: (manager) => <ManagerIdentity manager={manager} />,
        variant: "primary",
      },
      {
        className: "manager-table__cell--email",
        key: "email",
        label: t.company.manager.table.email,
        render: (manager) => manager.email ?? EMPTY_VALUE,
      },
      {
        className: "manager-table__cell--count",
        key: "companiesCount",
        label: t.company.manager.table.companies,
        render: (manager) =>
          manager.companiesCount === null
            ? EMPTY_VALUE
            : formatter.format(manager.companiesCount),
      },
      {
        className: "manager-table__cell--count",
        key: "boothsCount",
        label: t.company.manager.table.booths,
        render: (manager) =>
          manager.boothsCount === null
            ? EMPTY_VALUE
            : formatter.format(manager.boothsCount),
      },
    ],
    [formatter, t],
  );

  return (
    <DataTable
      ariaLabel={t.company.manager.table.ariaLabel}
      className="manager-table"
      columns={columns}
      emptyMessage={emptyMessage}
      getItemAriaLabel={(manager) =>
        `${t.company.manager.table.openDetails} ${manager.name}`
      }
      getItemKey={(manager) => manager.internalId}
      items={managers}
      onItemClick={onOpenManager}
    />
  );
}
