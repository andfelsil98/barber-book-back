import { CustomError } from "../../../domain/errors/custom-error";
import { formatName } from "../../../domain/utils/string.utils";

export const ROLE_TYPES = ["GLOBAL", "CUSTOM"] as const;
export type RoleType = (typeof ROLE_TYPES)[number];

export interface CreateRoleDto {
  name: string;
  type: RoleType;
  /** Requerido solo cuando type es CUSTOM. */
  businessId?: string;
  /** Arreglo de ids de permisos GLOBAL a asociar al rol. */
  permissions: string[];
}

export function isRoleType(value: unknown): value is RoleType {
  return typeof value === "string" && ROLE_TYPES.includes(value as RoleType);
}

export function validateCreateRoleDto(body: unknown): CreateRoleDto {
  if (body == null || typeof body !== "object" || Array.isArray(body)) {
    throw CustomError.badRequest("El body debe ser un objeto");
  }

  const b = body as Record<string, unknown>;

  const nameRaw = b.name;
  if (typeof nameRaw !== "string" || nameRaw.trim() === "") {
    throw CustomError.badRequest("name es requerido y debe ser un texto no vacío");
  }
  const name = formatName(nameRaw);

  const typeRaw = b.type;
  if (!isRoleType(typeRaw)) {
    throw CustomError.badRequest(
      `type debe ser uno de: ${ROLE_TYPES.join(", ")}`
    );
  }
  const type = typeRaw;

  const businessIdRaw = (b as Record<string, unknown>).businessId;
  let businessId: string | undefined;
  if (type === "GLOBAL") {
    if (typeof businessIdRaw === "string" && businessIdRaw.trim() !== "") {
      throw CustomError.badRequest(
        "businessId no debe enviarse cuando type es GLOBAL"
      );
    }
  } else {
    // CUSTOM
    if (typeof businessIdRaw !== "string" || businessIdRaw.trim() === "") {
      throw CustomError.badRequest(
        "businessId es requerido y debe ser un texto no vacío cuando type es CUSTOM"
      );
    }
    businessId = businessIdRaw.trim();
  }

  const permissionsRaw = b.permissions;
  if (!Array.isArray(permissionsRaw)) {
    throw CustomError.badRequest("permissions es requerido y debe ser un arreglo");
  }
  if (permissionsRaw.length === 0) {
    throw CustomError.badRequest("Se requiere al menos un permiso");
  }

  const permissions = permissionsRaw.map((item, index) => {
    if (typeof item !== "string" || item.trim() === "") {
      throw CustomError.badRequest(
        `El permissionId en la posición ${index} es requerido y debe ser un texto no vacío`
      );
    }
    return item.trim();
  });

  return {
    name,
    type,
    ...(businessId !== undefined && { businessId }),
    permissions,
  };
}

