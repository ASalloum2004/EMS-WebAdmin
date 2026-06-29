export type MangementItemStatus = "Available" | "Fully Booked";

export type MangementItem = {
  id: string;
  title: string;
  description: string;
  capacityLabel: string;
  capacity: string;
  status: MangementItemStatus;
};
