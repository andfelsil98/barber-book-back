import type { NextFunction, Request, Response } from "express";
import type { BusinessMembershipService } from "../services/business-membership.service";
import {
  validateAssignRoleDto,
  validateBusinessIdHeader,
  validateMembershipIdParam,
} from "./dtos/business-membership.dto";
import {
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
} from "../../domain/interfaces/pagination.interface";
import { CustomError } from "../../domain/errors/custom-error";

export class BusinessMembershipController {
  constructor(
    private readonly businessMembershipService: BusinessMembershipService
  ) {}

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
    const userId =
      typeof req.query.userId === "string" && req.query.userId.trim() !== ""
        ? req.query.userId.trim()
        : undefined;
    const email =
      typeof req.query.email === "string" && req.query.email.trim() !== ""
        ? req.query.email.trim()
        : undefined;
    const businessId =
      typeof req.query.businessId === "string" &&
      req.query.businessId.trim() !== ""
        ? req.query.businessId.trim()
        : undefined;
    const expandRefsRaw = req.query.expandRefs;
    const expandRefs =
      typeof expandRefsRaw === "string" &&
      expandRefsRaw.trim().toLowerCase() === "true";

    this.businessMembershipService
      .getAllMemberships({
        page: pageRaw,
        pageSize,
        ...(userId != null && { userId }),
        ...(email != null && { email }),
        ...(businessId != null && { businessId }),
        ...(expandRefs && { expandRefs: true }),
      })
      .then((result) => {
        res.status(200).json(result);
      })
      .catch(next);
  };

  public toggleStatus = (req: Request, res: Response, next: NextFunction) => {
    const id = validateMembershipIdParam(req.params.id);
    this.businessMembershipService
      .toggleStatus(id)
      .then((membership) => {
        res.status(200).json(membership);
      })
      .catch(next);
  };

  public toggleEmployee = (req: Request, res: Response, next: NextFunction) => {
    const id = validateMembershipIdParam(req.params.id);
    this.businessMembershipService
      .toggleIsEmployee(id)
      .then((membership) => {
        res.status(200).json(membership);
      })
      .catch(next);
  };

  public assignRole = (req: Request, res: Response, next: NextFunction) => {
    const dto = validateAssignRoleDto(req.body);
    const businessId = validateBusinessIdHeader(req.header("businessId"));
    const requesterDocumentRaw = req.decodedIdToken?.["document"];
    if (
      typeof requesterDocumentRaw !== "string" ||
      requesterDocumentRaw.trim() === ""
    ) {
      next(
        CustomError.unauthorized(
          "Token de sesión inválido: claim document no presente en el token."
        )
      );
      return;
    }

    this.businessMembershipService
      .assignRole(dto.membershipId, dto.roleId, {
        businessId,
        requesterDocument: requesterDocumentRaw.trim(),
      })
      .then((membership) => {
        res.status(200).json(membership);
      })
      .catch(next);
  };
}
