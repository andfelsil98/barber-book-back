import { Router } from "express";
import { ServiceController } from "./service.controller";
import { ServiceService } from "../services/service.service";

export class ServiceRoutes {
  static get routes(): Router {
    const router = Router();
    const serviceService = new ServiceService();
    const serviceController = new ServiceController(serviceService);

    router.get("/", serviceController.getAll);
    router.post("/", serviceController.create);
    router.put("/:id", serviceController.update);
    router.delete("/:id", serviceController.deleteService);

    return router;
  }
}
