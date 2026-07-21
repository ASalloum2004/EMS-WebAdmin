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
  qr_token: string | null;
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
  data: {
    data: BoothApiData[];
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
};

export type BoothsPagination = {
  currentPage: number;
  perPage: number;
  totalItems: number;
  totalPages: number;
};

export type GetBoothsResult = {
  booths: BoothApiData[];
  pagination: BoothsPagination;
};

export type GetBoothsParams = {
  page?: number;
  perPage?: number;
};

export type EventHall = {
  id: number;
  number: string;
  area: number;
  price_per_hour: string;
};

export type EventHallEventApiData = {
  id: number;
  title: string;
  event_hall_id: number;
  type: string;
  status: string;
  start_at: string;
  end_at: string;
  duration: number;
  description: string;
  qr_token: string;
  created_at: string;
  logo: string | null;
};

export type EventHallEventDetails = Omit<
  EventHallEventApiData,
  "qr_token" | "logo"
>;

export type EventHallDetailsApiData = EventHall & {
  events: EventHallEventApiData[];
};

export type EventHallDetails = EventHall & {
  events: EventHallEventDetails[];
};

export type EventHallDetailsResponse = {
  status: boolean;
  message: string;
  data: EventHallDetailsApiData;
};

export type EventHallsResponse = {
  status: boolean;
  message: string;
  data: EventHall[];
};

export type GetEventHallsParams = {
  maxArea?: number;
  maxPrice?: number;
  minArea?: number;
  minPrice?: number;
};

export type EventHallClientFilters = {
  maxArea: string;
  maxPrice: string;
  minArea: string;
  minPrice: string;
};

export type UpdateEventHallPricePayload = {
  pricePerHour: number;
};

export type UpdateEventHallResponse = {
  status: boolean;
  message: string;
  data?: EventHall | null;
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
  currentPage?: number;
  perPage?: number;
  totalItems?: number;
  totalPages?: number;
};

export type ServicesResponse = {
  status: boolean;
  message: string;
  data: ServiceApiData[];
  meta?: {
    current_page?: number;
    per_page?: number;
    total?: number;
    last_page?: number;
  };
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
  isActive?: boolean;
  maxPrice?: number;
  minPrice?: number;
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
