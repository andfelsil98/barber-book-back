import type { NextFunction, Request, Response } from "express";
import {
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
} from "../../domain/interfaces/pagination.interface";
import type { AppointmentService } from "../services/appointment.service";
import { validateCreateAppointmentDto } from "./dtos/create-appointment.dto";

export class AppointmentController {
  constructor(private readonly appointmentService: AppointmentService) {}

  public getAll = (req: Request, res: Response, next: NextFunction) => {
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
    const businessId =
      typeof req.query.businessId === "string" && req.query.businessId.trim() !== ""
        ? req.query.businessId.trim()
        : undefined;
    const id =
      typeof req.query.id === "string" && req.query.id.trim() !== ""
        ? req.query.id.trim()
        : undefined;
    const employeeId =
      typeof req.query.employeeId === "string" &&
      req.query.employeeId.trim() !== ""
        ? req.query.employeeId.trim()
        : undefined;

    this.appointmentService
      .getAllAppointments({
        page: pageRaw,
        pageSize,
        ...(businessId != null && { businessId }),
        ...(id != null && { id }),
        ...(employeeId != null && { employeeId }),
      })
      .then((result) => {
        res.status(200).json(result);
      })
      .catch(next);
  };

  public create = (req: Request, res: Response, next: NextFunction) => {
    const dto = validateCreateAppointmentDto(req.body);
    this.appointmentService
      .createAppointment(dto)
      .then((appointment) => {
        res.status(201).json(appointment);
      })
      .catch(next);
  };
}
