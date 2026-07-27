export type ActivityTab = "notifications" | "reports";

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

export type ReportStatus = "pending" | "in_review" | "resolved";
export type ReportType = "issue" | "complaint" | "safety" | "other";

export interface ReportItem {
  id: number;
  title: string;
  description: string;
  type: ReportType;
  status: ReportStatus;
  createdAt: string;
}

export type ActivityItem = NotificationItem | ReportItem;

export type NotificationFilters = {
  status: "" | NotificationStatus;
  type: "" | NotificationType;
};

export type ReportFilters = {
  status: "" | ReportStatus;
  type: "" | ReportType;
};

export type ActivityFilterValues = {
  status: string;
  type: string;
};
