import { useMemo } from "react";
import { Eye } from "lucide-react";
import { DataTable, type DataTableColumn } from "../../../../components";
import { useI18n } from "../../../../i18n";
import type { Manager } from "../../types";
import { ManagerAvatar } from "../ManagerAvatar";
import "./ManagerTable.scss";

type ManagerTableProps = {
  emptyMessage: string;
  managers: Manager[];
  onOpenManager: (manager: Manager) => void;
};

function ManagerIdentity({ manager }: { manager: Manager }) {
  return (
    <span className="manager-identity">
      <ManagerAvatar manager={manager} />
      <span className="manager-identity__name">{manager.name}</span>
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
  const columns = useMemo<Array<DataTableColumn<Manager>>>(
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
        render: (manager) => manager.email,
      },
      {
        className: "manager-table__cell--count",
        key: "companies_count",
        label: t.company.manager.table.companies,
        render: (manager) => formatter.format(manager.companies_count),
      },
      {
        className: "manager-table__cell--count",
        key: "booths_count",
        label: t.company.manager.table.booths,
        render: (manager) => formatter.format(manager.booths_count),
      },
    ],
    [formatter, t],
  );

  return (
    <DataTable
      actions={(manager) => (
        <span className="manager-table__action-cell">
          <span className="manager-table__action-label">
            {t.company.manager.table.actions}
          </span>
          <button
            aria-label={`${t.company.manager.table.viewDetails} ${manager.name}`}
            className="manager-table__view-button"
            onClick={(event) => {
              event.stopPropagation();
              onOpenManager(manager);
            }}
            onKeyDown={(event) => event.stopPropagation()}
            type="button"
          >
            <Eye aria-hidden="true" size={18} strokeWidth={1.8} />
          </button>
        </span>
      )}
      ariaLabel={t.company.manager.table.ariaLabel}
      className="manager-table"
      columns={columns}
      emptyMessage={emptyMessage}
      getItemAriaLabel={(manager) =>
        `${t.company.manager.table.openDetails} ${manager.name}`
      }
      getItemKey={(manager) => manager.id}
      items={managers}
      onItemClick={onOpenManager}
    />
  );
}
