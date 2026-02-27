import type { NextFunction, Request, Response } from "express";
import type { ModuleService } from "../services/module.service";
import { validateCreateModuleDto } from "./dtos/create-module.dto";
import {
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
} from "../../domain/interfaces/pagination.interface";

export class ModuleController {
  constructor(private readonly moduleService: ModuleService) {}

  public getAll = (req: Request, res: Response, next: NextFunction) => {
    const pageRaw =
      req.query.page != null ? Number(req.query.page) : DEFAULT_PAGE;
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
    this.moduleService
      .getAllModules({ page: pageRaw, pageSize })
      .then((result) => {
        res.status(200).json(result);
      })
      .catch(next);
  };

  public create = (req: Request, res: Response, next: NextFunction) => {
    const dto = validateCreateModuleDto(req.body);
    this.moduleService
      .createModule(dto)
      .then((module) => {
        res.status(201).json(module);
      })
      .catch(next);
  };

  public deleteModule = (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id;
    if (!id || id.trim() === "") {
      res.status(400).json({ message: "El parámetro id es requerido y debe ser un texto no vacío" });
      return;
    }

    this.moduleService
      .deleteModule(id.trim())
      .then((result) => {
        res.status(200).json(result);
      })
      .catch(next);
  };
}
