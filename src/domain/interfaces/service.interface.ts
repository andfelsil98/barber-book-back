export interface Service {
  id: string;
  businessId: string;
  name: string;
  duration: number;
  status: "ACTIVE" | "INACTIVE" | "DELETED";
  price: number;
  description?: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt?: string;
  deletedAt?: string;
}
