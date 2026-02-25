import { FirestoreDataBase } from "../../data/firestore/firestore.database";
import { CustomError } from "../../domain/errors/custom-error";
import type { Permission } from "../../domain/interfaces/permission.interface";
import type { Business } from "../../domain/interfaces/business.interface";
import type { Module } from "../../domain/interfaces/module.interface";
import type {
  PaginatedResult,
  PaginationParams,
} from "../../domain/interfaces/pagination.interface";
import { MAX_PAGE_SIZE } from "../../domain/interfaces/pagination.interface";
import FirestoreService from "./firestore.service";
import type { CreatePermissionDto } from "../permission/dtos/create-permission.dto";

const COLLECTION_NAME = "Permissions";
const BUSINESS_COLLECTION = "Businesses";
const MODULE_COLLECTION = "Modules";
const ROLE_COLLECTION = "Roles";

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
      // Validar que el módulo exista (mismo patrón que otros servicios)
      const modules = await FirestoreService.getAll<Module>(
        MODULE_COLLECTION,
        [{ field: "id", operator: "==", value: dto.moduleId }]
      );
      if (modules.length === 0) throw CustomError.notFound("No existe un módulo con este id");

      const module = modules[0]!;
      // Solo se pueden crear permisos GLOBAL en módulos GLOBAL
      if (dto.type === "GLOBAL" && module.type !== "GLOBAL") {
        throw CustomError.badRequest(
          "Solo se pueden crear permisos GLOBAL en módulos de tipo GLOBAL"
        );
      }
      // Si el permiso es CUSTOM, validar que el negocio exista
      if (dto.type === "CUSTOM") {
        // Ya validamos en el DTO que businessId venga cuando type es CUSTOM.
        const businesses = await FirestoreService.getAll<Business>(
          BUSINESS_COLLECTION,
          [{ field: "id", operator: "==", value: dto.businessId }]
        );
        if (businesses.length === 0) throw CustomError.notFound("No existe un negocio con este id");
      }

      const data = {
        name: dto.name,
        value: dto.value,
        ...(dto.description !== undefined && { description: dto.description }),
        moduleId: dto.moduleId,
        type: dto.type,
        ...(dto.businessId !== undefined && { businessId: dto.businessId }),
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

      const db = FirestoreService.getDB();
      const rolesSnapshot = await db.collection(ROLE_COLLECTION).get();
      for (const roleDoc of rolesSnapshot.docs) {
        const permissionDoc = await db
          .collection(ROLE_COLLECTION)
          .doc(roleDoc.id)
          .collection("Permissions")
          .doc(id)
          .get();
        if (permissionDoc.exists) {
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

