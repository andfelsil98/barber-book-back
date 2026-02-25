import { CustomError } from "../../../domain/errors/custom-error";
import { formatName, isOnlyLettersNumbersAndSpaces, normalizeSpaces } from "../../../domain/utils/string.utils";

/** Un ítem de sede sin businessId (va en el body raíz). */
export interface CreateBranchItemDto {
  name: string;
  address: string;
  openingTime: string;
  closingTime: string;
}

/** Body: businessId en la raíz + array branches. */
export interface CreateBranchesBodyDto {
  businessId: string;
  branches: CreateBranchItemDto[];
}

export function validateCreateBranchItemDto(item: unknown): CreateBranchItemDto {
  if (item == null || typeof item !== "object" || Array.isArray(item)) {
    throw CustomError.badRequest("Cada sede debe ser un objeto");
  }
  const b = item as Record<string, unknown>;

  const nameRaw = b.name;
  if (typeof nameRaw !== "string" || nameRaw.trim() === "") {
    throw CustomError.badRequest("name es requerido y debe ser un texto no vacío");
  }
  const nameNormalized = normalizeSpaces(nameRaw);
  if (!isOnlyLettersNumbersAndSpaces(nameNormalized)) {
    throw CustomError.badRequest("name solo puede contener letras, números y espacios (sin caracteres especiales)");
  }
  const name = formatName(nameNormalized);

  const addressRaw = b.address;
  if (typeof addressRaw !== "string" || addressRaw.trim() === "") {
    throw CustomError.badRequest("address es requerido y debe ser un texto no vacío");
  }
  const address = normalizeSpaces(addressRaw);

  const openingTimeRaw = b.openingTime;
  if (typeof openingTimeRaw !== "string" || openingTimeRaw.trim() === "") {
    throw CustomError.badRequest("openingTime es requerido y debe ser un texto no vacío");
  }
  const openingTime = openingTimeRaw.trim();

  const closingTimeRaw = b.closingTime;
  if (typeof closingTimeRaw !== "string" || closingTimeRaw.trim() === "") {
    throw CustomError.badRequest("closingTime es requerido y debe ser un texto no vacío");
  }
  const closingTime = closingTimeRaw.trim();

  return { name, address, openingTime, closingTime };
}

/** Valida body: { businessId, branches: [...] }. businessId una vez; cada ítem sin businessId. */
export function validateCreateBranchesDto(body: unknown): CreateBranchesBodyDto {
  if (body == null || typeof body !== "object" || Array.isArray(body)) {
    throw CustomError.badRequest("El body debe ser un objeto con businessId y branches");
  }
  const b = body as Record<string, unknown>;

  const businessId = b.businessId;
  if (typeof businessId !== "string" || businessId.trim() === "") {
    throw CustomError.badRequest("businessId es requerido y debe ser un texto no vacío");
  }

  const branchesRaw = b.branches;
  if (!Array.isArray(branchesRaw)) {
    throw CustomError.badRequest("branches es requerido y debe ser un arreglo");
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
    businessId: businessId.trim(),
    branches,
  };
}
