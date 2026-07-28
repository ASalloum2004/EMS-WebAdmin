import { useEffect, useState } from "react";
import type { DataTableColumn } from "../../../../components";
import type { I18nDictionary } from "../../../../i18n";
import type { VisitorApiData } from "../../types";
import "./VisitorTableColumns.scss";

const EMPTY_VALUE = "—";

export function getVisitorDisplayName(visitor: VisitorApiData) {
  return [visitor.first_name, visitor.last_name]
    .map((name) => name.trim())
    .filter(Boolean)
    .join(" ") || EMPTY_VALUE;
}

export function getVisitorInitials(visitor: VisitorApiData) {
  const initials = [visitor.first_name, visitor.last_name]
    .map((name) => name.trim().charAt(0))
    .filter(Boolean)
    .join("")
    .toUpperCase();

  return initials || "V";
}

export function formatVisitorLocation(location: string | null) {
  if (!location?.trim()) {
    return EMPTY_VALUE;
  }

  return location
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .join(", ");
}

function displayValue(value: string | null) {
  return value?.trim() || EMPTY_VALUE;
}

export function formatVisitorGender(
  gender: string | null,
  t: I18nDictionary,
) {
  const normalizedGender = gender?.trim().toLowerCase();

  if (!normalizedGender) {
    return EMPTY_VALUE;
  }

  if (normalizedGender === "male") {
    return t.visitor.table.genders.male;
  }

  if (normalizedGender === "female") {
    return t.visitor.table.genders.female;
  }

  return `${normalizedGender.charAt(0).toUpperCase()}${normalizedGender.slice(1)}`;
}

function VisitorIdentity({ visitor }: { visitor: VisitorApiData }) {
  const [hasImageError, setHasImageError] = useState(false);
  const displayName = getVisitorDisplayName(visitor);
  const showImage = Boolean(visitor.avatar) && !hasImageError;

  useEffect(() => {
    setHasImageError(false);
  }, [visitor.avatar]);

  return (
    <span className="visitor-identity">
      {showImage ? (
        <img
          alt=""
          className="visitor-identity__avatar"
          loading="lazy"
          onError={() => setHasImageError(true)}
          src={visitor.avatar ?? undefined}
        />
      ) : (
        <span aria-hidden="true" className="visitor-identity__avatar-fallback">
          {getVisitorInitials(visitor)}
        </span>
      )}

      <span className="visitor-identity__copy">
        <span className="visitor-identity__name">{displayName}</span>
        <span className="visitor-identity__location">
          {formatVisitorLocation(visitor.location)}
        </span>
      </span>
    </span>
  );
}

export function getVisitorColumns(
  t: I18nDictionary,
): Array<DataTableColumn<VisitorApiData>> {
  return [
    {
      key: "visitor",
      label: t.visitor.table.visitor,
      render: (visitor) => <VisitorIdentity visitor={visitor} />,
      className: "visitor-table__cell--visitor",
      variant: "primary",
    },
    {
      key: "gender",
      label: t.visitor.table.gender,
      render: (visitor) => formatVisitorGender(visitor.gender, t),
      className: "visitor-table__cell--gender",
    },
    {
      key: "job",
      label: t.visitor.table.job,
      render: (visitor) => displayValue(visitor.job),
      className: "visitor-table__cell--job",
    },
    {
      key: "email",
      label: t.visitor.table.email,
      render: (visitor) => displayValue(visitor.email),
      className: "visitor-table__cell--email",
    },
    {
      key: "phone",
      label: t.visitor.table.phone,
      render: (visitor) => displayValue(visitor.phone),
      className: "visitor-table__cell--phone",
    },
  ];
}
