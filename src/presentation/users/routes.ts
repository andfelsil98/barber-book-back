import { Router } from "express";
import { UsersController } from "./users.controller";
import { UsersService } from "../services/users.service";

export class UsersRoutes {
  static get routes(): Router {
    const router = Router();
    const usersService = new UsersService();
    const usersController = new UsersController(usersService);

    router.get("/", usersController.getAllUsers);

    return router;
  }
}
