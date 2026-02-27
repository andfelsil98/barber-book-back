import { CustomError } from "../../../domain/errors/custom-error";
import type { CreateBusinessDto } from "./create-business.dto";
import { validateCreateBusinessDto } from "./create-business.dto";
import type { CreateBranchItemDto } from "../../branch/dtos/create-branch.dto";
import { validateCreateBranchItemDto } from "../../branch/dtos/create-branch.dto";
import type { CreateServiceItemDto } from "../../service/dtos/create-service.dto";
import { validateCreateServiceItemDto } from "../../service/dtos/create-service.dto";

/** Body para crear negocio completo: datos del negocio + servicios/sedes opcionales. */
export interface CreateBusinessCompleteDto extends CreateBusinessDto {
  services?: CreateServiceItemDto[];
  branches?: CreateBranchItemDto[];
}

/** Valida body: name, type, logoUrl? (igual que crear negocio) + services/branches opcionales. */
export function validateCreateBusinessCompleteDto(body: unknown): CreateBusinessCompleteDto {
  const businessDto = validateCreateBusinessDto(body);

  const b = (body ?? {}) as Record<string, unknown>;

  let services: CreateServiceItemDto[] | undefined;
  const servicesRaw = b.services;
  if (servicesRaw !== undefined) {
    if (!Array.isArray(servicesRaw)) {
      throw CustomError.badRequest("services debe ser un arreglo cuando se proporcione");
    }
    services = servicesRaw.map((item, index) => {
      try {
        return validateCreateServiceItemDto(item);
      } catch (error) {
        const message = error instanceof CustomError ? error.message : String(error);
        throw CustomError.badRequest(`Servicio en el índice ${index}: ${message}`);
      }
    });
  }

  let branches: CreateBranchItemDto[] | undefined;
  const branchesRaw = b.branches;
  if (branchesRaw !== undefined) {
    if (!Array.isArray(branchesRaw)) {
      throw CustomError.badRequest("branches debe ser un arreglo cuando se proporcione");
    }
    branches = branchesRaw.map((item, index) => {
      try {
        return validateCreateBranchItemDto(item);
      } catch (error) {
        const message = error instanceof CustomError ? error.message : String(error);
        throw CustomError.badRequest(`Sede en el índice ${index}: ${message}`);
      }
    });
  }

  return {
    ...businessDto,
    ...(services !== undefined && { services }),
    ...(branches !== undefined && { branches }),
  };
}
