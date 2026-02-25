import type { NextFunction, Request, Response } from "express";
import type { PermissionService } from "../services/permission.service";
import { validateCreatePermissionDto } from "./dtos/create-permission.dto";
import {
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
} from "../../domain/interfaces/pagination.interface";

export class PermissionController {
  constructor(private readonly permissionService: PermissionService) {}

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
    this.permissionService
      .getAllPermissions({ page: pageRaw, pageSize })
      .then((result) => {
        res.status(200).json(result);
      })
      .catch(next);
  };

  public create = (req: Request, res: Response, next: NextFunction) => {
    const dto = validateCreatePermissionDto(req.body);
    this.permissionService
      .createPermission(dto)
      .then((permission) => {
        res.status(201).json(permission);
      })
      .catch(next);
  };

  public deletePermission = (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id;
    if (!id || id.trim() === "") {
      res.status(400).json({ message: "El parámetro id es requerido y debe ser un texto no vacío" });
      return;
    }

    this.permissionService
      .deletePermission(id.trim())
      .then((result) => {
        res.status(200).json(result);
      })
      .catch(next);
  };
}

