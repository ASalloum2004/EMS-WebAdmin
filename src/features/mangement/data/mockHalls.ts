import type { HallApiData } from "../types";

export const mockHalls: HallApiData[] = [
  {
    id: 1,
    number: "Main-1",
    area: 1500,
    type: "exhibition",
    svg_id: "hall-main-1",
  },
  {
    id: 2,
    number: "Tech-1",
    area: 900,
    type: "conference",
    svg_id: "hall-tech-1",
  },
  {
    id: 3,
    number: "Grand-1",
    area: 1200,
    type: "ballroom",
    svg_id: "hall-grand-1",
  },
];
