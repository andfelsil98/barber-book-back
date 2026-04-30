import { envs } from "../../config/envs";
import { infobipRuntimeConfig } from "../../config/runtime.config";
import { WhatsAppService } from "../../presentation/services/whatsapp.service";
import { InfobipWhatsAppApiClient } from "./infobip-whatsapp-api.client";

export function createWhatsAppService(): WhatsAppService {
  const provider = new InfobipWhatsAppApiClient({
    baseUrl: envs.INFOBIP_BASE_URL,
    apiKey: envs.INFOBIP_API_KEY,
    sender: envs.INFOBIP_WHATSAPP_SENDER,
    timeoutMs: infobipRuntimeConfig.timeoutMs,
  });

  return new WhatsAppService(provider);
}
