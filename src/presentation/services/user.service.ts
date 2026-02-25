import { FirestoreDataBase } from "../../data/firestore/firestore.database";
import { CustomError } from "../../domain/errors/custom-error";
import type { User } from "../../domain/interfaces/user.interface";
import FirestoreService from "./firestore.service";

const COLLECTION_NAME = "Users";

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
}
