export const WHATSAPP_MESSAGE_TASK_TYPES = [
  "appointment-status-in-progress",
  "appointment-status-finished",
] as const;

export type WhatsAppMessageTaskType = (typeof WHATSAPP_MESSAGE_TASK_TYPES)[number];
