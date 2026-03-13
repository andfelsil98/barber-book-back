import { CustomError } from "../../../domain/errors/custom-error";
import { formatName, normalizeSpaces } from "../../../domain/utils/string.utils";

/** Un ítem de servicio sin businessId (va en el body raíz). */
export interface CreateServiceItemDto {
  name: string;
  duration: number;
  price: number;
  description: string;
  imageUrl?: string;
}

/** Body: businessId en la raíz + array services. */
export interface CreateServicesBodyDto {
  businessId: string;
  services: CreateServiceItemDto[];
}

export function validateCreateServiceItemDto(item: unknown): CreateServiceItemDto {
  if (item == null || typeof item !== "object" || Array.isArray(item)) {
    throw CustomError.badRequest("Cada servicio debe ser un objeto");
  }
  const b = item as Record<string, unknown>;

  const nameRaw = b.name;
  if (typeof nameRaw !== "string" || nameRaw.trim() === "") {
    throw CustomError.badRequest("name es requerido y debe ser un texto no vacío");
  }
  const nameNormalized = normalizeSpaces(nameRaw);
  const name = formatName(nameNormalized);

  const duration = b.duration;
  if (typeof duration !== "number" || Number.isNaN(duration) || duration < 0) {
    throw CustomError.badRequest("duration es requerido y debe ser un número no negativo");
  }

  const price = b.price;
  if (typeof price !== "number" || Number.isNaN(price) || price < 0) {
    throw CustomError.badRequest("price es requerido y debe ser un número no negativo");
  }

  const descriptionRaw = b.description;
  if (typeof descriptionRaw !== "string" || descriptionRaw.trim() === "") {
    throw CustomError.badRequest("description es requerido y debe ser un texto no vacío");
  }
  const description = normalizeSpaces(String(descriptionRaw));

  const imageUrlRaw = b.imageUrl;
  let imageUrl: string | undefined;
  if (imageUrlRaw !== undefined) {
    if (typeof imageUrlRaw !== "string") {
      throw CustomError.badRequest("imageUrl debe ser un texto cuando se proporcione");
    }
    imageUrl = imageUrlRaw.trim();
  }

  return {
    name,
    duration,
    price,
    description,
    ...(imageUrl !== undefined && { imageUrl }),
  };
}

/** Valida body: { businessId, services: [...] }. businessId una vez; cada ítem sin businessId. */
export function validateCreateServicesDto(body: unknown): CreateServicesBodyDto {
  if (body == null || typeof body !== "object" || Array.isArray(body)) {
    throw CustomError.badRequest("El body debe ser un objeto con businessId y services");
  }
  const b = body as Record<string, unknown>;

  const businessId = b.businessId;
  if (typeof businessId !== "string" || businessId.trim() === "") {
    throw CustomError.badRequest("businessId es requerido y debe ser un texto no vacío");
  }

  const servicesRaw = b.services;
  if (!Array.isArray(servicesRaw)) {
    throw CustomError.badRequest("services es requerido y debe ser un arreglo");
  }
  if (servicesRaw.length === 0) {
    throw CustomError.badRequest("Se requiere al menos un servicio");
  }

  const services = servicesRaw.map((item, index) => {
    try {
      return validateCreateServiceItemDto(item);
    } catch (error) {
      const message = error instanceof CustomError ? error.message : String(error);
      throw CustomError.badRequest(`Servicio en el índice ${index}: ${message}`);
    }
  });

  return {
    businessId: businessId.trim(),
    services,
  };
}
