import { CustomError } from "../../../domain/errors/custom-error";

/** Valida el id del servicio (query param). */
export function validateServiceIdQuery(id: unknown): string {
  if (id == null || typeof id !== "string" || id.trim() === "") {
    throw CustomError.badRequest("El query param id es requerido y debe ser un texto no vacío");
  }
  return id.trim();
}
