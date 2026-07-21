import type { I18nDictionary, SupportedLanguage } from "../../../../i18n";
import { getTrimmedString } from "../../utils/getTrimmedString";
import {
  formatEventRequestCreatedDate,
  formatEventRequestDateTime,
} from "../eventRequestTableColumns";

const knownEventTypes = ["conference", "lecture", "workshop", "other"] as const;
const knownStatuses = ["approved", "pending", "rejected"] as const;

type KnownEventType = (typeof knownEventTypes)[number];
type KnownStatus = (typeof knownStatuses)[number];

export function classNames(
  ...classes: Array<string | false | null | undefined>
) {
  return classes.filter(Boolean).join(" ");
}

function isKnownEventType(value: string): value is KnownEventType {
  return knownEventTypes.some((knownType) => knownType === value);
}

function isKnownStatus(value: string): value is KnownStatus {
  return knownStatuses.some((knownStatus) => knownStatus === value);
}

function formatBackendValue(value: unknown, fallback: string) {
  const normalizedValue = getTrimmedString(value).replace(/[_-]+/g, " ");

  if (!normalizedValue) {
    return fallback;
  }

  return normalizedValue.replace(/\b\w/g, (character) =>
    character.toUpperCase(),
  );
}

export function getTypeLabel(value: unknown, t: I18nDictionary) {
  const normalizedType = getTrimmedString(value).toLowerCase();

  return isKnownEventType(normalizedType)
    ? t.order.eventRequests.table.types[normalizedType]
    : formatBackendValue(value, t.order.eventRequests.details.notAvailable);
}

export function getStatusLabel(value: unknown, t: I18nDictionary) {
  const normalizedStatus = getTrimmedString(value).toLowerCase();

  return isKnownStatus(normalizedStatus)
    ? t.order.status[normalizedStatus]
    : formatBackendValue(value, t.order.eventRequests.details.unknownStatus);
}

export function getStatusModifier(value: unknown) {
  const normalizedStatus = getTrimmedString(value).toLowerCase();

  return isKnownStatus(normalizedStatus) ? normalizedStatus : "unknown";
}

export function getSafeExternalUrl(value: unknown) {
  const normalizedValue = getTrimmedString(value);

  try {
    const url = new URL(normalizedValue);

    return url.protocol === "https:" || url.protocol === "http:"
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

export function getSafeTelephoneUrl(value: unknown) {
  const phone = getTrimmedString(value);

  if (!phone || !/^[+\d][\d\s().-]*$/.test(phone)) {
    return null;
  }

  const normalizedPhone = phone.replace(/[^+\d]/g, "");

  return normalizedPhone ? `tel:${normalizedPhone}` : null;
}

export function getInitials(value: unknown) {
  const initials = getTrimmedString(value)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return initials || "—";
}

export function formatDateTime(
  value: string | null,
  language: SupportedLanguage,
  t: I18nDictionary,
) {
  return value
    ? formatEventRequestDateTime(
        value,
        language,
        t.order.eventRequests.details.invalidDate,
      )
    : t.order.eventRequests.details.notAvailable;
}

export function formatCreatedDate(
  value: string | null,
  language: SupportedLanguage,
  t: I18nDictionary,
) {
  return value
    ? formatEventRequestCreatedDate(
        value,
        language,
        t.order.eventRequests.details.invalidDate,
      )
    : t.order.eventRequests.details.notAvailable;
}

export function formatDuration(
  duration: number | null,
  language: SupportedLanguage,
  t: I18nDictionary,
) {
  if (duration === null || !Number.isFinite(duration)) {
    return t.order.eventRequests.details.notAvailable;
  }

  const formattedDuration = new Intl.NumberFormat(
    language === "ar" ? "ar-SY" : "en-US",
  ).format(duration);
  const unit =
    duration === 1
      ? t.order.eventRequests.details.hour
      : t.order.eventRequests.details.hours;

  return `${formattedDuration} ${unit}`;
}

export function formatNumber(
  value: number | null,
  language: SupportedLanguage,
  fallback: string,
  maximumFractionDigits = 0,
) {
  if (value === null || !Number.isFinite(value)) {
    return fallback;
  }

  return new Intl.NumberFormat(language === "ar" ? "ar-SY" : "en-US", {
    maximumFractionDigits,
  }).format(value);
}
