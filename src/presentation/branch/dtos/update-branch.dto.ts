import { CustomError } from "../../../domain/errors/custom-error";
import { formatName, isOnlyLettersNumbersAndSpaces, normalizeSpaces } from "../../../domain/utils/string.utils";

/** Body para actualizar una sede: name?, address?, openingTime?, closingTime?, status? (ACTIVE | INACTIVE). */
export interface UpdateBranchBodyDto {
  name?: string;
  address?: string;
  openingTime?: string;
  closingTime?: string;
  status?: "ACTIVE" | "INACTIVE";
}

/** Valida body: { name?, address?, openingTime?, closingTime?, status? }. Al menos un campo. Mismas validaciones que creación para name/address/horarios. */
export function validateUpdateBranchDto(body: unknown): UpdateBranchBodyDto {
  if (body == null || typeof body !== "object" || Array.isArray(body)) {
    throw CustomError.badRequest("El body debe ser un objeto con al menos un campo a actualizar");
  }
  const b = body as Record<string, unknown>;

  const nameRaw = b.name;
  let name: string | undefined;
  if (nameRaw !== undefined) {
    if (typeof nameRaw !== "string" || nameRaw.trim() === "") {
      throw CustomError.badRequest("name debe ser un texto no vacío cuando se proporcione");
    }
    const nameNormalized = normalizeSpaces(nameRaw);
    if (!isOnlyLettersNumbersAndSpaces(nameNormalized)) {
      throw CustomError.badRequest("name solo puede contener letras, números y espacios (sin caracteres especiales)");
    }
    name = formatName(nameNormalized);
  }

  const addressRaw = b.address;
  let address: string | undefined;
  if (addressRaw !== undefined) {
    if (typeof addressRaw !== "string" || addressRaw.trim() === "") {
      throw CustomError.badRequest("address debe ser un texto no vacío cuando se proporcione");
    }
    address = normalizeSpaces(addressRaw);
  }

  const openingTimeRaw = b.openingTime;
  let openingTime: string | undefined;
  if (openingTimeRaw !== undefined) {
    if (typeof openingTimeRaw !== "string" || openingTimeRaw.trim() === "") {
      throw CustomError.badRequest("openingTime debe ser un texto no vacío cuando se proporcione");
    }
    openingTime = openingTimeRaw.trim();
  }

  const closingTimeRaw = b.closingTime;
  let closingTime: string | undefined;
  if (closingTimeRaw !== undefined) {
    if (typeof closingTimeRaw !== "string" || closingTimeRaw.trim() === "") {
      throw CustomError.badRequest("closingTime debe ser un texto no vacío cuando se proporcione");
    }
    closingTime = closingTimeRaw.trim();
  }

  const statusRaw = b.status;
  let status: "ACTIVE" | "INACTIVE" | undefined;
  if (statusRaw !== undefined) {
    if (statusRaw !== "ACTIVE" && statusRaw !== "INACTIVE") {
      throw CustomError.badRequest("status debe ser ACTIVE o INACTIVE cuando se proporcione");
    }
    status = statusRaw;
  }

  const hasAtLeastOne =
    name !== undefined ||
    address !== undefined ||
    openingTime !== undefined ||
    closingTime !== undefined ||
    status !== undefined;
  if (!hasAtLeastOne) {
    throw CustomError.badRequest(
      "Se debe proporcionar al menos uno de: name, address, openingTime, closingTime, status"
    );
  }

  const result: UpdateBranchBodyDto = {};
  if (name !== undefined) result.name = name;
  if (address !== undefined) result.address = address;
  if (openingTime !== undefined) result.openingTime = openingTime;
  if (closingTime !== undefined) result.closingTime = closingTime;
  if (status !== undefined) result.status = status;

  return result;
}

/** Valida el id de la sede (param en la ruta). */
export function validateBranchIdParam(id: unknown): string {
  if (id == null || typeof id !== "string" || id.trim() === "") {
    throw CustomError.badRequest("El parámetro id es requerido y debe ser un texto no vacío");
  }
  return id.trim();
}
