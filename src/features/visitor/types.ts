export type VisitorGender = "male" | "female";

export type VisitorGenderFilter = "" | VisitorGender;

export interface VisitorFilters {
  gender: VisitorGenderFilter;
  job: string;
  location: string;
}

export interface VisitorApiData {
  id: number;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  job: string | null;
  location: string | null;
  birthday: string | null;
  gender: string | null;
  created_at: string;
  avatar: string | null;
}

export interface VisitorPaginationData {
  data: VisitorApiData[];
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
}

export interface VisitorApiResponse {
  status: boolean;
  message: string;
  data: VisitorPaginationData;
}

export interface VisitorPagination {
  currentPage: number;
  perPage: number;
  totalItems: number;
  totalPages: number;
}

export interface GetVisitorsResult {
  visitors: VisitorApiData[];
  pagination: VisitorPagination;
}

export interface GetVisitorsParams {
  gender?: VisitorGender;
  job?: string;
  location?: string;
  page?: number;
  perPage?: number;
  search?: string;
}

export interface VisitorStatisticsData {
  total_visitors: number;
  male_visitors: number;
  female_visitors: number;
}

export interface VisitorStatisticsResponse {
  status: boolean;
  message: string;
  data: VisitorStatisticsData;
}
