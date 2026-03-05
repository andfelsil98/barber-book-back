import { Router } from "express";
import { ReviewController } from "./review.controller";
import { ReviewService } from "../services/review.service";

export class ReviewRoutes {
  static get routes(): Router {
    const router = Router();
    const reviewService = new ReviewService();
    const reviewController = new ReviewController(reviewService);

    router.get("/", reviewController.getAll);
    router.post("/", reviewController.create);
    router.delete("/:id", reviewController.delete);

    return router;
  }
}
