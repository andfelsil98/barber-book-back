import { Router } from "express";
import { BusinessController } from "./business.controller";
import { BranchService } from "../services/branch.service";
import { BusinessService } from "../services/business.service";
import { ServiceService } from "../services/service.service";

export class BusinessRoutes {
  static get routes(): Router {
    const router = Router();
    const serviceService = new ServiceService();
    const branchService = new BranchService();
    const businessService = new BusinessService(serviceService, branchService);
    const businessController = new BusinessController(businessService);

    router.get("/", businessController.getAll);
    router.post("/", businessController.create);
    router.put("/:id", businessController.update);
    router.delete("/:id", businessController.deleteBusiness);

    return router;
  }
} 