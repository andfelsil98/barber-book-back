import { CustomError } from "../../../domain/errors/custom-error";

export interface AssignRoleDto {
  membershipId: string;
  roleId: string;
}

export interface AssignBranchDto {
  membershipId: string;
  branchId: string;
}

export function validateBusinessIdHeader(value: unknown): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw CustomError.badRequest(
      "El header businessId es requerido y debe ser un texto no vacío"
    );
  }
  return value.trim();
}

export function validateMembershipIdParam(id: unknown): string {
  if (id == null || typeof id !== "string" || id.trim() === "") {
    throw CustomError.badRequest(
      "El parámetro id es requerido y debe ser un texto no vacío"
    );
  }
  return id.trim();
}

export function validateAssignRoleDto(body: unknown): AssignRoleDto {
  if (body == null || typeof body !== "object" || Array.isArray(body)) {
    throw CustomError.badRequest("El body debe ser un objeto");
  }
  const b = body as Record<string, unknown>;

  const membershipIdRaw = b.membershipId;
  if (typeof membershipIdRaw !== "string" || membershipIdRaw.trim() === "") {
    throw CustomError.badRequest(
      "membershipId es requerido y debe ser un texto no vacío"
    );
  }

  const roleIdRaw = b.roleId;
  if (typeof roleIdRaw !== "string" || roleIdRaw.trim() === "") {
    throw CustomError.badRequest(
      "roleId es requerido y debe ser un texto no vacío"
    );
  }

  return {
    membershipId: membershipIdRaw.trim(),
    roleId: roleIdRaw.trim(),
  };
}

export function validateAssignBranchDto(body: unknown): AssignBranchDto {
  if (body == null || typeof body !== "object" || Array.isArray(body)) {
    throw CustomError.badRequest("El body debe ser un objeto");
  }

  const b = body as Record<string, unknown>;

  const membershipIdRaw = b.membershipId;
  if (typeof membershipIdRaw !== "string" || membershipIdRaw.trim() === "") {
    throw CustomError.badRequest(
      "membershipId es requerido y debe ser un texto no vacío"
    );
  }

  const branchIdRaw = b.branchId;
  if (typeof branchIdRaw !== "string" || branchIdRaw.trim() === "") {
    throw CustomError.badRequest(
      "branchId es requerido y debe ser un texto no vacío"
    );
  }

  return {
    membershipId: membershipIdRaw.trim(),
    branchId: branchIdRaw.trim(),
  };
}
