export type NotificationStatus = "read" | "unread";
export type NotificationType = string;
export type NotificationView = "all" | "unread";
export type NotificationTargetId = number | string | null;

export interface NotificationApiData {
  body: string;
  created_at: string;
  id: string;
  read_at: string | null;
  target_id: NotificationTargetId;
  title: string;
  type: NotificationType;
}

export interface NotificationItem {
  createdAt: string;
  title: string;
  description: string;
  id: string;
  readAt: string | null;
  status: NotificationStatus;
  targetId: NotificationTargetId;
  type: NotificationType;
}

export type NotificationFilters = {
  type: "" | NotificationType;
};

export type NotificationsPagination = {
  currentPage: number;
  perPage: number;
  totalItems: number;
  totalPages: number;
};

export type GetNotificationsParams = {
  page?: number;
  perPage?: number;
  sort?: string;
  type?: NotificationType;
};

export type GetNotificationsResult = {
  notifications: NotificationItem[];
  pagination: NotificationsPagination;
};

export type NotificationsListResponse = {
  data: {
    current_page: number;
    data: NotificationApiData[];
    last_page: number;
    per_page: number;
    total: number;
  };
  message: string;
  status: boolean;
};

export interface NotificationStatisticsData {
  read_notifications: number;
  total_notifications: number;
  unread_notifications: number;
}

export type NotificationStatisticsResponse = {
  data: NotificationStatisticsData;
  message: string;
  status: boolean;
};

export type MarkAllNotificationsReadResponse = {
  data: null;
  message: string;
  status: boolean;
};

export type MarkNotificationReadResponse = unknown;

export type DeleteNotificationResponse = Record<string, never>;
