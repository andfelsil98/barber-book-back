import { CustomError } from "../../../domain/errors/custom-error";
import { normalizeSpaces } from "../../../domain/utils/string.utils";

export interface LoginDto {
  email: string;
}

export function validateLoginDto(body: unknown): LoginDto {
  if (body == null || typeof body !== "object" || Array.isArray(body)) {
    throw CustomError.badRequest("El body debe ser un objeto");
  }
  const b = body as Record<string, unknown>;

  const emailRaw = b.email;
  if (typeof emailRaw !== "string" || emailRaw.trim() === "") {
    throw CustomError.badRequest(
      "email es requerido y debe ser un texto no vacío"
    );
  }
  const email = normalizeSpaces(emailRaw);

  return { email };
}

