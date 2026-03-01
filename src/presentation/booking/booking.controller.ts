import type { NextFunction, Request, Response } from "express";
import {
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
} from "../../domain/interfaces/pagination.interface";
import type { BookingService } from "../services/booking.service";
import { validateCreateBookingDto } from "./dtos/create-booking.dto";
import {
  validateBookingIdParam,
  validateUpdateBookingDto,
} from "./dtos/update-booking.dto";

export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  public getAll = (req: Request, res: Response, next: NextFunction) => {
    try {
      const pageRaw = req.query.page != null ? Number(req.query.page) : DEFAULT_PAGE;
      const pageSizeRaw =
        req.query.pageSize != null ? Number(req.query.pageSize) : DEFAULT_PAGE_SIZE;

      if (Number.isNaN(pageRaw) || pageRaw < 1) {
        res.status(400).json({ message: "page debe ser un entero positivo" });
        return;
      }

      if (Number.isNaN(pageSizeRaw) || pageSizeRaw < 1) {
        res.status(400).json({ message: "pageSize debe ser un entero positivo" });
        return;
      }

      const pageSize = Math.min(MAX_PAGE_SIZE, pageSizeRaw);
      const id =
        typeof req.query.id === "string" && req.query.id.trim() !== ""
          ? req.query.id.trim()
          : undefined;
      this.bookingService
        .getAllBookings({
          page: pageRaw,
          pageSize,
          ...(id != null && { id }),
        })
        .then((result) => {
          res.status(200).json(result);
        })
        .catch(next);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Parámetros inválidos";
      res.status(400).json({ message });
    }
  };

  public create = (req: Request, res: Response, next: NextFunction) => {
    const dto = validateCreateBookingDto(req.body);
    this.bookingService
      .createBooking(dto)
      .then((booking) => {
        res.status(201).json(booking);
      })
      .catch(next);
  };

  public update = (req: Request, res: Response, next: NextFunction) => {
    const id = validateBookingIdParam(req.params.id);
    const dto = validateUpdateBookingDto(req.body);
    this.bookingService
      .updateBooking(id, dto)
      .then((booking) => {
        res.status(200).json(booking);
      })
      .catch(next);
  };

  public delete = (req: Request, res: Response, next: NextFunction) => {
    const id = validateBookingIdParam(req.params.id);
    this.bookingService
      .deleteBooking(id)
      .then((booking) => {
        res.status(200).json(booking);
      })
      .catch(next);
  };
}
