import type { NextFunction, Request, Response } from "express";
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "../../domain/interfaces/pagination.interface";
import { validateCreateBranchesDto } from "./dtos/create-branch.dto";
import { validateBranchIdParam, validateUpdateBranchDto } from "./dtos/update-branch.dto";
import type { BranchService } from "../services/branch.service";

export class BranchController {
  constructor(private readonly branchService: BranchService) {}

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
    this.branchService
      .getAllBranches({ page: pageRaw, pageSize, ...(businessId != null && { businessId }) })
      .then((result) => {
        res.status(200).json(result);
      })
      .catch(next);
  };

  public create = (req: Request, res: Response, next: NextFunction) => {
    const dto = validateCreateBranchesDto(req.body);
    this.branchService
      .createBranches(dto)
      .then((branches) => {
        res.status(201).json(branches);
      })
      .catch(next);
  };

  public update = (req: Request, res: Response, next: NextFunction) => {
    const id = validateBranchIdParam(req.params.id);
    const dto = validateUpdateBranchDto(req.body);
    this.branchService
      .updateBranch(id, dto)
      .then((branch) => {
        res.status(200).json(branch);
      })
      .catch(next);
  };

  public deleteBranch = (req: Request, res: Response, next: NextFunction) => {
    const id = validateBranchIdParam(req.params.id);
    this.branchService
      .deleteBranch(id)
      .then((branch) => {
        res.status(200).json(branch);
      })
      .catch(next);
  };
}
