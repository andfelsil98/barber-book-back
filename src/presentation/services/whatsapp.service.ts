import {
  WHATSAPP_TEMPLATES,
  type WhatsAppTemplateType,
} from "../../config/whatsapp-templates.config";
import { CustomError } from "../../domain/errors/custom-error";
import type {
  SendWhatsAppMessageResult,
  WhatsAppMessageProvider,
} from "../../domain/interfaces/whatsapp.interface";

export interface SendWhatsAppTemplateByTypeParams {
  to: string;
  templateType: WhatsAppTemplateType;
  placeholders?: string[];
}

export class WhatsAppService {
  constructor(private readonly provider: WhatsAppMessageProvider) {}

  async sendTemplateMessage(
    params: SendWhatsAppTemplateByTypeParams
  ): Promise<SendWhatsAppMessageResult> {
    const normalizedTo = this.normalizeTo(params.to);
    const template = WHATSAPP_TEMPLATES[params.templateType];

    const templateName = template.templateName.trim();
    const language = template.language.trim();

    if (templateName === "") {
      throw CustomError.internalServerError(
        `Plantilla de WhatsApp inválida para ${params.templateType}: templateName vacío`
      );
    }

    if (language === "") {
      throw CustomError.internalServerError(
        `Plantilla de WhatsApp inválida para ${params.templateType}: language vacío`
      );
    }

    const resolvedPlaceholders = params.placeholders ?? template.defaultPlaceholders;

    return this.provider.sendTemplateMessage({
      to: normalizedTo,
      templateName,
      language,
      ...(resolvedPlaceholders != null && resolvedPlaceholders.length > 0 && {
        placeholders: resolvedPlaceholders,
      }),
    });
  }

  private normalizeTo(to: string): string {
    const normalized = to.replace(/\s+/g, "").replace(/^\+/, "");
    const phoneRegex = /^[1-9]\d{7,14}$/;

    if (!phoneRegex.test(normalized)) {
      throw CustomError.badRequest(
        "to debe ser un número válido en formato internacional (ej: 573001234567)"
      );
    }

    return normalized;
  }
}
