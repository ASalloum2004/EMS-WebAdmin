export type HallApiData = {
  id: number;
  number: string;
  area: number;
  type: string;
  svg_id: string;
};

export type HallsResponse = {
  status: boolean;
  message: string;
  data: HallApiData[];
};

export type BoothApiData = {
  id: number;
  number: string;
  qr_token: string;
  area: number;
  price: string;
  svg_id: string;
  created_at: string;
  is_booked: boolean;
};

export type BoothBookedFilter = "" | "booked" | "available";

export type BoothClientFilters = {
  booked: BoothBookedFilter;
  maxArea: string;
  maxPrice: string;
  minArea: string;
  minPrice: string;
  number: string;
};

export type BoothsResponse = {
  status: boolean;
  message: string;
  data: BoothApiData[];
};

export type UpdateBoothPayload = {
  number: string;
  area: number;
  price: number;
};

export type UpdateBoothResponse = {
  status: boolean;
  message: string;
  data: BoothApiData;
};

export type ServiceApiData = {
  id: number;
  name: string;
  price: string | number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
};

export type PaginationMeta = {
  current_page?: number;
  per_page?: number;
  total?: number;
  last_page?: number;
};

export type ServicesResponse = {
  status: boolean;
  message: string;
  data: ServiceApiData[];
  meta?: PaginationMeta;
  links?: Record<string, unknown>;
  current_page?: number;
  per_page?: number;
  total?: number;
  last_page?: number;
};

export type GetServicesResult = {
  services: ServiceApiData[];
  pagination: PaginationMeta;
};

export type GetServicesParams = {
  name?: string;
  perPage?: number;
  page?: number;
  sort?: string;
};

export type CreateServicePayload = {
  name: string;
  price: number;
};

export type UpdateServicePayload = {
  name: string;
  price: number;
  is_active: boolean;
};

export type ServiceResponse = {
  status: boolean;
  message: string;
  data: ServiceApiData;
};
