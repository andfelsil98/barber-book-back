export interface User {
  id: string;
  phone: string;
  name: string;
  email: string;
  isAuthActive?: boolean;
  businessMemberships?: string[];
  document: string;
  documentTypeName: string;
  documentTypeId: string;
  profilePhotoUrl: string;
  createdAt: string;
  updatedAt?: string;
  deletedAt?: string;
}
