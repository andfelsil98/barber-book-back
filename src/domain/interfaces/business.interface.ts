import type { Branch } from "./branch.interface";
import type { Service } from "./service.interface";
import type { Usage } from "./usage.interface";

export interface Business {
  id: string;
  name: string;
  type: "BARBERSHOP" | "HAIRSALON" | "BEAUTYSALON";
  status: "ACTIVE" | "INACTIVE" | "PENDING" | "DELETED";
  subscriptionStatus: "ACTIVE" | "INACTIVE";
  planId: string;
  slug: string;
  consecutivePrefix: string;
  employees: string[];
  logoUrl?: string;
  usage?: Array<Usage & { id: string }>;
  createdAt: string;
  updatedAt?: string;
  deletedAt?: string;
  deletedBy?: string;
}

/** Resultado de crear un negocio completo (negocio + servicios + sedes). */
export interface CreateBusinessCompleteResult {
  business: Business;
  services: Service[];
  branches: Branch[];
}
