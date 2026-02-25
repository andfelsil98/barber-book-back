import { CustomError } from "../../../domain/errors/custom-error";
import type { CreateBusinessDto } from "./create-business.dto";
import { validateCreateBusinessDto } from "./create-business.dto";
import type { CreateBranchItemDto } from "../../branch/dtos/create-branch.dto";
import { validateCreateBranchItemDto } from "../../branch/dtos/create-branch.dto";
import type { CreateServiceItemDto } from "../../service/dtos/create-service.dto";
import { validateCreateServiceItemDto } from "../../service/dtos/create-service.dto";

/** Body para crear negocio completo: datos del negocio + al menos 1 servicio + al menos 1 sede. */
export interface CreateBusinessCompleteDto extends CreateBusinessDto {
  services: CreateServiceItemDto[];
  branches: CreateBranchItemDto[];
}

/** Valida body: name, type, logoUrl? (igual que crear negocio) + services (arreglo, al menos 1) + branches (arreglo, al menos 1). */
export function validateCreateBusinessCompleteDto(body: unknown): CreateBusinessCompleteDto {
  const businessDto = validateCreateBusinessDto(body);

  const b = (body ?? {}) as Record<string, unknown>;

  const servicesRaw = b.services;
  if (servicesRaw === undefined || !Array.isArray(servicesRaw)) {
    throw CustomError.badRequest("services es requerido y debe ser un arreglo con al menos un servicio");
  }
  if (servicesRaw.length === 0) {
    throw CustomError.badRequest("Se requiere al menos un servicio");
  }
  const services = servicesRaw.map((item, index) => {
    try {
      return validateCreateServiceItemDto(item);
    } catch (error) {
      const message = error instanceof CustomError ? error.message : String(error);
      throw CustomError.badRequest(`Servicio en el índice ${index}: ${message}`);
    }
  });

  const branchesRaw = b.branches;
  if (branchesRaw === undefined || !Array.isArray(branchesRaw)) {
    throw CustomError.badRequest("branches es requerido y debe ser un arreglo con al menos una sede");
  }
  if (branchesRaw.length === 0) {
    throw CustomError.badRequest("Se requiere al menos una sede");
  }
  const branches = branchesRaw.map((item, index) => {
    try {
      return validateCreateBranchItemDto(item);
    } catch (error) {
      const message = error instanceof CustomError ? error.message : String(error);
      throw CustomError.badRequest(`Sede en el índice ${index}: ${message}`);
    }
  });

  return {
    ...businessDto,
    services,
    branches,
  };
}
