import { CustomError } from "../../../domain/errors/custom-error";
import {
  formatName,
  isOnlyLettersNumbersAndSpaces,
  normalizeSpaces,
} from "../../../domain/utils/string.utils";
import type {
  BranchLocation,
  BranchScheduleDay,
  BranchScheduleSlot,
} from "../../../domain/interfaces/branch.interface";

/**
 * Normaliza y valida teléfono de sede: solo 57 + 10 dígitos.
 * Si viene con 57 al inicio debe ser exactamente 57 + 10 dígitos.
 * Si no viene con 57, debe ser exactamente 10 dígitos y se le agrega 57.
 */
function normalizeBranchPhone(rawPhone: string): string {
  const digitsOnly = rawPhone.replace(/\D+/g, "");
  if (digitsOnly.startsWith("57")) {
    if (digitsOnly.length !== 12) {
      throw CustomError.badRequest(
        "phone debe ser 57 seguido de exactamente 10 dígitos (12 dígitos en total)"
      );
    }
    return digitsOnly;
  }
  if (digitsOnly.length !== 10) {
    throw CustomError.badRequest(
      "phone debe ser 10 dígitos (ej: 3001112233) o 57 seguido de 10 dígitos (ej: 573001112233)"
    );
  }
  return "57" + digitsOnly;
}

const HHMM_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

/** Un ítem de sede sin businessId (va en el body raíz). */
export interface CreateBranchItemDto {
  name: string;
  address: string;
  location: BranchLocation;
  phone: string;
  phoneHasWhatsapp: boolean;
  schedule: BranchScheduleDay[];
  imageGallery: string[];
}

/** Body: businessId en la raíz + array branches. */
export interface CreateBranchesBodyDto {
  businessId: string;
  branches: CreateBranchItemDto[];
}

function validateScheduleSlot(slot: unknown, index: number): BranchScheduleSlot {
  if (slot == null || typeof slot !== "object" || Array.isArray(slot)) {
    throw CustomError.badRequest(`slots[${index}] debe ser un objeto`);
  }

  const record = slot as Record<string, unknown>;
  const openingTimeRaw = record.openingTime;
  const closingTimeRaw = record.closingTime;

  if (typeof openingTimeRaw !== "string" || !HHMM_REGEX.test(openingTimeRaw.trim())) {
    throw CustomError.badRequest(`slots[${index}].openingTime debe tener formato HH:mm`);
  }
  if (typeof closingTimeRaw !== "string" || !HHMM_REGEX.test(closingTimeRaw.trim())) {
    throw CustomError.badRequest(`slots[${index}].closingTime debe tener formato HH:mm`);
  }

  const openingTime = openingTimeRaw.trim();
  const closingTime = closingTimeRaw.trim();
  if (closingTime <= openingTime) {
    throw CustomError.badRequest(
      `slots[${index}].closingTime debe ser mayor que openingTime`
    );
  }

  return { openingTime, closingTime };
}

function validateSchedule(scheduleInput: unknown): BranchScheduleDay[] {
  if (!Array.isArray(scheduleInput)) {
    throw CustomError.badRequest("schedule es requerido y debe ser un arreglo");
  }
  if (scheduleInput.length !== 7) {
    throw CustomError.badRequest("schedule debe incluir exactamente los 7 días (0 a 6)");
  }

  const seenDays = new Set<number>();

  const schedule = scheduleInput.map((item, index) => {
    if (item == null || typeof item !== "object" || Array.isArray(item)) {
      throw CustomError.badRequest(`schedule[${index}] debe ser un objeto`);
    }

    const dayData = item as Record<string, unknown>;
    const dayRaw = dayData.day;
    const isOpenRaw = dayData.isOpen;
    const slotsRaw = dayData.slots;

    if (!Number.isInteger(dayRaw) || (dayRaw as number) < 0 || (dayRaw as number) > 6) {
      throw CustomError.badRequest(`schedule[${index}].day debe ser un entero entre 0 y 6`);
    }
    const day = dayRaw as number;
    if (seenDays.has(day)) {
      throw CustomError.badRequest(`schedule contiene day duplicado: ${day}`);
    }
    seenDays.add(day);

    if (typeof isOpenRaw !== "boolean") {
      throw CustomError.badRequest(`schedule[${index}].isOpen debe ser booleano`);
    }
    const isOpen = isOpenRaw;

    if (!Array.isArray(slotsRaw)) {
      throw CustomError.badRequest(`schedule[${index}].slots debe ser un arreglo`);
    }

    const slots = slotsRaw.map((slot, slotIndex) => validateScheduleSlot(slot, slotIndex));

    if (!isOpen && slots.length > 0) {
      throw CustomError.badRequest(`schedule[${index}].slots debe ser [] cuando isOpen es false`);
    }

    if (isOpen && slots.length === 0) {
      throw CustomError.badRequest(`schedule[${index}].slots debe incluir al menos 1 rango cuando isOpen es true`);
    }

    const sorted = [...slots].sort((a, b) => a.openingTime.localeCompare(b.openingTime));
    for (let i = 1; i < sorted.length; i += 1) {
      if (sorted[i]!.openingTime < sorted[i - 1]!.closingTime) {
        throw CustomError.badRequest(`schedule[${index}].slots no debe tener traslapes`);
      }
    }

    return {
      day,
      isOpen,
      slots: sorted,
    };
  });

  for (let day = 0; day <= 6; day += 1) {
    if (!seenDays.has(day)) {
      throw CustomError.badRequest(`schedule debe incluir day=${day}`);
    }
  }

  return schedule.sort((a, b) => a.day - b.day);
}

export function validateCreateBranchItemDto(item: unknown): CreateBranchItemDto {
  if (item == null || typeof item !== "object" || Array.isArray(item)) {
    throw CustomError.badRequest("Cada sede debe ser un objeto");
  }
  const b = item as Record<string, unknown>;

  const nameRaw = b.name;
  if (typeof nameRaw !== "string" || nameRaw.trim() === "") {
    throw CustomError.badRequest("name es requerido y debe ser un texto no vacío");
  }
  const nameNormalized = normalizeSpaces(nameRaw);
  if (!isOnlyLettersNumbersAndSpaces(nameNormalized)) {
    throw CustomError.badRequest("name solo puede contener letras, números y espacios (sin caracteres especiales)");
  }
  const name = formatName(nameNormalized);

  const addressRaw = b.address;
  if (typeof addressRaw !== "string" || addressRaw.trim() === "") {
    throw CustomError.badRequest("address es requerido y debe ser un texto no vacío");
  }
  const address = normalizeSpaces(addressRaw);

  const locationRaw = b.location;
  if (locationRaw == null || typeof locationRaw !== "object" || Array.isArray(locationRaw)) {
    throw CustomError.badRequest("location es requerido y debe ser un objeto con lat y lng");
  }
  const locationData = locationRaw as Record<string, unknown>;
  const latRaw = locationData.lat;
  const lngRaw = locationData.lng;

  if (typeof latRaw !== "number" || Number.isNaN(latRaw)) {
    throw CustomError.badRequest("location.lat es requerido y debe ser un número válido");
  }
  if (typeof lngRaw !== "number" || Number.isNaN(lngRaw)) {
    throw CustomError.badRequest("location.lng es requerido y debe ser un número válido");
  }

  const location: BranchLocation = { lat: latRaw, lng: lngRaw };

  const phoneRaw = b.phone;
  if (typeof phoneRaw !== "string" || phoneRaw.trim() === "") {
    throw CustomError.badRequest("phone es requerido y debe ser un texto no vacío");
  }
  const phone = normalizeBranchPhone(phoneRaw.trim());

  const phoneHasWhatsappRaw = b.phoneHasWhatsapp;
  if (typeof phoneHasWhatsappRaw !== "boolean") {
    throw CustomError.badRequest("phoneHasWhatsapp es requerido y debe ser booleano");
  }
  const phoneHasWhatsapp = phoneHasWhatsappRaw;

  const schedule = validateSchedule(b.schedule);

  const imageGalleryRaw = b.imageGallery;
  if (!Array.isArray(imageGalleryRaw)) {
    throw CustomError.badRequest("imageGallery es requerido y debe ser un arreglo de textos");
  }
  if (imageGalleryRaw.length === 0) {
    throw CustomError.badRequest("imageGallery debe incluir al menos 1 elemento");
  }

  const imageGallery = imageGalleryRaw.map((galleryItem, index) => {
    if (typeof galleryItem !== "string" || galleryItem.trim() === "") {
      throw CustomError.badRequest(`imageGallery[${index}] debe ser un texto no vacío`);
    }
    return galleryItem.trim();
  });

  return {
    name,
    address,
    location,
    phone,
    phoneHasWhatsapp,
    schedule,
    imageGallery,
  };
}

/** Valida body: { businessId, branches: [...] }. businessId una vez; cada ítem sin businessId. */
export function validateCreateBranchesDto(body: unknown): CreateBranchesBodyDto {
  if (body == null || typeof body !== "object" || Array.isArray(body)) {
    throw CustomError.badRequest("El body debe ser un objeto con businessId y branches");
  }
  const b = body as Record<string, unknown>;

  const businessId = b.businessId;
  if (typeof businessId !== "string" || businessId.trim() === "") {
    throw CustomError.badRequest("businessId es requerido y debe ser un texto no vacío");
  }

  const branchesRaw = b.branches;
  if (!Array.isArray(branchesRaw)) {
    throw CustomError.badRequest("branches es requerido y debe ser un arreglo");
  }
  if (branchesRaw.length === 0) {
    throw CustomError.badRequest("Se requiere al menos una sede");
  }

  const branches = branchesRaw.map((item, index) => {
    try {
      return validateCreateBranchItemDto(item);
    } catch (error) {
      const message = error instanceof CustomError ? error.message : String(error);
      throw CustomError.badRequest(`Sede en el índice ${index}: ${message}`);
    }
  });

  return {
    businessId: businessId.trim(),
    branches,
  };
}
