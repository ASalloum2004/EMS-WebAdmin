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
