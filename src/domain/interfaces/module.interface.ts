export interface Module {
  id: string;
  name: string;
  value: string;
  description?: string;
  type: "GLOBAL" | "CUSTOM";
  businessId?: string;
  createdAt: string;
  updatedAt?: string;
  deletedAt?: string;
}

