export type VisitorDateFilter = "any" | "today" | "last7Days" | "last30Days";

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

export interface VisitorStatistics {
  total_visitors: number;
  women_visitors: number;
  men_visitors: number;
}
