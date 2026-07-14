export const orderStatusTabs = [
  "all",
  "pending",
  "approved",
  "rejected",
] as const;

export type OrderStatusTab = (typeof orderStatusTabs)[number];
export type OrderStatus = Exclude<OrderStatusTab, "all">;

export type OrderType = "boothBooking" | "serviceOrder";

export type OrderDateFilter = "all" | "today" | "thisWeek" | "thisMonth";
export type OrderTypeFilter = "all" | OrderType;

export type OrderPresentationItem = {
  companyInitials: string;
  companyName: string;
  requestDate: string;
  requestId: string;
  status: OrderStatus;
  type: OrderType;
};
