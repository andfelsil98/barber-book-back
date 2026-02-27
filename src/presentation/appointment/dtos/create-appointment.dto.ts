import { CustomError } from "../../../domain/errors/custom-error";
import { normalizeSpaces } from "../../../domain/utils/string.utils";
import type { AppointmentServiceSelection } from "../../../domain/interfaces/appointment.interface";

export interface CreateAppointmentDto {
  businessId: string;
  branchId: string;
  services: AppointmentServiceSelection[];
  employeeId?: string;
  clientId: string;
}

function parseIsoDateTimeOrThrow(
  rawValue: string,
  fieldPath: string
): { value: string; millis: number } {
  const value = normalizeSpaces(rawValue);
  const isoDateTimeRegex =
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})?$/;

  if (!isoDateTimeRegex.test(value)) {
    throw CustomError.badRequest(
      `${fieldPath} debe tener formato de fecha y hora ISO 8601 (ej: 2026-03-10T09:00:00Z)`
    );
  }

  const millis = Date.parse(value);
  if (Number.isNaN(millis)) {
    throw CustomError.badRequest(
      `${fieldPath} debe ser una fecha y hora válida`
    );
  }

  return { value, millis };
}

function validateServiceSelection(
  item: unknown,
  index: number
): AppointmentServiceSelection {
  if (item == null || typeof item !== "object" || Array.isArray(item)) {
    throw CustomError.badRequest(
      `services[${index}] debe ser un objeto con id, startTime y endTime`
    );
  }

  const serviceItem = item as Record<string, unknown>;

  const idRaw = serviceItem.id;
  if (typeof idRaw !== "string" || idRaw.trim() === "") {
    throw CustomError.badRequest(
      `services[${index}].id es requerido y debe ser un texto no vacío`
    );
  }

  const startTimeRaw = serviceItem.startTime;
  if (typeof startTimeRaw !== "string" || startTimeRaw.trim() === "") {
    throw CustomError.badRequest(
      `services[${index}].startTime es requerido y debe ser un texto no vacío`
    );
  }

  const endTimeRaw = serviceItem.endTime;
  if (typeof endTimeRaw !== "string" || endTimeRaw.trim() === "") {
    throw CustomError.badRequest(
      `services[${index}].endTime es requerido y debe ser un texto no vacío`
    );
  }

  const startTime = parseIsoDateTimeOrThrow(
    startTimeRaw,
    `services[${index}].startTime`
  );
  const endTime = parseIsoDateTimeOrThrow(
    endTimeRaw,
    `services[${index}].endTime`
  );
  if (endTime.millis <= startTime.millis) {
    throw CustomError.badRequest(
      `services[${index}].endTime debe ser mayor que startTime`
    );
  }

  return {
    id: normalizeSpaces(idRaw),
    startTime: startTime.value,
    endTime: endTime.value,
  };
}

export function validateCreateAppointmentDto(body: unknown): CreateAppointmentDto {
  if (body == null || typeof body !== "object" || Array.isArray(body)) {
    throw CustomError.badRequest("El body debe ser un objeto");
  }

  const parsedBody = body as Record<string, unknown>;

  const businessIdRaw = parsedBody.businessId;
  if (typeof businessIdRaw !== "string" || businessIdRaw.trim() === "") {
    throw CustomError.badRequest(
      "businessId es requerido y debe ser un texto no vacío"
    );
  }

  const branchIdRaw = parsedBody.branchId;
  if (typeof branchIdRaw !== "string" || branchIdRaw.trim() === "") {
    throw CustomError.badRequest(
      "branchId es requerido y debe ser un texto no vacío"
    );
  }

  const servicesRaw = parsedBody.services;
  if (!Array.isArray(servicesRaw) || servicesRaw.length === 0) {
    throw CustomError.badRequest(
      "services es requerido y debe ser un arreglo con al menos un servicio"
    );
  }

  const services = servicesRaw.map((serviceItem, index) =>
    validateServiceSelection(serviceItem, index)
  );

  const employeeIdRaw = parsedBody.employeeId;
  if (
    employeeIdRaw !== undefined &&
    (typeof employeeIdRaw !== "string" || employeeIdRaw.trim() === "")
  ) {
    throw CustomError.badRequest(
      "employeeId debe ser un texto no vacío cuando se proporcione"
    );
  }

  const clientIdRaw = parsedBody.clientId;
  if (typeof clientIdRaw !== "string" || clientIdRaw.trim() === "") {
    throw CustomError.badRequest(
      "clientId es requerido y debe ser un texto no vacío"
    );
  }

  return {
    businessId: normalizeSpaces(businessIdRaw),
    branchId: normalizeSpaces(branchIdRaw),
    services,
    ...(employeeIdRaw !== undefined && {
      employeeId: normalizeSpaces(employeeIdRaw),
    }),
    clientId: normalizeSpaces(clientIdRaw),
  };
}
