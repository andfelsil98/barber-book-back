export type AppointmentStatus =
  | "CREATED"
  | "IN_PROGRESS"
  | "CANCELLED"
  | "FINISHED"
  | "DELETED";

export interface Appointment {
  id: string;
  businessId: string;
  date: string;
  startTime: string;
  endTime: string;
  serviceId: string;
  employeeId: string;
  status: AppointmentStatus;
  bookingId: string;
  createdAt: string;
  cancelledAt?: string;
  deletedAt?: string;
  updatedAt?: string;
}
