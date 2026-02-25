import { Router } from "express";
import { PermissionController } from "./permission.controller";
import { PermissionService } from "../services/permission.service";

export class PermissionRoutes {
  static get routes(): Router {
    const router = Router();

    const permissionService = new PermissionService();
    const permissionController = new PermissionController(permissionService);

    router.get("/", permissionController.getAll);
    router.post("/", permissionController.create);
    router.delete("/:id", permissionController.deletePermission);

    return router;
  }
}

