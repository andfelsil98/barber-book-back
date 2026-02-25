import { CustomError } from "../../../domain/errors/custom-error";
import { formatName, normalizeSpaces } from "../../../domain/utils/string.utils";

/** Body para actualizar un servicio: solo los campos a cambiar (mismos que en creación) + status. */
export interface UpdateServiceBodyDto {
  name?: string;
  duration?: number;
  price?: number;
  description?: string;
  status?: "ACTIVE" | "INACTIVE";
}

/** Valida body: { name?, duration?, price?, description?, status? }. Al menos un campo. */
export function validateUpdateServiceDto(body: unknown): UpdateServiceBodyDto {
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
    name = formatName(nameNormalized);
  }

  const duration = b.duration;
  if (duration !== undefined) {
    if (typeof duration !== "number" || Number.isNaN(duration) || duration < 0) {
      throw CustomError.badRequest("duration debe ser un número no negativo cuando se proporcione");
    }
  }

  const price = b.price;
  if (price !== undefined) {
    if (typeof price !== "number" || Number.isNaN(price) || price < 0) {
      throw CustomError.badRequest("price debe ser un número no negativo cuando se proporcione");
    }
  }

  const descriptionRaw = b.description;
  let description: string | undefined;
  if (descriptionRaw !== undefined) {
    if (typeof descriptionRaw !== "string") {
      throw CustomError.badRequest("description debe ser un texto cuando se proporcione");
    }
    description = normalizeSpaces(String(descriptionRaw));
  }

  const statusRaw = b.status;
  let status: "ACTIVE" | "INACTIVE" | undefined;
  if (statusRaw !== undefined) {
    if (statusRaw !== "ACTIVE" && statusRaw !== "INACTIVE") {
      throw CustomError.badRequest("status debe ser ACTIVE o INACTIVE cuando se proporcione");
    }
    status = statusRaw;
  }

  const hasAtLeastOne = name !== undefined || duration !== undefined || price !== undefined || description !== undefined || status !== undefined;
  if (!hasAtLeastOne) {
    throw CustomError.badRequest("Se debe proporcionar al menos uno de: name, duration, price, description, status");
  }

  const result: UpdateServiceBodyDto = {};
  if (name !== undefined) result.name = name;
  if (duration !== undefined) result.duration = duration;
  if (price !== undefined) result.price = price;
  if (description !== undefined) result.description = description;
  if (status !== undefined) result.status = status;

  return result;
}

/** Valida el id del servicio (param en la ruta). */
export function validateServiceIdParam(id: unknown): string {
  if (id == null || typeof id !== "string" || id.trim() === "") {
    throw CustomError.badRequest("El parámetro id es requerido y debe ser un texto no vacío");
  }
  return id.trim();
}
