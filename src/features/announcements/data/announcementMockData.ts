import type { Announcement } from "../types";

export const announcementMockData: Announcement[] = [
  {
    id: 101,
    title: "Welcome, Exhibitors",
    description:
      "Your exhibitor workspace is ready. Review the venue guidance before preparing your booth.",
    receiver: "Exhibitors",
    is_active: true,
    media: null,
  },
  {
    id: 102,
    title: "Visitor Registration Guide",
    description:
      "Registration guidance is now available for visitors planning their fair experience.",
    receiver: "visitors",
    is_active: true,
    media: "visitor-registration-guide.pdf",
  },
  {
    id: 103,
    title: "Platform Maintenance Notice",
    description:
      "Some platform tools may be temporarily unavailable while scheduled maintenance is completed.",
    receiver: "all",
    is_active: false,
    media: null,
  },
  {
    id: 104,
    title: "Event Program Update",
    description:
      "The event program has been updated with the latest sessions and venue information.",
    receiver: "All",
    is_active: true,
    media: "event-program.pdf",
  },
  {
    id: 105,
    title: "Safety and Venue Access",
    description:
      "Please review the venue access instructions and safety guidance before arriving.",
    receiver: "visitors",
    is_active: true,
    media: null,
  },
  {
    id: 106,
    title: "Networking Lounge",
    description:
      "Exhibitors can use the networking lounge to meet partners and connect with other participants.",
    receiver: "exhibitors",
    is_active: false,
    media: null,
  },
];

