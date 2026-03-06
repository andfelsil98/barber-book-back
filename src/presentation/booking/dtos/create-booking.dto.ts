import { CustomError } from "../../../domain/errors/custom-error";
import type { BookingPaymentMethod } from "../../../domain/interfaces/booking.interface";
import { normalizeSpaces } from "../../../domain/utils/string.utils";

export interface CreateBookingAppointmentDto {
  date: string;
  startTime: string;
  endTime: string;
  serviceId: string;
  employeeId: string;
}

export interface CreateBookingDto {
  businessId: string;
  branchId: string;
  appointments: CreateBookingAppointmentDto[];
  clientId: string;
  clientDocumentTypeId?: string;
  clientDocumentTypeName?: string;
  clientName?: string;
  clientPhone?: string;
  clientEmail?: string;
  paymentMethod: BookingPaymentMethod;
  paidAmount?: number;
}

const PAYMENT_METHODS: BookingPaymentMethod[] = [
  "CASH",
  "NEQUI",
  "DAVIPLATA",
  "QR",
  "CARD",
  "TRANSFER",
];

function parseIsoDateOrThrow(rawValue: string, fieldPath: string): string {
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

function validateBookingAppointment(
  item: unknown,
  index: number
): CreateBookingAppointmentDto {
  if (item == null || typeof item !== "object" || Array.isArray(item)) {
    throw CustomError.badRequest(
      `appointments[${index}] debe ser un objeto con date, startTime, endTime, serviceId y employeeId`
    );
  }

  const appointmentItem = item as Record<string, unknown>;
  const pathPrefix = `appointments[${index}]`;

  const dateRaw = appointmentItem.date;
  if (typeof dateRaw !== "string" || dateRaw.trim() === "") {
    throw CustomError.badRequest(`${pathPrefix}.date es requerido`);
  }
  const date = parseIsoDateOrThrow(dateRaw, `${pathPrefix}.date`);

  const startTimeRaw = appointmentItem.startTime;
  if (typeof startTimeRaw !== "string" || startTimeRaw.trim() === "") {
    throw CustomError.badRequest(`${pathPrefix}.startTime es requerido`);
  }
  const startTime = parseTimeOrThrow(startTimeRaw, `${pathPrefix}.startTime`);

  const endTimeRaw = appointmentItem.endTime;
  if (typeof endTimeRaw !== "string" || endTimeRaw.trim() === "") {
    throw CustomError.badRequest(`${pathPrefix}.endTime es requerido`);
  }
  const endTime = parseTimeOrThrow(endTimeRaw, `${pathPrefix}.endTime`);

  if (endTime.millis <= startTime.millis) {
    throw CustomError.badRequest(
      `${pathPrefix}.endTime debe ser mayor que startTime`
    );
  }

  const serviceIdRaw = appointmentItem.serviceId;
  if (typeof serviceIdRaw !== "string" || serviceIdRaw.trim() === "") {
    throw CustomError.badRequest(`${pathPrefix}.serviceId es requerido`);
  }

  const employeeIdRaw = appointmentItem.employeeId;
  if (typeof employeeIdRaw !== "string" || employeeIdRaw.trim() === "") {
    throw CustomError.badRequest(`${pathPrefix}.employeeId es requerido`);
  }

  return {
    date,
    startTime: startTime.value,
    endTime: endTime.value,
    serviceId: normalizeSpaces(serviceIdRaw),
    employeeId: normalizeSpaces(employeeIdRaw),
  };
}

export function validateCreateBookingDto(body: unknown): CreateBookingDto {
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

  const appointmentsRaw = parsedBody.appointments;
  if (!Array.isArray(appointmentsRaw) || appointmentsRaw.length === 0) {
    throw CustomError.badRequest(
      "appointments es requerido y debe contener al menos un item"
    );
  }
  const appointments = appointmentsRaw.map((appointmentItem, index) =>
    validateBookingAppointment(appointmentItem, index)
  );

  const clientIdRaw = parsedBody.clientId;
  if (typeof clientIdRaw !== "string" || clientIdRaw.trim() === "") {
    throw CustomError.badRequest("clientId es requerido y debe ser un texto no vacío");
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

  const paymentMethodRaw = parsedBody.paymentMethod;
  if (typeof paymentMethodRaw !== "string" || paymentMethodRaw.trim() === "") {
    throw CustomError.badRequest(
      "paymentMethod es requerido y debe ser un texto no vacío"
    );
  }
  const paymentMethod = normalizeSpaces(paymentMethodRaw).toUpperCase() as BookingPaymentMethod;
  if (!PAYMENT_METHODS.includes(paymentMethod)) {
    throw CustomError.badRequest(
      `paymentMethod debe ser uno de: ${PAYMENT_METHODS.join(", ")}`
    );
  }

  const paidAmountRaw = parsedBody.paidAmount;
  let paidAmount: number | undefined;
  if (paidAmountRaw !== undefined) {
    if (typeof paidAmountRaw !== "number" || Number.isNaN(paidAmountRaw) || paidAmountRaw < 0) {
      throw CustomError.badRequest(
        "paidAmount debe ser un número mayor o igual a 0 cuando se proporcione"
      );
    }
    paidAmount = paidAmountRaw;
  }

  return {
    businessId: normalizeSpaces(businessIdRaw),
    branchId: normalizeSpaces(branchIdRaw),
    appointments,
    clientId: normalizeSpaces(clientIdRaw),
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
    paymentMethod,
    ...(paidAmount !== undefined && { paidAmount }),
  };
}
