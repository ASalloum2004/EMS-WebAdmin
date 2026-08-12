export type NotificationStatus = "read" | "unread";
export type NotificationType = "success" | "warning" | "error" | "info";

export interface NotificationItem {
  id: number;
  title: string;
  description: string;
  type: NotificationType;
  status: NotificationStatus;
  createdAt: string;
}

export type NotificationFilters = {
  status: "" | NotificationStatus;
  type: "" | NotificationType;
};
