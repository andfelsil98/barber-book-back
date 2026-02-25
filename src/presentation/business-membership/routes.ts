import { Router } from "express";
import { BusinessMembershipController } from "./business-membership.controller";
import { BusinessMembershipService } from "../services/business-membership.service";
import { UserService } from "../services/user.service";

export class BusinessMembershipRoutes {
  static get routes(): Router {
    const router = Router();

    const userService = new UserService();
    const businessMembershipService = new BusinessMembershipService(userService);
    const businessMembershipController = new BusinessMembershipController(
      businessMembershipService
    );

    router.get("/", businessMembershipController.getAll);
    router.patch("/:id/toggle-status", businessMembershipController.toggleStatus);
    router.post("/assign-role", businessMembershipController.assignRole);

    return router;
  }
}
