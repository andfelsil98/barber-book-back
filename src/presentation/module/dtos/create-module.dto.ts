import { CustomError } from "../../../domain/errors/custom-error";
import {
  formatName,
  normalizeSpaces,
} from "../../../domain/utils/string.utils";

export const MODULE_TYPES = ["GLOBAL", "CUSTOM"] as const;
export type ModuleType = (typeof MODULE_TYPES)[number];

export interface CreateModuleDto {
  name: string;
  value: string;
  description?: string;
  type: ModuleType;
  businessId?: string;
}

export function isModuleType(value: unknown): value is ModuleType {
  return typeof value === "string" && MODULE_TYPES.includes(value as ModuleType);
}

export function validateCreateModuleDto(body: unknown): CreateModuleDto {
  if (body == null || typeof body !== "object" || Array.isArray(body)) {
    throw CustomError.badRequest("El body debe ser un objeto");
  }

  const b = body as Record<string, unknown>;

  const nameRaw = b.name;
  if (typeof nameRaw !== "string" || nameRaw.trim() === "") {
    throw CustomError.badRequest("name es requerido y debe ser un texto no vacío");
  }
  const name = formatName(nameRaw);

  const valueRaw = b.value;
  if (typeof valueRaw !== "string" || valueRaw.trim() === "") {
    throw CustomError.badRequest("value es requerido y debe ser un texto no vacío");
  }
  const value = normalizeSpaces(valueRaw);

  const descriptionRaw = b.description;
  let description: string | undefined;
  if (descriptionRaw !== undefined) {
    if (typeof descriptionRaw !== "string") {
      throw CustomError.badRequest(
        "description debe ser un texto cuando se proporcione"
      );
    }
    const normalizedDescription = normalizeSpaces(descriptionRaw);
    if (normalizedDescription !== "") {
      description = normalizedDescription;
    }
  }

  const typeRaw = b.type;
  if (!isModuleType(typeRaw)) {
    throw CustomError.badRequest(
      `type debe ser uno de: ${MODULE_TYPES.join(", ")}`
    );
  }
  const type = typeRaw;

  const businessIdRaw = (b as Record<string, unknown>).businessId;
  let businessId: string | undefined;
  if (type === "GLOBAL") {
    if (
      typeof businessIdRaw === "string" &&
      businessIdRaw.trim() !== ""
    ) {
      throw CustomError.badRequest(
        "businessId no debe enviarse cuando type es GLOBAL"
      );
    }
  } else {
    // CUSTOM
    if (typeof businessIdRaw !== "string" || businessIdRaw.trim() === "") {
      throw CustomError.badRequest(
        "businessId es requerido y debe ser un texto no vacío cuando type es CUSTOM"
      );
    }
    businessId = businessIdRaw.trim();
  }

  return {
    name,
    value,
    type,
    ...(description !== undefined && { description }),
    ...(businessId !== undefined && { businessId }),
  };
}

