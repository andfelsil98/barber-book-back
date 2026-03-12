import {
  WHATSAPP_MESSAGE_TASK_TYPES,
  type WhatsAppMessageTaskType,
} from "../../../config/whatsapp-message-types.config";
import { CustomError } from "../../../domain/errors/custom-error";

export interface SendWhatsAppMessageByTypeDto {
  appointmentId: string;
}

export function validateWhatsAppMessageTypeParam(typeRaw: unknown): WhatsAppMessageTaskType {
  if (typeof typeRaw !== "string" || typeRaw.trim() === "") {
    throw CustomError.badRequest("type es requerido en el path param");
  }

  const type = typeRaw.trim() as WhatsAppMessageTaskType;
  if (!WHATSAPP_MESSAGE_TASK_TYPES.includes(type)) {
    throw CustomError.badRequest(
      `type debe ser uno de: ${WHATSAPP_MESSAGE_TASK_TYPES.join(", ")}`
    );
  }

  return type;
}

export function validateSendWhatsAppMessageByTypeDto(
  body: unknown
): SendWhatsAppMessageByTypeDto {
  if (body == null || typeof body !== "object" || Array.isArray(body)) {
    throw CustomError.badRequest("El body debe ser un objeto");
  }

  const parsed = body as Record<string, unknown>;
  const appointmentIdRaw = parsed.appointmentId;

  if (typeof appointmentIdRaw !== "string" || appointmentIdRaw.trim() === "") {
    throw CustomError.badRequest("appointmentId es requerido y debe ser texto no vacío");
  }

  return {
    appointmentId: appointmentIdRaw.trim(),
  };
}
