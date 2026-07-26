import { useMemo } from "react";
import { DataTable, type DataTableColumn } from "../../../../components";
import { useI18n } from "../../../../i18n";
import type { CompanyListItem } from "../../types";
import { CompanyLogo } from "../CompanyLogo";
import { CompanyStatusBadge } from "../CompanyStatusBadge";
import "./CompanyTable.scss";

const EMPTY_VALUE = "—";

type CompanyTableProps = {
  companies: CompanyListItem[];
  emptyMessage: string;
  onOpenCompany: (companyId: number) => void;
};

function CompanyIdentity({ company }: { company: CompanyListItem }) {
  return (
    <span className="company-identity">
      <CompanyLogo logo={company.logo} name={company.name} />
      <span className="company-identity__name">
        {company.name || EMPTY_VALUE}
      </span>
    </span>
  );
}

export function CompanyTable({
  companies,
  emptyMessage,
  onOpenCompany,
}: CompanyTableProps) {
  const { t } = useI18n();
  const columns = useMemo<Array<DataTableColumn<CompanyListItem>>>(
    () => [
      {
        key: "company",
        label: t.company.table.company,
        render: (company) => <CompanyIdentity company={company} />,
        className: "company-table__cell--company",
        variant: "primary",
      },
      {
        key: "business_sector",
        label: t.company.table.businessSector,
        render: (company) => company.businessSector || EMPTY_VALUE,
        className: "company-table__cell--sector",
      },
      {
        key: "phone",
        label: t.company.table.phone,
        render: (company) => company.phone || EMPTY_VALUE,
        className: "company-table__cell--phone",
      },
      {
        key: "status",
        label: t.company.table.status,
        render: (company) => <CompanyStatusBadge status={company.status} />,
        className: "company-table__cell--status",
        variant: "badge",
      },
    ],
    [t],
  );

  return (
    <DataTable
      ariaLabel={t.company.table.ariaLabel}
      className="company-table"
      columns={columns}
      emptyMessage={emptyMessage}
      getItemAriaLabel={(company) =>
        `${t.company.table.openDetails} ${company.name}`
      }
      getItemKey={(company) => company.id}
      items={companies}
      onItemClick={(company) => onOpenCompany(company.id)}
    />
  );
}
