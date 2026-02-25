export interface Permission {
  id: string;
  name: string;
  value: string;
  description?: string;
  moduleId: string;
  businessId?: string;
  type: "GLOBAL" | "CUSTOM";
  createdAt: string;
  updatedAt?: string;
  deletedAt?: string;
}

