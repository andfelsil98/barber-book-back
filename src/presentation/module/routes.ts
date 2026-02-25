import { Router } from "express";
import { ModuleController } from "./module.controller";
import { ModuleService } from "../services/module.service";

export class ModuleRoutes {
  static get routes(): Router {
    const router = Router();

    const moduleService = new ModuleService();
    const moduleController = new ModuleController(moduleService);

    router.get("/", moduleController.getAll);
    router.post("/", moduleController.create);
    router.delete("/:id", moduleController.deleteModule);

    return router;
  }
}

