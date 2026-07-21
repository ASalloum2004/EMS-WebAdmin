import type { DataTableColumn } from "../../../components";
import type { I18nDictionary, SupportedLanguage } from "../../../i18n";
import type { EventRequestUiItem } from "../types";
import { formatRequestDate } from "./orderTableColumns";
import "./eventRequestTableColumns.scss";

const knownStatuses = ["approved", "pending", "rejected"] as const;

type KnownStatus = (typeof knownStatuses)[number];

function isKnownStatus(status: string): status is KnownStatus {
  return knownStatuses.some((knownStatus) => knownStatus === status);
}

function formatBackendValue(value: string, fallback: string) {
  const normalizedValue = value.trim().replace(/[_-]+/g, " ");

  if (!normalizedValue) {
    return fallback;
  }

  return normalizedValue.replace(/\b\w/g, (character) =>
    character.toUpperCase(),
  );
}

export function formatEventRequestDateTime(
  value: string,
  language: SupportedLanguage,
  invalidDateLabel: string,
) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return invalidDateLabel;
  }

  return new Intl.DateTimeFormat(language === "ar" ? "ar-SY" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function formatEventRequestCreatedDate(
  value: string,
  language: SupportedLanguage,
  invalidDateLabel: string,
) {
  if (Number.isNaN(new Date(value).getTime())) {
    return invalidDateLabel;
  }

  return formatRequestDate(value, language);
}

function getEventTypeLabel(type: string, t: I18nDictionary) {
  return type.trim().toLowerCase() === "conference"
    ? t.order.eventRequests.table.types.conference
    : formatBackendValue(type, t.order.eventRequests.table.unknownValue);
}

function getEventStatusLabel(status: string, t: I18nDictionary) {
  const normalizedStatus = status.trim().toLowerCase();

  return isKnownStatus(normalizedStatus)
    ? t.order.status[normalizedStatus]
    : formatBackendValue(status, t.order.eventRequests.table.unknownValue);
}

function getEventStatusClassName(status: string) {
  const normalizedStatus = status.trim().toLowerCase();

  return isKnownStatus(normalizedStatus)
    ? `order-status order-status--${normalizedStatus}`
    : "order-status order-status--unknown";
}

export function getEventRequestSearchValues(
  request: EventRequestUiItem,
  t: I18nDictionary,
) {
  return [
    request.id,
    request.title,
    request.event_hall_id,
    request.type,
    getEventTypeLabel(request.type, t),
    request.status,
    getEventStatusLabel(request.status, t),
  ];
}

export function getEventRequestColumns(
  t: I18nDictionary,
  language: SupportedLanguage,
): Array<DataTableColumn<EventRequestUiItem>> {
  const translations = t.order.eventRequests.table;

  return [
    {
      key: "title",
      label: translations.eventTitle,
      render: (request) => request.title,
      supportingText: (request) => (
        <span aria-label={`${translations.requestId}: ${request.id}`}>
          {translations.requestPrefix} #{request.id}
        </span>
      ),
      variant: "primary",
    },
    {
      key: "event",
      className: "event-request-table__cell--event",
      label: translations.eventHall,
      render: (request) => (
        <span className="event-request-table__stack">
          <span>
            {translations.eventHallPrefix} #{request.event_hall_id}
          </span>
          <span
            aria-label={`${translations.eventType}: ${getEventTypeLabel(request.type, t)}`}
            className="event-request-table__type-badge"
          >
            {getEventTypeLabel(request.type, t)}
          </span>
        </span>
      ),
      variant: "metric",
    },
    {
      key: "start_at",
      className: "event-request-table__cell--start",
      label: translations.startTime,
      render: (request) =>
        formatEventRequestDateTime(
          request.start_at,
          language,
          translations.invalidDate,
        ),
      variant: "metric",
    },
    {
      key: "end_at",
      className: "event-request-table__cell--end",
      label: translations.endTime,
      render: (request) =>
        formatEventRequestDateTime(
          request.end_at,
          language,
          translations.invalidDate,
        ),
      variant: "metric",
    },
    {
      key: "created_at",
      className: "event-request-table__cell--created",
      label: translations.createdAt,
      render: (request) =>
        formatEventRequestCreatedDate(
          request.created_at,
          language,
          translations.invalidDate,
        ),
      variant: "metric",
    },
    {
      key: "status",
      className: "event-request-table__cell--status",
      label: translations.eventStatus,
      render: (request) => {
        const statusLabel = getEventStatusLabel(request.status, t);

        return (
          <span
            aria-label={`${translations.eventStatus}: ${statusLabel}`}
            className={getEventStatusClassName(request.status)}
          >
            {statusLabel}
          </span>
        );
      },
      variant: "badge",
    },
  ];
}
