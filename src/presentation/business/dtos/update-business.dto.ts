import { CustomError } from "../../../domain/errors/custom-error";
import {
  formatName,
  isOnlyLettersNumbersAndSpaces,
  normalizeSpaces,
  slugFromName,
} from "../../../domain/utils/string.utils";
import type { BusinessType } from "./create-business.dto";
import { BUSINESS_TYPES, isBusinessType } from "./create-business.dto";

const BUSINESS_STATUSES = ["ACTIVE", "INACTIVE", "PENDING"] as const;
export type BusinessStatusUpdate = (typeof BUSINESS_STATUSES)[number];

export interface UpdateBusinessDto {
  name?: string;
  type?: BusinessType;
  logoUrl?: string;
  /** Generado si se envía name. */
  slug?: string;
  /** ACTIVE | INACTIVE | PENDING. Requerido para que los usuarios puedan registrarse en el negocio (solo ACTIVE). */
  status?: BusinessStatusUpdate;
}

export function validateUpdateBusinessDto(body: unknown): UpdateBusinessDto {
  if (body == null || typeof body !== "object") {
    throw CustomError.badRequest("El body debe ser un objeto");
  }
  const b = body as Record<string, unknown>;
  const result: UpdateBusinessDto = {};

  const nameRaw = b.name;
  if (nameRaw !== undefined) {
    if (typeof nameRaw !== "string") {
      throw CustomError.badRequest("name debe ser un texto cuando se proporcione");
    }
    const nameNormalized = normalizeSpaces(nameRaw);
    if (nameNormalized === "") {
      throw CustomError.badRequest("name no puede estar vacío");
    }
    if (!isOnlyLettersNumbersAndSpaces(nameNormalized)) {
      throw CustomError.badRequest(
        "name solo permite letras, números y espacios (sin tildes ni caracteres especiales)"
      );
    }
    result.name = formatName(nameNormalized);
    result.slug = slugFromName(result.name);
  }

  const type = b.type;
  if (type !== undefined) {
    if (!isBusinessType(type)) {
      throw CustomError.badRequest(
        `type debe ser uno de: ${BUSINESS_TYPES.join(", ")}`
      );
    }
    result.type = type;
  }

  const logoUrlRaw = b.logoUrl;
  if (logoUrlRaw !== undefined) {
    if (typeof logoUrlRaw !== "string") {
      throw CustomError.badRequest("logoUrl debe ser un texto cuando se proporcione");
    }
    result.logoUrl = normalizeSpaces(String(logoUrlRaw));
  }

  const statusRaw = b.status;
  if (statusRaw !== undefined) {
    if (
      statusRaw !== "ACTIVE" &&
      statusRaw !== "INACTIVE" &&
      statusRaw !== "PENDING"
    ) {
      throw CustomError.badRequest(
        "status debe ser uno de: ACTIVE, INACTIVE, PENDING"
      );
    }
    result.status = statusRaw;
  }

  if (Object.keys(result).length === 0) {
    throw CustomError.badRequest(
      "Se debe proporcionar al menos un campo (name, type, logoUrl, status)"
    );
  }

  return result;
}
