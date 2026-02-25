import { Router } from "express";
import { AuthController } from "./auth.controller";
import { AuthService } from "../services/auth.service";
import { BusinessMembershipService } from "../services/business-membership.service";
import { UserService } from "../services/user.service";

export class AuthRoutes {
  static get routes(): Router {
    const router = Router();
    const userService = new UserService();
    const businessMembershipService = new BusinessMembershipService();
    const authService = new AuthService(userService, businessMembershipService);
    const authController = new AuthController(authService);

    router.post("/register", authController.register);
    router.post("/login", authController.login);

    return router;
  }
}
