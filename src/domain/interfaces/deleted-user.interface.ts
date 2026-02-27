export interface DeletedUser {
  id: string;
  phone: string;
  name: string;
  email: string;
  document: string;
  documentTypeName: string;
  documentTypeId: string;
  profilePhotoUrl: string;
  createdAt: string;
  deletedAt: string;
  deletedByUid?: string;
  deletedByEmail?: string;
}

