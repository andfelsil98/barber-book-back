import { Router } from "express";
import { BusinessController } from "./business.controller";
import { BranchService } from "../services/branch.service";
import { BusinessService } from "../services/business.service";
import { ServiceService } from "../services/service.service";
import { UserService } from "../services/user.service";

export class BusinessRoutes {
  static get routes(): Router {
    const router = Router();
    const serviceService = new ServiceService();
    const branchService = new BranchService();
    const userService = new UserService();
    const businessService = new BusinessService(serviceService, branchService, userService);
    const businessController = new BusinessController(businessService);

    router.get("/", businessController.getAll);
    router.post("/", businessController.create);
    router.put("/:id", businessController.update);
    router.patch("/:id/toggle-status", businessController.toggleStatus);
    router.delete("/:id", businessController.deleteBusiness);

    return router;
  }
}
