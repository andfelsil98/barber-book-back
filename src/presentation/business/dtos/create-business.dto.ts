import { CustomError } from "../../../domain/errors/custom-error";
import {
  formatName,
  isOnlyLettersNumbersAndSpaces,
  normalizeSpaces,
  slugFromName,
} from "../../../domain/utils/string.utils";

export const BUSINESS_TYPES = ["BARBERSHOP", "HAIRSALON", "BEAUTYSALON"] as const;
export type BusinessType = (typeof BUSINESS_TYPES)[number];

export interface CreateBusinessDto {
  name: string;
  type: BusinessType;
  logoUrl?: string;
  /** Generado a partir de name en validateCreateBusinessDto. */
  slug: string;
}

export function isBusinessType(value: unknown): value is BusinessType {
  return typeof value === "string" && BUSINESS_TYPES.includes(value as BusinessType);
}

export function validateCreateBusinessDto(body: unknown): CreateBusinessDto {
  if (body == null || typeof body !== "object") {
    throw CustomError.badRequest("El body debe ser un objeto");
  }
  const b = body as Record<string, unknown>;
  const nameRaw = b.name;
  if (typeof nameRaw !== "string") {
    throw CustomError.badRequest("name es requerido y debe ser un texto no vacío");
  }
  const nameNormalized = normalizeSpaces(nameRaw);
  if (nameNormalized === "") {
    throw CustomError.badRequest("name es requerido y debe ser un texto no vacío");
  }
  if (!isOnlyLettersNumbersAndSpaces(nameNormalized)) {
    throw CustomError.badRequest(
      "name solo permite letras, números y espacios (sin tildes ni caracteres especiales)"
    );
  }
  const name = formatName(nameNormalized);
  const type = b.type;
  if (!isBusinessType(type)) {
    throw CustomError.badRequest(
      `type debe ser uno de: ${BUSINESS_TYPES.join(", ")}`
    );
  }
  const logoUrlRaw = b.logoUrl;
  if (logoUrlRaw !== undefined && typeof logoUrlRaw !== "string") {
    throw CustomError.badRequest("logoUrl debe ser un texto cuando se proporcione");
  }
  const logoUrl =
    logoUrlRaw !== undefined ? normalizeSpaces(String(logoUrlRaw)) : undefined;
  return {
    name,
    type,
    ...(logoUrl !== undefined && logoUrl !== "" && { logoUrl }),
    slug: slugFromName(name),
  };
}
