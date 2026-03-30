export interface Usage {
  maxEmployees: number;
  maxBranches: number;
  maxBookings: number;
  maxRoles: number;
  planId: string;
  startPeriod: string;
  endPeriod: string;
  status: "ACTIVE" | "INACTIVE";
}
