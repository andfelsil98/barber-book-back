export interface Permission {
  id: string;
  name: string;
  value: string;
  description?: string;
  moduleId: string;
  createdAt: string;
  updatedAt?: string;
  deletedAt?: string;
}
