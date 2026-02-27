import { FirestoreDataBase } from "../../data/firestore/firestore.database";
import { CustomError } from "../../domain/errors/custom-error";
import type { Module } from "../../domain/interfaces/module.interface";
import type { Permission } from "../../domain/interfaces/permission.interface";
import type {
  PaginatedResult,
  PaginationParams,
} from "../../domain/interfaces/pagination.interface";
import { MAX_PAGE_SIZE } from "../../domain/interfaces/pagination.interface";
import FirestoreService from "./firestore.service";
import type { CreateModuleDto } from "../module/dtos/create-module.dto";

const COLLECTION_NAME = "Modules";
const PERMISSIONS_COLLECTION = "Permissions";

function toNameKey(value: string): string {
  return value.trim().toLowerCase();
}

export class ModuleService {
  async getAllModules(params: PaginationParams): Promise<PaginatedResult<Module>> {
    try {
      const page = Math.max(1, params.page);
      const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, params.pageSize));
      return await FirestoreService.getAllPaginated<Module>(
        COLLECTION_NAME,
        { page, pageSize }
      );
    } catch (error) {
      if (error instanceof CustomError) throw error;
      throw CustomError.internalServerError("Error interno del servidor");
    }
  }

  async createModule(dto: CreateModuleDto): Promise<Module> {
    try {
      const existingModules = await FirestoreService.getAll<Module>(COLLECTION_NAME);
      const nameKey = toNameKey(dto.name);
      const duplicated = existingModules.some(
        (module) => toNameKey(module.name) === nameKey
      );
      if (duplicated) {
        throw CustomError.conflict("Ya existe un módulo con este nombre");
      }

      const data = {
        name: dto.name,
        value: dto.value,
        ...(dto.description !== undefined && { description: dto.description }),
        createdAt: FirestoreDataBase.generateTimeStamp(),
      };

      const result = await FirestoreService.create(COLLECTION_NAME, data);
      return result as Module;
    } catch (error) {
      if (error instanceof CustomError) throw error;
      throw CustomError.internalServerError("Error interno del servidor");
    }
  }

  async deleteModule(id: string): Promise<{ id: string; message: string }> {
    try {
      const modules = await FirestoreService.getAll<Module>(COLLECTION_NAME, [
        { field: "id", operator: "==", value: id },
      ]);
      if (modules.length === 0) {
        throw CustomError.notFound("No existe un módulo con este id");
      }

      const linkedPermissions = await FirestoreService.getAll<Permission>(
        PERMISSIONS_COLLECTION,
        [{ field: "moduleId", operator: "==", value: id }]
      );
      if (linkedPermissions.length > 0) {
        throw CustomError.conflict(
          "No se puede eliminar el módulo porque tiene permisos asociados"
        );
      }

      return await FirestoreService.delete(COLLECTION_NAME, id);
    } catch (error) {
      if (error instanceof CustomError) throw error;
      throw CustomError.internalServerError("Error interno del servidor");
    }
  }
}
