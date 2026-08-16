import type { NotificationItem, NotificationTargetId } from "../types";

export type NotificationTarget = {
  href: string;
  id: number;
};

function getPositiveInteger(targetId: NotificationTargetId) {
  if (typeof targetId === "number") {
    return Number.isSafeInteger(targetId) && targetId > 0 ? targetId : null;
  }

  if (typeof targetId !== "string" || !/^\d+$/.test(targetId.trim())) {
    return null;
  }

  const parsedTargetId = Number(targetId);

  return Number.isSafeInteger(parsedTargetId) && parsedTargetId > 0
    ? parsedTargetId
    : null;
}

export function getNotificationTarget(
  notification: NotificationItem,
): NotificationTarget | null {
  const targetId = getPositiveInteger(notification.targetId);

  if (targetId === null) {
    return null;
  }

  if (notification.type === "report_created") {
    return { href: `/reports?reportId=${targetId}`, id: targetId };
  }

  if (notification.type === "booth_booking_request_created") {
    return {
      href: `/orders?tab=booth&boothRequestId=${targetId}`,
      id: targetId,
    };
  }

  if (notification.type === "event_booking_request_created") {
    return {
      href: `/orders?tab=event&eventRequestId=${targetId}`,
      id: targetId,
    };
  }

  return null;
}
