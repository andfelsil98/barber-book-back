import { FirestoreDataBase } from "../../data/firestore/firestore.database";
import { CustomError } from "../../domain/errors/custom-error";
import type { Business } from "../../domain/interfaces/business.interface";
import type { Branch } from "../../domain/interfaces/branch.interface";
import type { PaginatedResult, PaginationParams } from "../../domain/interfaces/pagination.interface";
import { MAX_PAGE_SIZE } from "../../domain/interfaces/pagination.interface";
import type { CreateBranchesBodyDto } from "../branch/dtos/create-branch.dto";
import type { UpdateBranchBodyDto } from "../branch/dtos/update-branch.dto";
import FirestoreService from "./firestore.service";

const COLLECTION_NAME = "Branches";
const BUSINESS_COLLECTION = "Businesses";

function toNameKey(value: string): string {
  return value.trim().toLowerCase();
}

export class BranchService {
  async getAllBranches(
    params: PaginationParams & { businessId?: string }
  ): Promise<PaginatedResult<Branch>> {
    try {
      const page = Math.max(1, params.page);
      const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, params.pageSize));
      const filters = [
        {
          field: "status" as const,
          operator: "in" as const,
          value: ["ACTIVE", "INACTIVE"],
        },
        ...(params.businessId != null && params.businessId.trim() !== ""
          ? [{ field: "businessId" as const, operator: "==" as const, value: params.businessId.trim() }]
          : []),
      ];
      return await FirestoreService.getAllPaginated<Branch>(COLLECTION_NAME, { page, pageSize }, filters);
    } catch (error) {
      if (error instanceof CustomError) throw error;
      throw CustomError.internalServerError("Error interno del servidor");
    }
  }

  async createBranches(dto: CreateBranchesBodyDto): Promise<Branch[]> {
    try {
      const businesses = await FirestoreService.getAll<Business>(BUSINESS_COLLECTION, [
        { field: "id", operator: "==", value: dto.businessId },
      ]);
      if (businesses.length === 0) throw CustomError.notFound("No existe un negocio con este id");

      const existingBranches = await FirestoreService.getAll<Branch>(COLLECTION_NAME, [
        { field: "businessId", operator: "==", value: dto.businessId },
      ]);
      const existingNameKeys = new Set(existingBranches.map((b) => toNameKey(b.name)));

      const namesInRequest = new Set<string>();
      for (const item of dto.branches) {
        const nameKey = toNameKey(item.name);
        if (existingNameKeys.has(nameKey)) {
          throw CustomError.conflict("Ya existe una sede con este nombre en este negocio");
        }
        if (namesInRequest.has(nameKey)) {
          throw CustomError.conflict("Nombre de sede duplicado en la solicitud");
        }
        namesInRequest.add(nameKey);
      }

      const created: Branch[] = [];
      for (const item of dto.branches) {
        const data = {
          businessId: dto.businessId,
          name: item.name,
          address: item.address,
          location: item.location,
          phone: item.phone,
          phoneHasWhatsapp: item.phoneHasWhatsapp,
          schedule: item.schedule,
          imageGallery: item.imageGallery,
          status: "ACTIVE" as const,
          createdAt: FirestoreDataBase.generateTimeStamp(),
        };
        const result = await FirestoreService.create(COLLECTION_NAME, data);
        created.push(result);
      }
      return created;
    } catch (error) {
      if (error instanceof CustomError) throw error;
      throw CustomError.internalServerError("Error interno del servidor");
    }
  }

  async updateBranch(id: string, dto: UpdateBranchBodyDto): Promise<Branch> {
    try {
      const branches = await FirestoreService.getAll<Branch>(COLLECTION_NAME, [
        { field: "id", operator: "==", value: id },
      ]);
      if (branches.length === 0) throw CustomError.notFound("No existe una sede con este id");
      const branch = branches[0]!;

      if (dto.name !== undefined) {
        const existingBranches = await FirestoreService.getAll<Branch>(COLLECTION_NAME, [
          { field: "businessId", operator: "==", value: branch.businessId },
        ]);
        const nameKey = toNameKey(dto.name);
        const nameTaken = existingBranches.some(
          (b) => b.id !== id && toNameKey(b.name) === nameKey
        );
        if (nameTaken) throw CustomError.conflict("Ya existe una sede con este nombre en este negocio");
      }

      const payload: Record<string, unknown> = {
        updatedAt: FirestoreDataBase.generateTimeStamp(),
      };
      if (dto.name !== undefined) payload.name = dto.name;
      if (dto.address !== undefined) payload.address = dto.address;
      payload.location = dto.location;
      payload.phone = dto.phone;
      payload.phoneHasWhatsapp = dto.phoneHasWhatsapp;
      payload.schedule = dto.schedule;
      payload.imageGallery = dto.imageGallery;
      if (dto.status !== undefined) payload.status = dto.status;

      await FirestoreService.update(COLLECTION_NAME, id, payload);
      return await FirestoreService.getById<Branch>(COLLECTION_NAME, id);
    } catch (error) {
      if (error instanceof CustomError) throw error;
      throw CustomError.internalServerError("Error interno del servidor");
    }
  }

  async deleteBranch(id: string): Promise<Branch> {
    try {
      const branches = await FirestoreService.getAll<Branch>(COLLECTION_NAME, [
        { field: "id", operator: "==", value: id },
      ]);
      if (branches.length === 0) throw CustomError.notFound("No existe una sede con este id");
      const payload = {
        status: "DELETED" as const,
        deletedAt: FirestoreDataBase.generateTimeStamp(),
      };
      await FirestoreService.update(COLLECTION_NAME, id, payload);
      return await FirestoreService.getById<Branch>(COLLECTION_NAME, id);
    } catch (error) {
      if (error instanceof CustomError) throw error;
      throw CustomError.internalServerError("Error interno del servidor");
    }
  }
}
