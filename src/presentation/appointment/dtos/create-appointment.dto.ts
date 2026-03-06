import { CustomError } from "../../../domain/errors/custom-error";
import { normalizeSpaces } from "../../../domain/utils/string.utils";

export interface CreateAppointmentDto {
  businessId: string;
  branchId: string;
  bookingId?: string;
  date: string;
  startTime: string;
  endTime: string;
  serviceId: string;
  employeeId: string;
  clientId: string;
  clientDocumentTypeId?: string;
  clientDocumentTypeName?: string;
  clientName?: string;
  clientPhone?: string;
  clientEmail?: string;
}

function parseIsoDateOrThrow(
  rawValue: string,
  fieldPath: string
): string {
  const value = normalizeSpaces(rawValue);
  const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;

  if (!isoDateRegex.test(value)) {
    throw CustomError.badRequest(
      `${fieldPath} debe tener formato de fecha ISO 8601 (ej: 2026-03-10)`
    );
  }

  const millis = Date.parse(`${value}T00:00:00.000Z`);
  if (Number.isNaN(millis)) {
    throw CustomError.badRequest(`${fieldPath} debe ser una fecha válida`);
  }

  return value;
}

function parseTimeOrThrow(
  rawValue: string,
  fieldPath: string
): { value: string; millis: number } {
  const value = normalizeSpaces(rawValue);
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

  const match = value.match(timeRegex);
  if (!match) {
    throw CustomError.badRequest(
      `${fieldPath} debe tener formato de hora HH:mm (ej: 09:00)`
    );
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  const millis = (hours * 60 + minutes) * 60 * 1000;

  return { value, millis };
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
  const bookingIdRaw = parsedBody.bookingId;
  let bookingId: string | undefined;
  if (bookingIdRaw !== undefined) {
    if (typeof bookingIdRaw !== "string" || bookingIdRaw.trim() === "") {
      throw CustomError.badRequest(
        "bookingId debe ser un texto no vacío cuando se proporcione"
      );
    }
    bookingId = normalizeSpaces(bookingIdRaw);
  }

  const dateRaw = parsedBody.date;
  if (typeof dateRaw !== "string" || dateRaw.trim() === "") {
    throw CustomError.badRequest(
      "date es requerido y debe ser un texto no vacío"
    );
  }
  const date = parseIsoDateOrThrow(dateRaw, "date");

  const startTimeRaw = parsedBody.startTime;
  if (typeof startTimeRaw !== "string" || startTimeRaw.trim() === "") {
    throw CustomError.badRequest(
      "startTime es requerido y debe ser un texto no vacío"
    );
  }
  const startTime = parseTimeOrThrow(startTimeRaw, "startTime");

  const endTimeRaw = parsedBody.endTime;
  if (typeof endTimeRaw !== "string" || endTimeRaw.trim() === "") {
    throw CustomError.badRequest(
      "endTime es requerido y debe ser un texto no vacío"
    );
  }
  const endTime = parseTimeOrThrow(endTimeRaw, "endTime");

  if (endTime.millis <= startTime.millis) {
    throw CustomError.badRequest("endTime debe ser mayor que startTime");
  }

  const serviceIdRaw = parsedBody.serviceId;
  if (typeof serviceIdRaw !== "string" || serviceIdRaw.trim() === "") {
    throw CustomError.badRequest(
      "serviceId es requerido y debe ser un texto no vacío"
    );
  }

  const employeeIdRaw = parsedBody.employeeId;
  if (typeof employeeIdRaw !== "string" || employeeIdRaw.trim() === "") {
    throw CustomError.badRequest(
      "employeeId es requerido y debe ser un texto no vacío"
    );
  }

  const clientIdRaw = parsedBody.clientId;
  if (
    bookingId === undefined &&
    (typeof clientIdRaw !== "string" || clientIdRaw.trim() === "")
  ) {
    throw CustomError.badRequest(
      "clientId es requerido y debe ser un texto no vacío cuando no se envía bookingId"
    );
  }

  const clientDocumentTypeIdRaw = parsedBody.clientDocumentTypeId;
  if (
    clientDocumentTypeIdRaw !== undefined &&
    (typeof clientDocumentTypeIdRaw !== "string" ||
      clientDocumentTypeIdRaw.trim() === "")
  ) {
    throw CustomError.badRequest(
      "clientDocumentTypeId debe ser un texto no vacío cuando se proporcione"
    );
  }

  const clientDocumentTypeNameRaw = parsedBody.clientDocumentTypeName;
  if (
    clientDocumentTypeNameRaw !== undefined &&
    (typeof clientDocumentTypeNameRaw !== "string" ||
      clientDocumentTypeNameRaw.trim() === "")
  ) {
    throw CustomError.badRequest(
      "clientDocumentTypeName debe ser un texto no vacío cuando se proporcione"
    );
  }

  const clientNameRaw = parsedBody.clientName;
  if (
    clientNameRaw !== undefined &&
    (typeof clientNameRaw !== "string" || clientNameRaw.trim() === "")
  ) {
    throw CustomError.badRequest(
      "clientName debe ser un texto no vacío cuando se proporcione"
    );
  }

  const clientPhoneRaw = parsedBody.clientPhone;
  if (
    clientPhoneRaw !== undefined &&
    (typeof clientPhoneRaw !== "string" || clientPhoneRaw.trim() === "")
  ) {
    throw CustomError.badRequest(
      "clientPhone debe ser un texto no vacío cuando se proporcione"
    );
  }

  const clientEmailRaw = parsedBody.clientEmail;
  if (
    clientEmailRaw !== undefined &&
    (typeof clientEmailRaw !== "string" || clientEmailRaw.trim() === "")
  ) {
    throw CustomError.badRequest(
      "clientEmail debe ser un texto no vacío cuando se proporcione"
    );
  }

  return {
    businessId: normalizeSpaces(businessIdRaw),
    branchId: normalizeSpaces(branchIdRaw),
    ...(bookingId !== undefined && { bookingId }),
    date,
    startTime: startTime.value,
    endTime: endTime.value,
    serviceId: normalizeSpaces(serviceIdRaw),
    employeeId: normalizeSpaces(employeeIdRaw),
    clientId:
      typeof clientIdRaw === "string" && clientIdRaw.trim() !== ""
        ? normalizeSpaces(clientIdRaw)
        : "",
    ...(clientDocumentTypeIdRaw !== undefined && {
      clientDocumentTypeId: normalizeSpaces(clientDocumentTypeIdRaw),
    }),
    ...(clientDocumentTypeNameRaw !== undefined && {
      clientDocumentTypeName: normalizeSpaces(clientDocumentTypeNameRaw),
    }),
    ...(clientNameRaw !== undefined && {
      clientName: normalizeSpaces(clientNameRaw),
    }),
    ...(clientPhoneRaw !== undefined && {
      clientPhone: normalizeSpaces(clientPhoneRaw),
    }),
    ...(clientEmailRaw !== undefined && {
      clientEmail: normalizeSpaces(clientEmailRaw),
    }),
  };
}
