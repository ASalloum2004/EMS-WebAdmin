import { useI18n } from "../../../../i18n";
import "./CompanyStatusBadge.scss";

export type CompanyStatusVariant = "approved" | "missing" | "not-approved";

export function getCompanyStatusVariant(
  status: string | null | undefined,
): CompanyStatusVariant {
  const normalizedStatus = status?.trim().toLowerCase() ?? "";

  if (!normalizedStatus) {
    return "missing";
  }

  return normalizedStatus === "approved" ? "approved" : "not-approved";
}

export function CompanyStatusBadge({
  status,
}: {
  status: string | null | undefined;
}) {
  const { t } = useI18n();
  const variant = getCompanyStatusVariant(status);
  const label =
    variant === "approved"
      ? t.company.statuses.approved
      : variant === "not-approved"
        ? t.company.statuses.notApproved
        : t.company.statuses.notProvided;

  return (
    <span className={`company-status-badge company-status-badge--${variant}`}>
      {label}
    </span>
  );
}
