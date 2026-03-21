export interface BusinessMembership {
  id: string;
  businessId: string;
  /** Documento de identidad del usuario (no el id de Firestore). */
  userId: string;
  score?: number;
  reviews?: number;
  isEmployee: boolean;
  branchId?: string | null;
  roleId: string | null;
  status: "ACTIVE" | "INACTIVE" | "DELETED" | "PENDING";
  createdAt: string;
  updatedAt?: string;
  deletedAt?: string;
}
