import { CustomError } from "../../../domain/errors/custom-error";
import { formatName } from "../../../domain/utils/string.utils";

export type PermissionUpdateOperationType = "add" | "remove";

export interface PermissionUpdateOperationDto {
  op: PermissionUpdateOperationType;
  permissionId: string;
}

export interface UpdateRoleDto {
  name?: string;
  permissions?: PermissionUpdateOperationDto[];
}

export function validateUpdateRoleDto(body: unknown): UpdateRoleDto {
  if (body == null || typeof body !== "object" || Array.isArray(body)) {
    throw CustomError.badRequest("El body debe ser un objeto");
  }

  const b = body as Record<string, unknown>;
  const result: UpdateRoleDto = {};

  const nameRaw = b.name;
  if (nameRaw !== undefined) {
    if (typeof nameRaw !== "string" || nameRaw.trim() === "") {
      throw CustomError.badRequest("name debe ser un texto no vacío cuando se proporcione");
    }
    result.name = formatName(nameRaw);
  }

  const permissionsRaw = b.permissions;
  if (permissionsRaw !== undefined) {
    if (!Array.isArray(permissionsRaw)) {
      throw CustomError.badRequest(
        "permissions debe ser un arreglo cuando se proporcione"
      );
    }
    if (permissionsRaw.length === 0) {
      throw CustomError.badRequest(
        "permissions debe tener al menos una operación cuando se proporcione"
      );
    }

    const usedPermissionIds = new Set<string>();
    result.permissions = permissionsRaw.map((item, index) => {
      if (item == null || typeof item !== "object" || Array.isArray(item)) {
        throw CustomError.badRequest(
          `La operación de permission en la posición ${index} debe ser un objeto`
        );
      }

      const operation = item as Record<string, unknown>;
      const opRaw = operation.op;
      if (opRaw !== "add" && opRaw !== "remove") {
        throw CustomError.badRequest(
          `op en la posición ${index} debe ser "add" o "remove"`
        );
      }

      const permissionIdRaw = operation.permissionId;
      if (typeof permissionIdRaw !== "string" || permissionIdRaw.trim() === "") {
        throw CustomError.badRequest(
          `permissionId en la posición ${index} es requerido y debe ser un texto no vacío`
        );
      }
      const permissionId = permissionIdRaw.trim();

      if (usedPermissionIds.has(permissionId)) {
        throw CustomError.badRequest(
          `No se permiten operaciones repetidas para el permissionId ${permissionId}`
        );
      }
      usedPermissionIds.add(permissionId);

      return {
        op: opRaw,
        permissionId,
      };
    });
  }

  const hasAtLeastOneField =
    result.name !== undefined || result.permissions !== undefined;
  if (!hasAtLeastOneField) {
    throw CustomError.badRequest(
      "Se debe proporcionar al menos uno de: name, permissions"
    );
  }

  return result;
}

export function validateRoleIdParam(id: unknown): string {
  if (id == null || typeof id !== "string" || id.trim() === "") {
    throw CustomError.badRequest("El parámetro id es requerido y debe ser un texto no vacío");
  }
  return id.trim();
}
