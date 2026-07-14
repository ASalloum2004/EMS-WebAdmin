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

export type BoothRequestDetailsApiData = BoothRequestApiData & {
  company: BoothRequestCompanyDetails;
  services: unknown[];
};

export type BoothRequestDetailsResponse = {
  status: boolean;
  message: string;
  data: BoothRequestDetailsApiData;
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
