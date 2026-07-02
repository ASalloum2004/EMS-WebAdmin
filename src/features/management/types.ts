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
