import { FirestoreDataBase } from "../../data/firestore/firestore.database";
import { CustomError } from "../../domain/errors/custom-error";
import type { Permission } from "../../domain/interfaces/permission.interface";
import type { Module } from "../../domain/interfaces/module.interface";
import type {
  PaginatedResult,
  PaginationParams,
} from "../../domain/interfaces/pagination.interface";
import { MAX_PAGE_SIZE } from "../../domain/interfaces/pagination.interface";
import FirestoreService from "./firestore.service";
import type { CreatePermissionDto } from "../permission/dtos/create-permission.dto";

const COLLECTION_NAME = "Permissions";
const MODULE_COLLECTION = "Modules";
const ROLE_COLLECTION = "Roles";

function toNameKey(value: string): string {
  return value.trim().toLowerCase();
}

export class PermissionService {
  async getAllPermissions(
    params: PaginationParams
  ): Promise<PaginatedResult<Permission>> {
    try {
      const page = Math.max(1, params.page);
      const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, params.pageSize));
      return await FirestoreService.getAllPaginated<Permission>(
        COLLECTION_NAME,
        { page, pageSize }
      );
    } catch (error) {
      if (error instanceof CustomError) throw error;
      throw CustomError.internalServerError("Error interno del servidor");
    }
  }

  async createPermission(dto: CreatePermissionDto): Promise<Permission> {
    try {
      const existingPermissions = await FirestoreService.getAll<Permission>(
        COLLECTION_NAME
      );
      const nameKey = toNameKey(dto.name);
      const duplicated = existingPermissions.some(
        (permission) => toNameKey(permission.name) === nameKey
      );
      if (duplicated) {
        throw CustomError.conflict("Ya existe un permiso con este nombre");
      }

      const modules = await FirestoreService.getAll<Module>(
        MODULE_COLLECTION,
        [{ field: "id", operator: "==", value: dto.moduleId }]
      );
      if (modules.length === 0) throw CustomError.notFound("No existe un módulo con este id");

      const data = {
        name: dto.name,
        value: dto.value,
        ...(dto.description !== undefined && { description: dto.description }),
        moduleId: dto.moduleId,
        createdAt: FirestoreDataBase.generateTimeStamp(),
      };

      const result = await FirestoreService.create(COLLECTION_NAME, data);
      return result as Permission;
    } catch (error) {
      if (error instanceof CustomError) throw error;
      throw CustomError.internalServerError("Error interno del servidor");
    }
  }

  async deletePermission(id: string): Promise<{ id: string; message: string }> {
    try {
      const permissions = await FirestoreService.getAll<Permission>(COLLECTION_NAME, [
        { field: "id", operator: "==", value: id },
      ]);
      if (permissions.length === 0) {
        throw CustomError.notFound("No existe un permiso con este id");
      }

      const roles = await FirestoreService.getAll<{ id: string }>(ROLE_COLLECTION);
      for (const role of roles) {
        const permissionExists = await FirestoreService.subcollectionDocumentExists(
          ROLE_COLLECTION,
          role.id,
          "Permissions",
          id
        );
        if (permissionExists) {
          throw CustomError.conflict(
            "No se puede eliminar el permiso porque está asociado a uno o más roles"
          );
        }
      }

      return await FirestoreService.delete(COLLECTION_NAME, id);
    } catch (error) {
      if (error instanceof CustomError) throw error;
      throw CustomError.internalServerError("Error interno del servidor");
    }
  }
}
