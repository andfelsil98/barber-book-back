export const WHATSAPP_TEMPLATE_TYPES = [
  "APPOINTMENT_CONFIRMATION",
  "APPOINTMENT_MODIFICATION",
  "APPOINTMENT_COMPLETION",
] as const;

export type WhatsAppTemplateType = (typeof WHATSAPP_TEMPLATE_TYPES)[number];

export interface WhatsAppTemplateConfig {
  templateName: string;
  language: string;
  defaultPlaceholders?: string[];
}

export const WHATSAPP_TEMPLATES: Record<WhatsAppTemplateType, WhatsAppTemplateConfig> = {
  APPOINTMENT_CONFIRMATION: {
    templateName: "confirmacao",
    language: "en",
    defaultPlaceholders: ["Andres", "12/03/2026 3:00 PM"],
  },
  APPOINTMENT_MODIFICATION: {
    templateName: "confirmacao",
    language: "en",
    defaultPlaceholders: ["Andres", "12/03/2026 3:00 PM"],
  },
  APPOINTMENT_COMPLETION: {
    templateName: "confirmacao",
    language: "en",
    defaultPlaceholders: ["Andres", "12/03/2026 3:00 PM"],
  },
};
