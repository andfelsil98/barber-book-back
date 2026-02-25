import type { NextFunction, Request, Response } from "express";
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "../../domain/interfaces/pagination.interface";
import { validateCreateServicesDto } from "./dtos/create-service.dto";
import { validateServiceIdParam, validateUpdateServiceDto } from "./dtos/update-service.dto";
import type { ServiceService } from "../services/service.service";

export class ServiceController {
  constructor(private readonly serviceService: ServiceService) {}

  public getAll = (req: Request, res: Response, next: NextFunction) => {
    const pageRaw = req.query.page != null ? Number(req.query.page) : DEFAULT_PAGE;
    const pageSizeRaw = req.query.pageSize != null ? Number(req.query.pageSize) : DEFAULT_PAGE_SIZE;
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
    this.serviceService
      .getAllServices({ page: pageRaw, pageSize, ...(businessId != null && { businessId }) })
      .then((result) => {
        res.status(200).json(result);
      })
      .catch(next);
  };

  public create = (req: Request, res: Response, next: NextFunction) => {
    const dto = validateCreateServicesDto(req.body);
    this.serviceService
      .createServices(dto)
      .then((services) => {
        res.status(201).json(services);
      })
      .catch(next);
  };

  public update = (req: Request, res: Response, next: NextFunction) => {
    const id = validateServiceIdParam(req.params.id);
    const dto = validateUpdateServiceDto(req.body);
    this.serviceService
      .updateService(id, dto)
      .then((service) => {
        res.status(200).json(service);
      })
      .catch(next);
  };

  public deleteService = (req: Request, res: Response, next: NextFunction) => {
    const id = validateServiceIdParam(req.params.id);
    this.serviceService
      .deleteService(id)
      .then((service) => {
        res.status(200).json(service);
      })
      .catch(next);
  };
}
