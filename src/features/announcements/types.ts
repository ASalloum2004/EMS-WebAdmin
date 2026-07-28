export type AnnouncementReceiver =
  | "exhibitors"
  | "visitors"
  | "all"
  | "unknown";

export type AnnouncementFormReceiver = Exclude<
  AnnouncementReceiver,
  "unknown"
>;

export interface Announcement {
  id: number;
  title: string;
  description: string;
  receiver: AnnouncementReceiver;
  isDraft: boolean;
  media: string | null;
}

export interface AnnouncementApiDto {
  id: number;
  title: string;
  description: string;
  receiver: string;
  is_active: boolean;
  media: string | null;
}

export interface AnnouncementListResponse {
  status: boolean;
  message: string;
  data: {
    data: AnnouncementApiDto[];
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
}

export interface AnnouncementDetailsResponse {
  status: boolean;
  message: string;
  data: AnnouncementApiDto;
}

export interface AnnouncementPagination {
  currentPage: number;
  perPage: number;
  totalItems: number;
  totalPages: number;
}

export interface GetAnnouncementsParams {
  isDraft?: boolean;
  page?: number;
  perPage?: number;
  receiver?: AnnouncementFormReceiver;
  title?: string;
}

export interface GetAnnouncementsResult {
  announcements: Announcement[];
  pagination: AnnouncementPagination;
}

export interface AnnouncementFormValues {
  title: string;
  description: string;
  receiver: AnnouncementFormReceiver;
  isDraft: boolean;
  mediaFile: File | null;
}

export type AnnouncementMediaUpdate = "preserve" | "replace" | "remove";

export interface AnnouncementUpdateValues extends AnnouncementFormValues {
  mediaUpdate: AnnouncementMediaUpdate;
}

export interface AnnouncementActionResult {
  message: string;
}

export interface AnnouncementFieldErrors {
  description?: string;
  isDraft?: string;
  media?: string;
  receiver?: string;
  title?: string;
}

export type AnnouncementDraftFilter = "" | "draft" | "published";

export interface AnnouncementFilters {
  draftStatus: AnnouncementDraftFilter;
  receiver: "" | AnnouncementFormReceiver;
}
