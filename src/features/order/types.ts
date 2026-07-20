export type BoothRequestStatus = "pending" | "approved" | "rejected";

export type BoothRequestSort = "" | "-created_at" | "created_at";

export type BoothRequestStatusFilter = "" | BoothRequestStatus;

export type BoothRequestFilters = {
  createdDate: string;
  sort: BoothRequestSort;
  status: BoothRequestStatusFilter;
};

export type BoothRequestApiData = {
  id: number;
  booth_id: number;
  company_id: number;
  status: BoothRequestStatus;
  reason_for_booking: string;
  final_price: number;
  created_at: string;
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
  gallery: unknown[];
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
  | "logo"
  | "name"
  | "phone"
  | "social_links"
  | "status"
> & {
  business_sector?: string | null;
  description?: string | null;
  logo?: string | null;
  name?: string | null;
  phone?: string | null;
  social_links?: BoothRequestCompanySocialLinksResponse | null;
  status?: string | null;
};

export type BoothRequestDetailsApiData = BoothRequestApiData & {
  company: BoothRequestCompanyDetails;
  services: unknown[];
};

export type BoothRequestDetailsResponseData = Omit<
  BoothRequestDetailsApiData,
  "company" | "created_at" | "reason_for_booking"
> & {
  company: BoothRequestCompanyDetailsResponse;
  created_at?: string | null;
  reason_for_booking?: string | null;
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
  force: false;
};

export type ApproveBoothRequestResponse = {
  status: true;
  message: string;
  data: null;
};

export type BoothRequestStatisticsData = {
  total_requests: number;
  pending_requests: number;
  approved_requests: number;
};

export type BoothRequestStatisticsResponse = {
  status: boolean;
  message: string;
  data: BoothRequestStatisticsData;
};

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
  createdDate?: string;
  page?: number;
  perPage?: number;
  sort?: Exclude<BoothRequestSort, "">;
  status?: BoothRequestStatus;
};
