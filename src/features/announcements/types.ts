export type AnnouncementReceiver = "exhibitors" | "visitors" | "all";

export type Announcement = {
  id: number;
  title: string;
  description: string;
  receiver: string;
  is_active: boolean;
  media: string | null;
};

export type AnnouncementDraft = Omit<Announcement, "id">;

export type AnnouncementPaginationMeta = {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
};

