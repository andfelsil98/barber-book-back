import { Router } from "express";
import { envs } from "../../config/envs";
import { createWhatsAppService } from "../../infrastructure/whatsapp/whatsapp.service.factory";
import { AppointmentService } from "../services/appointment.service";
import { WhatsAppTaskService } from "../services/whatsapp-task.service";
import { WhatsAppController } from "./whatsapp.controller";

export class WhatsAppRoutes {
  static get routes(): Router {
    const router = Router();

    const appointmentService = new AppointmentService();
    const whatsappService = createWhatsAppService();
    const whatsappTaskService = new WhatsAppTaskService(
      appointmentService,
      whatsappService
    );
    const whatsappController = new WhatsAppController(
      whatsappTaskService,
      envs.CLOUD_TASKS_INTERNAL_TOKEN
    );

    router.post("/send-message/:type", whatsappController.sendMessage);

    return router;
  }
}
