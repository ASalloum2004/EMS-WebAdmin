export type VolunteerApplicationStatus = "pending" | "approved" | "rejected";

export type VolunteerApplication = {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  status: VolunteerApplicationStatus | null;
  createdAt: string | null;
};

export type VolunteerApplicationCv = {
  id: number;
  name: string;
  mimeType: string | null;
  size: number | null;
  url: string;
};

export type VolunteerApplicationDetails = VolunteerApplication & {
  motivation: string | null;
  educationOrOccupation: string | null;
  skills: string | null;
  city: string | null;
  privacyConsentAt: string | null;
  cv: VolunteerApplicationCv | null;
  reviewedAt: string | null;
  reviewNote: string | null;
  reviewer: { id: number; name: string; email: string } | null;
  whatsappNotification: { sentAt: string | null; failedAt: string | null };
  updatedAt: string | null;
};

export type VolunteerApplicationsPagination = {
  currentPage: number;
  perPage: number;
  totalItems: number;
  totalPages: number;
};

export type GetVolunteerApplicationsParams = {
  page?: number;
  perPage?: number;
  search?: string;
  status?: VolunteerApplicationStatus;
  sort?: "created_at" | "-created_at" | "full_name" | "-full_name" | "status" | "-status";
};

export type GetVolunteerApplicationsResult = {
  applications: VolunteerApplication[];
  pagination: VolunteerApplicationsPagination;
};

export type VolunteerApplicationStatistics = {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
};
