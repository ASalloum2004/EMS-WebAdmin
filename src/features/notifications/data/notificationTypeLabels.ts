import type { I18nDictionary } from "../../../i18n";
import type { NotificationType } from "../types";

export function getNotificationTypeLabel(
  type: NotificationType,
  t: I18nDictionary,
) {
  const labels: Record<string, string> = {
    booth_booking_request_created:
      t.notifications.notificationTypes.boothBookingRequestCreated,
    error: t.notifications.notificationTypes.error,
    event_booking_request_created:
      t.notifications.notificationTypes.eventBookingRequestCreated,
    info: t.notifications.notificationTypes.info,
    report_created: t.notifications.notificationTypes.reportCreated,
    success: t.notifications.notificationTypes.success,
    warning: t.notifications.notificationTypes.warning,
  };

  return labels[type] ?? type.replace(/_/g, " ");
}
