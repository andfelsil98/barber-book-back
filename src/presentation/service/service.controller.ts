import type { NextFunction, Request, Response } from "express";
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "../../domain/interfaces/pagination.interface";
import { validateCreateServicesDto } from "./dtos/create-service.dto";
import { validateServiceIdParam, validateUpdateServiceDto } from "./dtos/update-service.dto";
import type { ServiceService } from "../services/service.service";

function parseIncludeDeletesQuery(value: unknown): boolean | undefined {
  if (value == null) return undefined;
  if (typeof value !== "string") {
    throw new Error("includeDeletes debe ser booleano (true o false)");
  }
  const normalized = value.trim().toLowerCase();
  if (normalized === "true") return true;
  if (normalized === "false") return false;
  throw new Error("includeDeletes debe ser true o false");
}

export class ServiceController {
  constructor(private readonly serviceService: ServiceService) {}

  public getAll = (req: Request, res: Response, next: NextFunction) => {
    try {
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
      const id =
        typeof req.query.id === "string" && req.query.id.trim() !== ""
          ? req.query.id.trim()
          : undefined;
      const includeDeletes = parseIncludeDeletesQuery(req.query.includeDeletes);

      this.serviceService
        .getAllServices({
          page: pageRaw,
          pageSize,
          ...(businessId != null && { businessId }),
          ...(id != null && { id }),
          ...(includeDeletes != null && { includeDeletes }),
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
