import { CustomError } from "../../domain/errors/custom-error";
import type { PaginatedResult, PaginationParams } from "../../domain/interfaces/pagination.interface";
import { MAX_PAGE_SIZE } from "../../domain/interfaces/pagination.interface";
import type { User } from "../../domain/interfaces/user.interface";
import FirestoreService from "./firestore.service";

const COLLECTION_NAME = "Users";

export class UsersService {
  async getAllUsers(
    params: PaginationParams & { userId?: string }
  ): Promise<PaginatedResult<User>> {
    try {
      const page = Math.max(1, params.page);
      const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, params.pageSize));
      const filters =
        params.userId != null && params.userId.trim() !== ""
          ? [{ field: "id" as const, operator: "==" as const, value: params.userId.trim() }]
          : [];

      return await FirestoreService.getAllPaginated<User>(
        COLLECTION_NAME,
        { page, pageSize },
        filters
      );
    } catch (error) {
      if (error instanceof CustomError) throw error;
      throw CustomError.internalServerError("Error interno del servidor");
    }
  }
}
