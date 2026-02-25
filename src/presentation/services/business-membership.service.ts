import { FirestoreDataBase } from "../../data/firestore/firestore.database";
import { CustomError } from "../../domain/errors/custom-error";
import type { BusinessMembership } from "../../domain/interfaces/business-membership.interface";
import type { Role } from "../../domain/interfaces/role.interface";
import {
  buildPagination,
  type PaginatedResult,
  type PaginationParams,
  MAX_PAGE_SIZE,
} from "../../domain/interfaces/pagination.interface";
import FirestoreService from "./firestore.service";
import { UserService } from "./user.service";

const COLLECTION_NAME = "BusinessMemberships";
const ROLE_COLLECTION = "Roles";

export interface CreateBusinessMembershipData {
  businessId: string;
  userId: string;
}

export class BusinessMembershipService {
  constructor(private readonly userService?: UserService) {}

  async getAllMemberships(
    params: PaginationParams & { userId?: string; email?: string }
  ): Promise<PaginatedResult<BusinessMembership>> {
    try {
      const page = Math.max(1, params.page);
      const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, params.pageSize));
      const requestedUserId =
        params.userId != null && params.userId.trim() !== ""
          ? params.userId.trim()
          : undefined;
      const requestedEmail =
        params.email != null && params.email.trim() !== ""
          ? params.email.trim()
          : undefined;

      let effectiveUserId = requestedUserId;

      if (requestedEmail && this.userService) {
        const user = await this.userService.getByEmail(requestedEmail);
        if (!user) {
          return {
            data: [],
            total: 0,
            pagination: buildPagination(page, pageSize, 0),
          };
        }

        if (effectiveUserId && effectiveUserId !== user.id) {
          return {
            data: [],
            total: 0,
            pagination: buildPagination(page, pageSize, 0),
          };
        }

        effectiveUserId = user.id;
      }

      const filters =
        effectiveUserId != null
          ? [
              {
                field: "userId" as const,
                operator: "==" as const,
                value: effectiveUserId,
              },
            ]
          : [];

      return await FirestoreService.getAllPaginated<BusinessMembership>(
        COLLECTION_NAME,
        { page, pageSize },
        filters
      );
    } catch (error) {
      if (error instanceof CustomError) throw error;
      throw CustomError.internalServerError("Error interno del servidor");
    }
  }

  async create(data: CreateBusinessMembershipData): Promise<BusinessMembership> {
    try {
      const doc = {
        businessId: data.businessId,
        userId: data.userId,
        roleId: null as string | null,
        status: "PENDING" as const,
        createdAt: FirestoreDataBase.generateTimeStamp(),
      };
      const result = await FirestoreService.create(COLLECTION_NAME, doc);
      return result as BusinessMembership;
    } catch (error) {
      if (error instanceof CustomError) throw error;
      throw CustomError.internalServerError("Error interno del servidor");
    }
  }

  private async getMembershipById(
    id: string
  ): Promise<BusinessMembership> {
    const memberships = await FirestoreService.getAll<BusinessMembership>(
      COLLECTION_NAME,
      [{ field: "id", operator: "==", value: id }]
    );
    if (memberships.length === 0) {
      throw CustomError.notFound("No existe una membresía con este id");
    }
    return memberships[0]!;
  }

  async toggleStatus(id: string): Promise<BusinessMembership> {
    try {
      const membership = await this.getMembershipById(id);

      if (membership.status === "DELETED") {
        throw CustomError.badRequest(
          "No se puede modificar una membresía eliminada"
        );
      }

      let newStatus: "ACTIVE" | "INACTIVE";
      switch (membership.status) {
        case "ACTIVE":
          newStatus = "INACTIVE";
          break;
        case "INACTIVE":
        case "PENDING":
          newStatus = "ACTIVE";
          break;
        default:
          newStatus = "ACTIVE";
          break;
      }

      if (newStatus === "ACTIVE") {
        if (!membership.roleId || membership.roleId.trim() === "") {
          throw CustomError.badRequest(
            "No se puede activar una membresía sin un rol asociado"
          );
        }
      }

      const payload = {
        status: newStatus,
        updatedAt: FirestoreDataBase.generateTimeStamp(),
      };
      await FirestoreService.update(COLLECTION_NAME, id, payload);
      return await FirestoreService.getById<BusinessMembership>(
        COLLECTION_NAME,
        id
      );
    } catch (error) {
      if (error instanceof CustomError) throw error;
      throw CustomError.internalServerError("Error interno del servidor");
    }
  }

  async assignRole(
    membershipId: string,
    roleId: string
  ): Promise<BusinessMembership> {
    try {
      // Validar membresía
      await this.getMembershipById(membershipId);

      // Validar rol
      const roles = await FirestoreService.getAll<Role>(ROLE_COLLECTION, [
        { field: "id", operator: "==", value: roleId },
      ]);
      if (roles.length === 0) {
        throw CustomError.notFound("No existe un rol con este id");
      }

      const payload = {
        roleId,
        updatedAt: FirestoreDataBase.generateTimeStamp(),
      };
      await FirestoreService.update(COLLECTION_NAME, membershipId, payload);
      return await FirestoreService.getById<BusinessMembership>(
        COLLECTION_NAME,
        membershipId
      );
    } catch (error) {
      if (error instanceof CustomError) throw error;
      throw CustomError.internalServerError("Error interno del servidor");
    }
  }
}
