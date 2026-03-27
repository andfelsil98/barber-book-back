export const BOOKING_STATUSES = [
  "CREATED",
  "CANCELLED",
  "FINISHED",
  "DELETED",
] as const;

export type BookingStatus = (typeof BOOKING_STATUSES)[number];
export type BookingPaymentMethod =
  | "CASH"
  | "NEQUI"
  | "DAVIPLATA"
  | "QR"
  | "CARD"
  | "TRANSFER";
export type BookingPaymentStatus = "PENDING" | "PARTIALLY_PAID" | "PAID";

export interface Booking {
  id: string;
  businessId: string;
  branchId: string;
  consecutive: string;
  appointments: string[];
  clientId: string;
  status: BookingStatus;
  totalAmount: number;
  paymentMethod?: BookingPaymentMethod;
  paidAmount: number;
  paymentStatus: BookingPaymentStatus;
  createdAt: string;
  cancelledAt?: string;
  updatedAt?: string;
  deletedAt?: string;
}
