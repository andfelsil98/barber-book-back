import { CustomError } from "../../../domain/errors/custom-error";
import {
  formatName,
  normalizeSpaces,
} from "../../../domain/utils/string.utils";

export const PERMISSION_TYPES = ["GLOBAL", "CUSTOM"] as const;
export type PermissionType = (typeof PERMISSION_TYPES)[number];

export interface CreatePermissionDto {
  name: string;
  value: string;
  description?: string;
  moduleId: string;
  type: PermissionType;
  businessId?: string;
}

export function isPermissionType(value: unknown): value is PermissionType {
  return (
    typeof value === "string" && PERMISSION_TYPES.includes(value as PermissionType)
  );
}

export function validateCreatePermissionDto(body: unknown): CreatePermissionDto {
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
    const normalized = normalizeSpaces(descriptionRaw);
    if (normalized !== "") {
      description = normalized;
    }
  }

  const moduleIdRaw = b.moduleId;
  if (typeof moduleIdRaw !== "string" || moduleIdRaw.trim() === "") {
    throw CustomError.badRequest(
      "moduleId es requerido y debe ser un texto no vacío"
    );
  }
  const moduleId = moduleIdRaw.trim();

  const typeRaw = b.type;
  if (!isPermissionType(typeRaw)) {
    throw CustomError.badRequest(
      `type debe ser uno de: ${PERMISSION_TYPES.join(", ")}`
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
    ...(description !== undefined && { description }),
    moduleId,
    type,
    ...(businessId !== undefined && { businessId }),
  };
}

