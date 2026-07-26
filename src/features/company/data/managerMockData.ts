import adminAvatar from "../../../assets/AdminAppbar/Admin-avatar.svg";
import type { Manager, ManagerSummary } from "../types";

export const MANAGERS_PER_PAGE = 5;

export const MOCK_MANAGERS: Manager[] = [
  {
    id: 3,
    name: "Elcoach",
    email: "zuheiralhomsi73@gmail.com",
    avatar: null,
    companies_count: 6,
    booths_count: 2,
  },
  {
    id: 4,
    name: "Lina Haddad",
    email: "lina.haddad@northstar-events.com",
    avatar: adminAvatar,
    companies_count: 0,
    booths_count: 1,
  },
  {
    id: 5,
    name: "Omar Khalil",
    email: "omar.khalil@example.com",
    avatar: null,
    companies_count: 3,
    booths_count: 0,
  },
  {
    id: 6,
    name: "Nour Al-Deen Rahal",
    email: "nour.rahal@levant-exhibitions.example",
    avatar: adminAvatar,
    companies_count: 5,
    booths_count: 4,
  },
  {
    id: 7,
    name: "Maya Sayegh",
    email: "maya.sayegh@example.com",
    avatar: null,
    companies_count: 1,
    booths_count: 1,
  },
  {
    id: 8,
    name: "Rami Al-Ahmad",
    email: "rami.alahmad@eventbridge.example",
    avatar: null,
    companies_count: 2,
    booths_count: 0,
  },
  {
    id: 9,
    name: "Dalia Mansour",
    email: "dalia.mansour@example.com",
    avatar: adminAvatar,
    companies_count: 4,
    booths_count: 3,
  },
  {
    id: 10,
    name: "Samer Tabbal",
    email: "samer.tabbal@example.com",
    avatar: null,
    companies_count: 0,
    booths_count: 0,
  },
  {
    id: 11,
    name: "Hiba Al-Khatib",
    email: "hiba.alkhatib@regional-event-management.example",
    avatar: null,
    companies_count: 2,
    booths_count: 5,
  },
  {
    id: 12,
    name: "Karim Darwish",
    email: "karim.darwish@example.com",
    avatar: adminAvatar,
    companies_count: 7,
    booths_count: 2,
  },
  {
    id: 13,
    name: "Yara Othman",
    email: "yara.othman@example.com",
    avatar: null,
    companies_count: 1,
    booths_count: 0,
  },
  {
    id: 14,
    name: "Fadi Nassar",
    email: "fadi.nassar@forum-operations.example",
    avatar: null,
    companies_count: 3,
    booths_count: 1,
  },
];

export const MOCK_MANAGER_SUMMARY: ManagerSummary = MOCK_MANAGERS.reduce(
  (summary, manager) => ({
    totalManagers: summary.totalManagers + 1,
    managedCompanies: summary.managedCompanies + manager.companies_count,
    managedBooths: summary.managedBooths + manager.booths_count,
  }),
  {
    totalManagers: 0,
    managedCompanies: 0,
    managedBooths: 0,
  },
);
