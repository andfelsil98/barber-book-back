import { Router } from "express";
import { RoleController } from "./role.controller";
import { RoleService } from "../services/role.service";

export class RoleRoutes {
  static get routes(): Router {
    const router = Router();

    const roleService = new RoleService();
    const roleController = new RoleController(roleService);

    router.get("/", roleController.getAll);
    router.post("/", roleController.create);
    router.put("/:id", roleController.update);
    router.delete("/:id", roleController.delete);

    return router;
  }
}

