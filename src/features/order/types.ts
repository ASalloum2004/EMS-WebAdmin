export type OrderStatus = "pending" | "approved" | "rejected";

export type OrderType = "boothBooking" | "serviceOrder";

export type OrderPresentationItem = {
  companyInitials: string;
  companyName: string;
  requestDate: string;
  requestId: string;
  status: OrderStatus;
  type: OrderType;
};
