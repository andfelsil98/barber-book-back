export interface Role {
  id: string;
  businessId?: string;
  name: string;
  type: "GLOBAL" | "CUSTOM";
  permissionsCount: number;
  createdAt: string;
  updatedAt?: string;
  deletedAt?: string;
}

