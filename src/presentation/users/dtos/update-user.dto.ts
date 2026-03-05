import { CustomError } from "../../../domain/errors/custom-error";
import { normalizeSpaces } from "../../../domain/utils/string.utils";

export interface UpdateUserDto {
  profilePhotoUrl?: string;
  phone?: string;
  name?: string;
  email?: string;
}

function formatUserName(value: string): string {
  return normalizeSpaces(value)
    .split(" ")
    .filter((word) => word !== "")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export function validateUserIdParam(id: unknown): string {
  if (typeof id !== "string" || id.trim() === "") {
    throw CustomError.badRequest("El parámetro id es requerido y debe ser un texto no vacío");
  }
  return id.trim();
}

export function validateUpdateUserDto(body: unknown): UpdateUserDto {
  if (body == null || typeof body !== "object" || Array.isArray(body)) {
    throw CustomError.badRequest("El body debe ser un objeto con al menos un campo a actualizar");
  }

  const b = body as Record<string, unknown>;
  const allowedKeys = new Set(["profilePhotoUrl", "phone", "name", "email"]);
  const invalidKeys = Object.keys(b).filter((key) => !allowedKeys.has(key));
  if (invalidKeys.length > 0) {
    throw CustomError.badRequest(
      `Solo se permite actualizar: profilePhotoUrl, phone, name, email. Campos inválidos: ${invalidKeys.join(", ")}`
    );
  }

  const result: UpdateUserDto = {};

  if (b.profilePhotoUrl !== undefined) {
    if (typeof b.profilePhotoUrl !== "string") {
      throw CustomError.badRequest("profilePhotoUrl debe ser un texto cuando se proporcione");
    }
    result.profilePhotoUrl = b.profilePhotoUrl.trim();
  }

  if (b.phone !== undefined) {
    if (typeof b.phone !== "string" || b.phone.trim() === "") {
      throw CustomError.badRequest("phone debe ser un texto no vacío cuando se proporcione");
    }
    result.phone = normalizeSpaces(b.phone);
  }

  if (b.name !== undefined) {
    if (typeof b.name !== "string" || b.name.trim() === "") {
      throw CustomError.badRequest("name debe ser un texto no vacío cuando se proporcione");
    }
    result.name = formatUserName(b.name);
  }

  if (b.email !== undefined) {
    if (typeof b.email !== "string" || b.email.trim() === "") {
      throw CustomError.badRequest("email debe ser un texto no vacío cuando se proporcione");
    }
    result.email = normalizeSpaces(b.email).toLowerCase();
  }

  if (Object.keys(result).length === 0) {
    throw CustomError.badRequest(
      "Se debe proporcionar al menos uno de: profilePhotoUrl, phone, name, email"
    );
  }

  return result;
}
