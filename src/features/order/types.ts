export type BoothRequestStatus = "pending" | "approved" | "rejected" | "cancelled";

export type BoothRequestSort = "" | "-created_at" | "created_at";

export type BoothRequestStatusFilter = "" | BoothRequestStatus;

export type BoothRequestFilters = {
  createdDate: string;
  sort: BoothRequestSort;
  status: BoothRequestStatusFilter;
};

type BoothRequestBaseApiData = {
  id: number;
  booth_id: number;
  company_id: number;
  status: BoothRequestStatus;
  reason_for_booking: string;
  final_price: number;
  created_at: string;
};

export type BoothRequestListCompanyApiData = {
  id: number;
  name: string | null;
  business_sector: string | null;
  phone: string | null;
  description: string | null;
  year_founded: number | null;
  social_links: BoothRequestCompanySocialLinksResponse | null;
  headquarters_lat: number | null;
  headquarters_lng: number | null;
  status: string | null;
};

export type BoothRequestApiData = BoothRequestBaseApiData & {
  company_name: string | null;
  company?: BoothRequestListCompanyApiData | null;
};

export type EventRequestStatus = "pending" | "approved" | "rejected" | "cancelled";

export type EventRequestSort = "" | "-created_at" | "created_at";

export type EventRequestStatusFilter = "" | EventRequestStatus;

export type EventRequestFilters = {
  createdDate: string;
  sort: EventRequestSort;
  status: EventRequestStatusFilter;
};

export type EventRequestApiData = {
  id: number;
  title: string;
  event_hall_id: number;
  type: string;
  status: string;
  start_at: string;
  end_at: string;
  duration: number;
  description: string;
  qr_token: string | null;
  created_at: string;
  logo: string | null;
};

export type EventRequestUiItem = Pick<
  EventRequestApiData,
  | "id"
  | "title"
  | "event_hall_id"
  | "type"
  | "status"
  | "start_at"
  | "end_at"
  | "created_at"
>;

export type EventRequestSocialLinksApiData = {
  linkedin?: string | null;
  website?: string | null;
};

export type EventRequestOrganizerSocialLinks = Required<
  EventRequestSocialLinksApiData
>;

export type EventRequestOrganizerApiData = {
  id: number;
  avatar?: string | null;
  name?: string | null;
  email?: string | null;
  business_sector?: string | null;
  phone?: string | null;
  description?: string | null;
  year_founded?: number | null;
  social_links?: EventRequestSocialLinksApiData | [] | null;
  headquarters_lat?: number | string | null;
  headquarters_lng?: number | string | null;
  status?: string | null;
};

export type EventRequestOrganizerDetails = {
  id: number;
  avatar: string | null;
  name: string | null;
  email: string | null;
  business_sector: string | null;
  phone: string | null;
  description: string | null;
  year_founded: number | null;
  social_links: EventRequestOrganizerSocialLinks | null;
  status: string | null;
};

export type EventRequestSpeakerApiData = {
  avatar?: unknown;
  avatar_url?: unknown;
  id: number;
  image?: unknown;
  image_path?: unknown;
  image_url?: unknown;
  media?: unknown;
  name: string | null;
  photo?: unknown;
  photo_url?: unknown;
  profile_image?: unknown;
  profile_image_url?: unknown;
  profile_photo?: unknown;
  profile_photo_url?: unknown;
};

export type EventRequestSpeakerDetails = {
  id: number;
  name: string | null;
  avatar: string | null;
};

export type EventRequestMetricApiValue = number | string | null;

export type EventRequestEngagementApiData = {
  average_rating?: EventRequestMetricApiValue;
  avg_rating?: EventRequestMetricApiValue;
  engagement?: EventRequestEngagementApiData | null;
  favorites_count?: EventRequestMetricApiValue;
  qr_scans?: EventRequestMetricApiValue;
  qr_scans_count?: EventRequestMetricApiValue;
  ratings_avg_rating?: EventRequestMetricApiValue;
  saved_count?: EventRequestMetricApiValue;
  saves_count?: EventRequestMetricApiValue;
  scans_count?: EventRequestMetricApiValue;
  statistics?: EventRequestEngagementApiData | null;
  stats?: EventRequestEngagementApiData | null;
};

export type EventRequestDetailsApiData = {
  id: number;
  title: string | null;
  event_hall_id: number | null;
  type: string | null;
  status: string | null;
  start_at?: string | null;
  end_at?: string | null;
  duration?: number | null;
  description?: string | null;
  qr_token?: string | null;
  eventable?: EventRequestOrganizerApiData | null;
  speakers?: EventRequestSpeakerApiData[] | null;
  average_rating?: EventRequestMetricApiValue;
  engagement?: EventRequestEngagementApiData | null;
  event?: EventRequestEngagementApiData | null;
  qr_scans_count?: EventRequestMetricApiValue;
  saved_count?: EventRequestMetricApiValue;
  statistics?: EventRequestEngagementApiData | null;
  stats?: EventRequestEngagementApiData | null;
  created_at?: string | null;
  logo?: string | null;
};

export type EventRequestDetails = {
  id: number;
  title: string | null;
  event_hall_id: number | null;
  type: string | null;
  status: string | null;
  start_at: string | null;
  end_at: string | null;
  duration: number | null;
  description: string | null;
  qr_token: string | null;
  eventable: EventRequestOrganizerDetails | null;
  speakers: EventRequestSpeakerDetails[];
  average_rating: number | null;
  qr_scans_count: number | null;
  saved_count: number | null;
  created_at: string | null;
  logo: string | null;
};

export type EventRequestDetailsResponse = {
  status: boolean;
  message: string;
  data: EventRequestDetailsApiData;
};

export type EventRequestActionResponse = {
  status: true;
  message: string;
  data: null;
};

export type ApproveEventRequestPayload = {
  force: boolean;
};

export type ApproveEventRequestOptions = {
  force: boolean;
  page?: number;
};

export type EventRequestConflictOrganizer = {
  name: string | null;
};

export type EventRequestConflict = {
  id: number;
  title: string | null;
  event_hall_id: number | null;
  type: string | null;
  status: EventRequestStatus | null;
  start_at: string | null;
  end_at: string | null;
  duration: number | null;
  created_at: string | null;
  eventable: EventRequestConflictOrganizer | null;
};

export type EventRequestConflictMeta = {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
};

export type ApproveEventRequestResult =
  | {
      kind: "approved";
      response: EventRequestActionResponse;
    }
  | {
      kind: "conflict";
      message: string | null;
      requests: EventRequestConflict[];
      meta: EventRequestConflictMeta;
    };

export type ApproveEventRequestConflictState = {
  message: string | null;
  meta: EventRequestConflictMeta;
  requestId: number;
  requests: EventRequestConflict[];
};

export type BoothRequestCompanySocialLinks = {
  linkedin: string;
  website: string;
};

export type BoothRequestCompanySocialLinksResponse = {
  linkedin?: string | null;
  website?: string | null;
};

export type BoothRequestCompanyDetails = {
  business_sector: string;
  description: string;
  gallery: string[];
  headquarters_lat: number;
  headquarters_lng: number;
  id: number;
  logo: string;
  name: string;
  phone: string;
  social_links: BoothRequestCompanySocialLinks;
  status: string;
  year_founded: number;
};

export type BoothRequestCompanyDetailsResponse = Omit<
  BoothRequestCompanyDetails,
  | "business_sector"
  | "description"
  | "gallery"
  | "logo"
  | "name"
  | "phone"
  | "social_links"
  | "status"
> & {
  business_sector?: string | null;
  description?: string | null;
  gallery?: unknown[] | null;
  logo?: string | null;
  name?: string | null;
  phone?: string | null;
  social_links?: BoothRequestCompanySocialLinksResponse | null;
  status?: string | null;
};

export type BoothRequestService = {
  id: number | null;
  name: string;
  quantity?: number | null;
  total_price?: number | null;
  unit_price?: number | null;
};

export type BoothRequestServiceResponse =
  | string
  | {
      data?: unknown;
      details?: unknown;
      id?: number | string | null;
      name?: unknown;
      quantity?: number | string | null;
      service?: unknown;
      service_id?: number | string | null;
      service_name?: unknown;
      total_price?: number | string | null;
      title?: unknown;
      unit_price?: number | string | null;
    };

export type BoothRequestDetailsApiData = BoothRequestBaseApiData & {
  company: BoothRequestCompanyDetails;
  services: BoothRequestService[];
};

export type BoothRequestDetailsResponseData = Omit<
  BoothRequestDetailsApiData,
  "company" | "created_at" | "reason_for_booking" | "services"
> & {
  company: BoothRequestCompanyDetailsResponse;
  created_at?: string | null;
  reason_for_booking?: string | null;
  services: BoothRequestServiceResponse[];
};

export type BoothRequestDetailsResponse = {
  status: boolean;
  message: string;
  data: BoothRequestDetailsResponseData;
};

export type BoothRequestActionResponse = {
  status: boolean;
  message: string;
  data: null;
};

export type ApproveBoothRequestPayload = {
  force: boolean;
};

export type ApproveBoothRequestResponse = {
  status: true;
  message: string;
  data: null;
};

export type ApproveBoothRequestOptions = {
  force: boolean;
  page?: number;
};

export type BoothRequestConflict = {
  booth_id: number | null;
  company_id: number | null;
  final_price: number | null;
  id: number | null;
  status: BoothRequestStatus | null;
};

export type BoothRequestConflictMeta = {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
};

export type ApproveBoothRequestResult =
  | {
      kind: "approved";
      response: ApproveBoothRequestResponse;
    }
  | {
      kind: "conflict";
      message: string;
      requests: BoothRequestConflict[];
      meta: BoothRequestConflictMeta;
    };

export type ApproveBoothRequestConflictState = {
  message: string;
  meta: BoothRequestConflictMeta;
  requestId: number;
  requests: BoothRequestConflict[];
};

export type BoothRequestStatisticsData = {
  total_requests: number;
  pending_requests: number;
  approved_requests: number;
};

export type OrderSummaryStatistics = {
  approved: number | null;
  pending: number | null;
  total: number | null;
};

export function getOrderSummaryStatistics(
  statistics: BoothRequestStatisticsData | null,
): OrderSummaryStatistics {
  return {
    approved: statistics?.approved_requests ?? null,
    pending: statistics?.pending_requests ?? null,
    total: statistics?.total_requests ?? null,
  };
}

export type BoothRequestStatisticsResponse = {
  status: boolean;
  message: string;
  data: BoothRequestStatisticsData;
};

export interface EventRequestStatsResponse {
  status: boolean;
  message: string;
  data: {
    total_requests: number;
    pending_requests: number;
    approved_requests: number;
    rejected_requests: number;
  };
}

export type EventRequestStatsData = EventRequestStatsResponse["data"];

export function getEventRequestSummaryStatistics(
  statistics: EventRequestStatsData | null,
): OrderSummaryStatistics {
  return {
    approved: statistics?.approved_requests ?? null,
    pending: statistics?.pending_requests ?? null,
    total: statistics?.total_requests ?? null,
  };
}

export type BoothRequestsResponse = {
  status: boolean;
  message: string;
  data: {
    data: BoothRequestApiData[];
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
};

export type BoothRequestsPagination = {
  currentPage: number;
  perPage: number;
  totalItems: number;
  totalPages: number;
};

export type GetBoothRequestsResult = {
  requests: BoothRequestApiData[];
  pagination: BoothRequestsPagination;
};

export type GetBoothRequestsParams = {
  companyName?: string;
  createdDate?: string;
  page?: number;
  perPage?: number;
  sort?: Exclude<BoothRequestSort, "">;
  status?: BoothRequestStatus;
};

export type EventRequestsResponse = {
  status: boolean;
  message: string;
  data: {
    data: EventRequestApiData[];
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
};

export type EventRequestsPagination = {
  currentPage: number;
  perPage: number;
  totalItems: number;
  totalPages: number;
};

export type GetEventRequestsResult = {
  requests: EventRequestUiItem[];
  pagination: EventRequestsPagination;
};

export type GetEventRequestsParams = {
  createdDate?: string;
  page?: number;
  perPage?: number;
  sort?: Exclude<EventRequestSort, "">;
  status?: EventRequestStatus;
  title?: string;
};
