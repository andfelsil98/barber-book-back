import { Router } from "express";
import { AppointmentController } from "./appointment.controller";
import { AppointmentService } from "../services/appointment.service";

export class AppointmentRoutes {
  static get routes(): Router {
    const router = Router();
    const appointmentService = new AppointmentService();
    const appointmentController = new AppointmentController(appointmentService);

    router.get("/", appointmentController.getAll);
    router.post("/", appointmentController.create);

    return router;
  }
}
