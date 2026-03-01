export type BookingStatus = "CREATED" | "CANCELLED" | "FINISHED" | "DELETED";

export interface Booking {
  id: string;
  businessId: string;
  branchId: string;
  appointments: string[];
  clientId: string;
  status: BookingStatus;
  totalPrice: number;
  createdAt: string;
  cancelledAt?: string;
  updatedAt?: string;
  deletedAt?: string;
}
