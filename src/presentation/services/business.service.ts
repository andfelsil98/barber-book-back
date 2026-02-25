import { FirestoreDataBase } from "../../data/firestore/firestore.database";
import { CustomError } from "../../domain/errors/custom-error";
import type {
  Business,
  CreateBusinessCompleteResult,
} from "../../domain/interfaces/business.interface";
import type { Branch } from "../../domain/interfaces/branch.interface";
import type { Service } from "../../domain/interfaces/service.interface";
import type { PaginatedResult, PaginationParams } from "../../domain/interfaces/pagination.interface";
import { MAX_PAGE_SIZE } from "../../domain/interfaces/pagination.interface";
import type { CreateBusinessDto } from "../business/dtos/create-business.dto";
import type { CreateBusinessCompleteDto } from "../business/dtos/create-business-complete.dto";
import type { UpdateBusinessDto } from "../business/dtos/update-business.dto";
import type { BranchService } from "./branch.service";
import FirestoreService from "./firestore.service";
import type { ServiceService } from "./service.service";

const COLLECTION_NAME = "Businesses";

export class BusinessService {
  constructor(
    private readonly serviceService?: ServiceService,
    private readonly branchService?: BranchService
  ) {}

  async getAllBusinesses(
    params: PaginationParams & { id?: string }
  ): Promise<PaginatedResult<Business>> {
    try {
      const page = Math.max(1, params.page);
      const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, params.pageSize));
      const filters =
        params.id != null && params.id.trim() !== ""
          ? [{ field: "id" as const, operator: "==" as const, value: params.id.trim() }]
          : [];
      return await FirestoreService.getAllPaginated<Business>(
        COLLECTION_NAME,
        {
          page,
          pageSize,
        },
        filters
      );
    } catch (error) {
      if (error instanceof CustomError) throw error;
      throw CustomError.internalServerError("Error interno del servidor");
    }
  }

  async createBusiness(dto: CreateBusinessDto): Promise<Business> {
    try {
      const existing = await FirestoreService.getAll<Business>(COLLECTION_NAME, [
        { field: "name", operator: "==", value: dto.name },
      ]);
      if (existing.length > 0) {
        throw CustomError.conflict("Ya existe un negocio con este nombre");
      }
      const data = {
        name: dto.name,
        type: dto.type,
        slug: dto.slug,
        logoUrl: dto.logoUrl ?? "",
        status: "ACTIVE" as const,
        createdAt: FirestoreDataBase.generateTimeStamp(),
      };
      const result = await FirestoreService.create(COLLECTION_NAME, data);
      return result;
    } catch (error) {
      if (error instanceof CustomError) throw error;
      throw CustomError.internalServerError("Error interno del servidor");
    }
  }

  async createBusinessComplete(dto: CreateBusinessCompleteDto): Promise<CreateBusinessCompleteResult> {
    try {
      const business = await this.createBusiness({
        name: dto.name,
        type: dto.type,
        slug: dto.slug,
        ...(dto.logoUrl !== undefined && dto.logoUrl !== "" && { logoUrl: dto.logoUrl }),
      });

      let services: Service[] = [];
      if (dto.services.length > 0 && this.serviceService) {
        services = await this.serviceService.createServices({
          businessId: business.id,
          services: dto.services,
        });
      }

      let branches: Branch[] = [];
      if (dto.branches.length > 0 && this.branchService) {
        branches = await this.branchService.createBranches({
          businessId: business.id,
          branches: dto.branches,
        });
      }

      return { business, services, branches };
    } catch (error) {
      if (error instanceof CustomError) throw error;
      throw CustomError.internalServerError("Error interno del servidor");
    }
  }

  async updateBusiness(id: string, dto: UpdateBusinessDto): Promise<Business> {
    try {
      if (dto.name !== undefined) {
        const withSameName = await FirestoreService.getAll<Business>(
          COLLECTION_NAME,
          [{ field: "name", operator: "==", value: dto.name }]
        );
        const otherWithSameName = withSameName.filter((b) => b.id !== id);
        if (otherWithSameName.length > 0) {
          throw CustomError.conflict("Ya existe un negocio con este nombre");
        }
      }

      const payload: Record<string, unknown> = {
        ...dto,
        updatedAt: FirestoreDataBase.generateTimeStamp(),
      };
      await FirestoreService.update(COLLECTION_NAME, id, payload);
      return await FirestoreService.getById<Business>(COLLECTION_NAME, id);
    } catch (error) {
      if (error instanceof CustomError) throw error;
      throw CustomError.internalServerError("Error interno del servidor");
    }
  }

  async deleteBusiness(id: string): Promise<Business> {
    try {
      const payload = {
        status: "DELETED" as const,
        deletedAt: FirestoreDataBase.generateTimeStamp(),
      };
      await FirestoreService.update(COLLECTION_NAME, id, payload);
      return await FirestoreService.getById<Business>(COLLECTION_NAME, id);
    } catch (error) {
      if (error instanceof CustomError) throw error;
      throw CustomError.internalServerError("Error interno del servidor");
    }
  }
}
