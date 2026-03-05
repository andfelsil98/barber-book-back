export interface Branch {
  id: string;
  businessId: string;
  score?: number;
  reviews?: number;
  name: string;
  address: string;
  openingTime: string;
  closingTime: string;
  status: "ACTIVE" | "INACTIVE" | "DELETED";
  createdAt: string;
  updatedAt?: string;
  deletedAt?: string;
}
