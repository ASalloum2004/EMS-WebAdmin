import type { MangementItem } from "../types";

export const mockMangementItems: MangementItem[] = [
  {
    id: "hall-a-main-arena",
    title: "Hall A - Main Arena",
    description: "Primary exhibition space for major events",
    capacityLabel: "CAPACITY",
    capacity: "5,000 attendees",
    status: "Available",
  },
  {
    id: "hall-b-tech-pavilion",
    title: "Hall B - Tech Pavilion",
    description: "Dedicated space for tech exhibitors",
    capacityLabel: "CAPACITY",
    capacity: "2,500 attendees",
    status: "Fully Booked",
  },
  {
    id: "grand-ballroom",
    title: "Grand Ballroom",
    description: "Premium banquet and convention hall",
    capacityLabel: "CAPACITY",
    capacity: "1,200 attendees",
    status: "Available",
  },
];
