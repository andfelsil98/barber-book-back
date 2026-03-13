export type MetricType = "BUSSINESS" | "BRANCH" | "EMPLOYEE";
export type MetricTimeFrame = "DAILY" | "MONTHLY";

export interface Metric {
  id: string;
  type: MetricType;
  timeFrame: MetricTimeFrame;
  businessId?: string;
  branchId?: string;
  employeeId?: string;
  date?: string;
  month?: string;
  revenue: number;
  appointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  createdAt: string;
  updatedAt?: string;
}
