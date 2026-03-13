export interface BranchLocation {
  lat: number;
  lng: number;
}

export interface BranchScheduleSlot {
  openingTime: string;
  closingTime: string;
}

export interface BranchScheduleDay {
  day: number;
  isOpen: boolean;
  slots: BranchScheduleSlot[];
}

export interface Branch {
  id: string;
  businessId: string;
  score?: number;
  reviews?: number;
  name: string;
  address: string;
  location: BranchLocation;
  phone: string;
  phoneHasWhatsapp: boolean;
  schedule: BranchScheduleDay[];
  imageGallery?: string[];
  status: "ACTIVE" | "INACTIVE" | "DELETED";
  createdAt: string;
  updatedAt?: string;
  deletedAt?: string;
}
