import type { NextFunction, Request, Response } from "express";
import type { RoleService } from "../services/role.service";
import { validateCreateRoleDto } from "./dtos/create-role.dto";
import { validateRoleIdParam, validateUpdateRoleDto } from "./dtos/update-role.dto";
import {
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
} from "../../domain/interfaces/pagination.interface";

export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  public getAll = (req: Request, res: Response, next: NextFunction) => {
    const pageRaw =
      req.query.page != null ? Number(req.query.page) : DEFAULT_PAGE;
    const pageSizeRaw =
      req.query.pageSize != null
        ? Number(req.query.pageSize)
        : DEFAULT_PAGE_SIZE;

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

    if (id != null) {
      this.roleService
        .getRoleWithPermissionsById(id)
        .then((result) => {
          res.status(200).json(result);
        })
        .catch(next);
      return;
    }

    this.roleService
      .getAllRoles({ page: pageRaw, pageSize })
      .then((result) => {
        res.status(200).json(result);
      })
      .catch(next);
  };

  public create = (req: Request, res: Response, next: NextFunction) => {
    const dto = validateCreateRoleDto(req.body);
    this.roleService
      .createRole(dto)
      .then((role) => {
        res.status(201).json(role);
      })
      .catch(next);
  };

  public update = (req: Request, res: Response, next: NextFunction) => {
    const id = validateRoleIdParam(req.params.id);
    const dto = validateUpdateRoleDto(req.body);
    this.roleService
      .updateRole(id, dto)
      .then((role) => {
        res.status(200).json(role);
      })
      .catch(next);
  };

  public delete = (req: Request, res: Response, next: NextFunction) => {
    const id = validateRoleIdParam(req.params.id);
    this.roleService
      .deleteRole(id)
      .then((result) => {
        res.status(200).json(result);
      })
      .catch(next);
  };
}

