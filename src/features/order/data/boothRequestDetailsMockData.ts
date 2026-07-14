import type { BoothRequestDetailsViewModel } from "../types";

// Temporary presentation-only values. Replace this object with the details
// endpoint mapping once that endpoint is connected.
export const boothRequestDetailsMockData: BoothRequestDetailsViewModel = {
  company: {
    description:
      "Nexora builds connected event experiences and digital tools that help organizations engage their audiences.",
    headquarters: "Damascus, Syria",
    industry: "Technology & Digital Solutions",
    initials: "NT",
    isVerified: true,
    name: "Nexora Technologies",
  },
  contact: {
    email: "maya.hassan@nexora.example",
    name: "Maya Hassan",
    phone: "+963 11 555 0142",
    position: "Partnerships Manager",
    socialLinks: {
      instagram: "https://www.instagram.com/",
      linkedin: "https://www.linkedin.com/",
      website: "https://example.com/",
    },
  },
  currency: "USD",
  notes:
    "We would like a booth close to the main presentation area, with reliable connectivity for live product demonstrations throughout the event.",
  requestType: "Exhibition booth reservation",
  services: [
    {
      category: "Connectivity",
      id: "high-speed-internet",
      name: "High-speed internet",
      quantity: 1,
      unitPrice: 125,
    },
    {
      category: "Booth essentials",
      id: "furniture-package",
      name: "Exhibition furniture package",
      quantity: 2,
      unitPrice: 85,
    },
  ],
};
