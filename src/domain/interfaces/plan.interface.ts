export interface Plan {
  id: string;
  name: string;
  description: string;
  status: "ACTIVE" | "INACTIVE";
  billingInterval: "MONTHLY" | "QUARTERLY" | "YEARLY";
  maxEmployees: number;
  maxBranches: number;
  maxBookings: number;
  maxRoles: number;
  createdAt: string;
  updatedAt?: string;
}
