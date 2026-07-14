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

export type BoothRequestServiceViewModel = {
  category: string;
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
};

export type BoothRequestCompanyViewModel = {
  description: string;
  headquarters: string;
  industry: string;
  initials: string;
  isVerified: boolean;
  name: string;
};

export type BoothRequestContactViewModel = {
  email: string;
  name: string;
  phone: string;
  position: string;
  socialLinks: {
    instagram: string;
    linkedin: string;
    website: string;
  };
};

export type BoothRequestDetailsViewModel = {
  company: BoothRequestCompanyViewModel;
  contact: BoothRequestContactViewModel;
  currency: string;
  notes: string;
  requestType: string;
  services: BoothRequestServiceViewModel[];
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
