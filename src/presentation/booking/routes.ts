import { Router } from "express";
import { BookingController } from "./booking.controller";
import { BookingService } from "../services/booking.service";

export class BookingRoutes {
  static get routes(): Router {
    const router = Router();
    const bookingService = new BookingService();
    const bookingController = new BookingController(bookingService);

    router.get("/", bookingController.getAll);
    router.post("/", bookingController.create);
    router.put("/:id", bookingController.update);
    router.delete("/:id", bookingController.delete);

    return router;
  }
}
