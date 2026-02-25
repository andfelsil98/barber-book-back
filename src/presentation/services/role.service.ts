import { FirestoreDataBase } from "../../data/firestore/firestore.database";
import { CustomError } from "../../domain/errors/custom-error";
import type { Business } from "../../domain/interfaces/business.interface";
import type { BusinessMembership } from "../../domain/interfaces/business-membership.interface";
import type { Permission } from "../../domain/interfaces/permission.interface";
import type { Role } from "../../domain/interfaces/role.interface";
import type {
  PaginatedResult,
  PaginationParams,
} from "../../domain/interfaces/pagination.interface";
import { MAX_PAGE_SIZE } from "../../domain/interfaces/pagination.interface";
import FirestoreService from "./firestore.service";
import type { CreateRoleDto } from "../role/dtos/create-role.dto";
import type {
  PermissionUpdateOperationDto,
  UpdateRoleDto,
} from "../role/dtos/update-role.dto";

const COLLECTION_NAME = "Roles";
const BUSINESS_COLLECTION = "Businesses";
const PERMISSIONS_COLLECTION = "Permissions";
const BUSINESS_MEMBERSHIPS_COLLECTION = "BusinessMemberships";

export class RoleService {
  async getAllRoles(params: PaginationParams): Promise<PaginatedResult<Role>> {
    try {
      const page = Math.max(1, params.page);
      const pageSize = Math.min(
        MAX_PAGE_SIZE,
        Math.max(1, params.pageSize)
      );
      return await FirestoreService.getAllPaginated<Role>(COLLECTION_NAME, {
        page,
        pageSize,
      });
    } catch (error) {
      if (error instanceof CustomError) throw error;
      throw CustomError.internalServerError("Error interno del servidor");
    }
  }

  async getRoleWithPermissionsById(
    id: string
  ): Promise<{
    role: Role;
    permissions: Array<{ id: string; name: string; value: string; moduleId: string }>;
  }> {
    try {
      const roles = await FirestoreService.getAll<Role>(COLLECTION_NAME, [
        { field: "id", operator: "==", value: id },
      ]);
      if (roles.length === 0) {
        throw CustomError.notFound("No existe un rol con este id");
      }
      const role = roles[0]!;

      const db = FirestoreService.getDB();
      const snapshot = await db
        .collection(COLLECTION_NAME)
        .doc(id)
        .collection("Permissions")
        .get();

      const permissions = snapshot.docs.map((doc) => {
        const data = doc.data() as {
          name?: string;
          value?: string;
          moduleId?: string;
        };
        return {
          id: doc.id,
          name: data.name ?? "",
          value: data.value ?? "",
          moduleId: data.moduleId ?? "",
        };
      });

      return { role, permissions };
    } catch (error) {
      if (error instanceof CustomError) throw error;
      throw CustomError.internalServerError("Error interno del servidor");
    }
  }

  async createRole(dto: CreateRoleDto): Promise<Role> {
    try {
      // Si el rol es CUSTOM, validar que el negocio exista
      if (dto.type === "CUSTOM") {
        const businesses = await FirestoreService.getAll<Business>(
          BUSINESS_COLLECTION,
          [{ field: "id", operator: "==", value: dto.businessId }]
        );
        if (businesses.length === 0) {
          throw CustomError.notFound("No existe un negocio con este id");
        }
      }

      // Validar que todos los permisos existan y coincidan con el tipo del rol
      const resolvedPermissions: Permission[] = [];
      for (const [index, permissionId] of dto.permissions.entries()) {
        const permissions = await FirestoreService.getAll<Permission>(
          PERMISSIONS_COLLECTION,
          [{ field: "id", operator: "==", value: permissionId }]
        );
        if (permissions.length === 0) {
          throw CustomError.notFound(
            `No existe un permiso con el id indicado en la posición ${index}`
          );
        }
        const permission = permissions[0]!;
        this.validatePermissionCompatibility(
          permission,
          dto.type,
          dto.businessId
        );
        resolvedPermissions.push(permission);
      }

      const data = {
        name: dto.name,
        type: dto.type,
        permissionsCount: resolvedPermissions.length,
        ...(dto.businessId !== undefined && { businessId: dto.businessId }),
        createdAt: FirestoreDataBase.generateTimeStamp(),
      };

      const role = (await FirestoreService.create(
        COLLECTION_NAME,
        data
      )) as Role;

      // Crear subcolección permissions bajo el rol
      for (const permission of resolvedPermissions) {
        await FirestoreService.createInSubcollection(
          COLLECTION_NAME,
          role.id,
          "Permissions",
          {
            id: permission.id,
            name: permission.name,
            value: permission.value,
            moduleId: permission.moduleId,
          }
        );
      }

      return role;
    } catch (error) {
      if (error instanceof CustomError) throw error;
      throw CustomError.internalServerError("Error interno del servidor");
    }
  }

  async updateRole(id: string, dto: UpdateRoleDto): Promise<Role> {
    try {
      const roles = await FirestoreService.getAll<Role>(COLLECTION_NAME, [
        { field: "id", operator: "==", value: id },
      ]);
      if (roles.length === 0) {
        throw CustomError.notFound("No existe un rol con este id");
      }

      const role = roles[0]!;
      const db = FirestoreService.getDB();
      const rolePermissionsRef = db
        .collection(COLLECTION_NAME)
        .doc(id)
        .collection("Permissions");

      const currentPermissionsSnapshot = await rolePermissionsRef.get();
      const currentPermissionIds = new Set(
        currentPermissionsSnapshot.docs.map((doc) => doc.id)
      );

      const payload: Record<string, unknown> = {
        updatedAt: FirestoreDataBase.generateTimeStamp(),
      };
      if (dto.name !== undefined) {
        payload.name = dto.name;
      }

      if (dto.permissions !== undefined) {
        const resolvedOperations = await this.resolvePermissionOperations(
          dto.permissions,
          role.type,
          role.businessId
        );

        for (const operation of resolvedOperations) {
          if (operation.op === "add") {
            if (currentPermissionIds.has(operation.permission.id)) {
              throw CustomError.conflict(
                `El rol ya tiene asociado el permiso ${operation.permission.id}`
              );
            }
            await FirestoreService.createInSubcollection(
              COLLECTION_NAME,
              role.id,
              "Permissions",
              {
                id: operation.permission.id,
                name: operation.permission.name,
                value: operation.permission.value,
                moduleId: operation.permission.moduleId,
              }
            );
            currentPermissionIds.add(operation.permission.id);
            continue;
          }

          if (!currentPermissionIds.has(operation.permission.id)) {
            throw CustomError.badRequest(
              `No se puede remover el permiso ${operation.permission.id} porque no está asociado al rol`
            );
          }
          await rolePermissionsRef.doc(operation.permission.id).delete();
          currentPermissionIds.delete(operation.permission.id);
        }

        payload.permissionsCount = currentPermissionIds.size;
      }

      await FirestoreService.update(COLLECTION_NAME, id, payload);
      return await FirestoreService.getById<Role>(COLLECTION_NAME, id);
    } catch (error) {
      if (error instanceof CustomError) throw error;
      throw CustomError.internalServerError("Error interno del servidor");
    }
  }

  async deleteRole(id: string): Promise<{ id: string; message: string }> {
    try {
      const roles = await FirestoreService.getAll<Role>(COLLECTION_NAME, [
        { field: "id", operator: "==", value: id },
      ]);
      if (roles.length === 0) {
        throw CustomError.notFound("No existe un rol con este id");
      }

      const membershipsUsingRole = await FirestoreService.getAll<BusinessMembership>(
        BUSINESS_MEMBERSHIPS_COLLECTION,
        [{ field: "roleId", operator: "==", value: id }]
      );
      const hasActiveUsage = membershipsUsingRole.some(
        (membership) => membership.status !== "DELETED"
      );
      if (hasActiveUsage) {
        throw CustomError.conflict(
          "No se puede eliminar el rol porque hay usuarios con membresías que lo tienen asignado"
        );
      }

      const db = FirestoreService.getDB();
      const permissionsSnapshot = await db
        .collection(COLLECTION_NAME)
        .doc(id)
        .collection("Permissions")
        .get();
      for (const doc of permissionsSnapshot.docs) {
        await doc.ref.delete();
      }

      return await FirestoreService.delete(COLLECTION_NAME, id);
    } catch (error) {
      if (error instanceof CustomError) throw error;
      throw CustomError.internalServerError("Error interno del servidor");
    }
  }

  private async resolvePermissionOperations(
    operations: PermissionUpdateOperationDto[],
    roleType: Role["type"],
    roleBusinessId?: string
  ): Promise<Array<{ op: "add" | "remove"; permission: Permission }>> {
    const resolved: Array<{ op: "add" | "remove"; permission: Permission }> = [];

    for (const [index, operation] of operations.entries()) {
      const permissions = await FirestoreService.getAll<Permission>(
        PERMISSIONS_COLLECTION,
        [{ field: "id", operator: "==", value: operation.permissionId }]
      );
      if (permissions.length === 0) {
        throw CustomError.notFound(
          `No existe un permiso con el id indicado en la posición ${index}`
        );
      }

      const permission = permissions[0]!;
      this.validatePermissionCompatibility(
        permission,
        roleType,
        roleBusinessId
      );

      resolved.push({
        op: operation.op,
        permission,
      });
    }

    return resolved;
  }

  private validatePermissionCompatibility(
    permission: Permission,
    roleType: Role["type"],
    roleBusinessId?: string
  ): void {
    if (roleType === "GLOBAL") {
      if (permission.type !== "GLOBAL") {
        throw CustomError.badRequest(
          "Un rol GLOBAL solo puede asociar permisos GLOBAL"
        );
      }
      return;
    }

    if (permission.type !== "CUSTOM") {
      throw CustomError.badRequest(
        "Un rol CUSTOM solo puede asociar permisos CUSTOM"
      );
    }

    if (!roleBusinessId || roleBusinessId.trim() === "") {
      throw CustomError.badRequest(
        "El rol CUSTOM no tiene businessId válido para asociar permisos"
      );
    }

    if (permission.businessId !== roleBusinessId) {
      throw CustomError.badRequest(
        "Un rol CUSTOM solo puede asociar permisos CUSTOM del mismo negocio"
      );
    }
  }
}

