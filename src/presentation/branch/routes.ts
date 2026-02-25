import { Router } from "express";
import { BranchController } from "./branch.controller";
import { BranchService } from "../services/branch.service";

export class BranchRoutes {
  static get routes(): Router {
    const router = Router();
    const branchService = new BranchService();
    const branchController = new BranchController(branchService);

    router.get("/", branchController.getAll);
    router.post("/", branchController.create);
    router.put("/:id", branchController.update);
    router.delete("/:id", branchController.deleteBranch);

    return router;
  }
}
