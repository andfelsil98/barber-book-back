import { FirestoreDataBase } from "../../data/firestore/firestore.database";
import type { Timestamp } from "firebase-admin/firestore";
import { CustomError } from "../../domain/errors/custom-error";
import type { BusinessMembership } from "../../domain/interfaces/business-membership.interface";
import type {
  PaginatedResult,
  PaginationParams,
} from "../../domain/interfaces/pagination.interface";
import { MAX_PAGE_SIZE } from "../../domain/interfaces/pagination.interface";
import type { User } from "../../domain/interfaces/user.interface";
import FirestoreService from "./firestore.service";

const COLLECTION_NAME = "Users";
const DELETED_USERS_COLLECTION = "DeletedUsers";
const BUSINESS_MEMBERSHIPS_COLLECTION = "BusinessMemberships";

export interface CreateUserData {
  phone: string;
  name: string;
  email: string;
  document: string;
  documentTypeName: string;
  documentTypeId: string;
}

export class UserService {
  async existsByEmail(email: string): Promise<boolean> {
    const users = await FirestoreService.getAll<User>(COLLECTION_NAME, [
      { field: "email", operator: "==", value: email },
    ]);
    return users.length > 0;
  }

  async existsByDocument(document: string): Promise<boolean> {
    const users = await FirestoreService.getAll<User>(COLLECTION_NAME, [
      { field: "document", operator: "==", value: document },
    ]);
    return users.length > 0;
  }

  async createUser(data: CreateUserData): Promise<User> {
    try {
      const doc = {
        phone: data.phone,
        name: data.name,
        email: data.email,
        document: data.document,
        documentTypeName: data.documentTypeName,
        documentTypeId: data.documentTypeId,
        profilePhotoUrl: "",
        createdAt: FirestoreDataBase.generateTimeStamp(),
      };
      const result = await FirestoreService.create(COLLECTION_NAME, doc);
      return result as User;
    } catch (error) {
      if (error instanceof CustomError) throw error;
      throw CustomError.internalServerError("Error interno del servidor");
    }
  }

  async getByEmail(email: string): Promise<User | null> {
    const users = await FirestoreService.getAll<User>(COLLECTION_NAME, [
      { field: "email", operator: "==", value: email },
    ]);
    return users[0] ?? null;
  }

  async getAllUsers(
    params: PaginationParams & { userId?: string; document?: string; name?: string }
  ): Promise<PaginatedResult<User>> {
    try {
      const page = Math.max(1, params.page);
      const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, params.pageSize));
      const requestedName =
        params.name != null && params.name.trim() !== ""
          ? params.name.trim()
          : undefined;
      const filters = [
        ...(params.userId != null && params.userId.trim() !== ""
          ? [{ field: "id" as const, operator: "==" as const, value: params.userId.trim() }]
          : []),
        ...(params.document != null && params.document.trim() !== ""
          ? [
              {
                field: "document" as const,
                operator: "==" as const,
                value: params.document.trim(),
              },
            ]
          : []),
        ...(requestedName != null
          ? [
              {
                field: "name" as const,
                operator: ">=" as const,
                value: requestedName,
              },
              {
                field: "name" as const,
                operator: "<=" as const,
                value: `${requestedName}\uf8ff`,
              },
            ]
          : []),
      ];

      return await FirestoreService.getAllPaginated<User>(
        COLLECTION_NAME,
        { page, pageSize },
        filters,
        requestedName != null
          ? { field: "name", direction: "asc" }
          : undefined
      );
    } catch (error) {
      if (error instanceof CustomError) throw error;
      throw CustomError.internalServerError("Error interno del servidor");
    }
  }

  async getById(id: string): Promise<User | null> {
    const users = await FirestoreService.getAll<User>(COLLECTION_NAME, [
      { field: "id", operator: "==", value: id },
    ]);
    return users[0] ?? null;
  }

  async getByDocument(document: string): Promise<User | null> {
    const users = await FirestoreService.getAll<User>(COLLECTION_NAME, [
      { field: "document", operator: "==", value: document },
    ]);
    return users[0] ?? null;
  }

  async deleteUser(
    document: string,
    opts: { deletedByUid?: string; deletedByEmail?: string }
  ): Promise<{ id: string; message: string }> {
    try {
      const sanitizedDocument = document.trim();
      const user = await this.getByDocument(sanitizedDocument);
      if (!user) {
        throw CustomError.notFound("No existe un usuario con este número de documento");
      }

      await this.deleteFirebaseAuthUserByEmail(user.email);

      const [membershipsByDocument, membershipsById] = await Promise.all([
        FirestoreService.getAll<BusinessMembership>(BUSINESS_MEMBERSHIPS_COLLECTION, [
          {
            field: "userId",
            operator: "==",
            value: user.document,
          },
        ]),
        FirestoreService.getAll<BusinessMembership>(BUSINESS_MEMBERSHIPS_COLLECTION, [
          {
            field: "userId",
            operator: "==",
            value: user.id,
          },
        ]),
      ]);

      const membershipsMap = new Map<string, BusinessMembership>();
      membershipsByDocument.forEach((membership) => membershipsMap.set(membership.id, membership));
      membershipsById.forEach((membership) => membershipsMap.set(membership.id, membership));
      const memberships = Array.from(membershipsMap.values());

      const deletedAt = FirestoreDataBase.generateTimeStamp();

      await this.markMembershipsAsDeleted(memberships, deletedAt);
      await FirestoreService.deleteSubcollectionDocuments(
        COLLECTION_NAME,
        user.id,
        "businessMemberships"
      );

      const deletedUserPayload = {
        id: user.id,
        phone: user.phone,
        name: user.name,
        email: user.email,
        document: user.document,
        documentTypeName: user.documentTypeName,
        documentTypeId: user.documentTypeId,
        profilePhotoUrl: user.profilePhotoUrl,
        createdAt: user.createdAt,
        deletedAt,
        ...(opts.deletedByUid && { deletedByUid: opts.deletedByUid }),
        ...(opts.deletedByEmail && { deletedByEmail: opts.deletedByEmail }),
      };

      await FirestoreService.create(DELETED_USERS_COLLECTION, deletedUserPayload);
      await FirestoreService.delete(COLLECTION_NAME, user.id);

      return {
        id: user.id,
        message:
          "Usuario eliminado correctamente. Registro de Firebase Auth eliminado, membresías marcadas como DELETED y subcolección businessMemberships eliminada.",
      };
    } catch (error) {
      if (error instanceof CustomError) throw error;
      throw CustomError.internalServerError("Error interno del servidor");
    }
  }

  private async markMembershipsAsDeleted(
    memberships: BusinessMembership[],
    deletedAt: Timestamp
  ): Promise<void> {
    const updates = memberships.map((membership) => {
      if (membership.status === "DELETED") {
        return Promise.resolve();
      }

      const payload = {
        status: "DELETED" as const,
        deletedAt,
      };
      return FirestoreService.update(BUSINESS_MEMBERSHIPS_COLLECTION, membership.id, payload);
    });

    await Promise.all(updates);
  }

  private async deleteFirebaseAuthUserByEmail(email: string): Promise<void> {
    const auth = FirestoreDataBase.getAdmin().auth();
    try {
      const firebaseUser = await auth.getUserByEmail(email);
      await auth.deleteUser(firebaseUser.uid);
    } catch (error) {
      const code =
        typeof error === "object" &&
        error != null &&
        "code" in error &&
        typeof (error as { code?: unknown }).code === "string"
          ? (error as { code: string }).code
          : "";

      if (code === "auth/user-not-found") {
        return;
      }

      throw CustomError.internalServerError(
        "No se pudo eliminar el usuario en Firebase Authentication"
      );
    }
  }

}
