import { CustomError } from "../../domain/errors/custom-error";
import type { Business } from "../../domain/interfaces/business.interface";
import type { BusinessMembership } from "../../domain/interfaces/business-membership.interface";
import type { User } from "../../domain/interfaces/user.interface";
import { FirestoreDataBase } from "../../data/firestore/firestore.database";
import type { RegisterDto } from "../auth/dtos/register.dto";
import type { LoginDto } from "../auth/dtos/login.dto";
import { BusinessMembershipService } from "./business-membership.service";
import FirestoreService from "./firestore.service";
import { UserService } from "./user.service";

const BUSINESS_COLLECTION = "Businesses";

export interface RegisterResult {
  user: User;
  businessMembership: BusinessMembership;
}

export interface LoginResult {
  user: User;
}

export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly businessMembershipService: BusinessMembershipService
  ) {}

  async register(dto: RegisterDto): Promise<RegisterResult> {
    const business = await this.findActiveBusinessByName(dto.businessName);
    if (business == null) {
      throw CustomError.notFound("No existe un negocio activo con ese nombre");
    }

    const [emailExists, documentExists] = await Promise.all([
      this.userService.existsByEmail(dto.email),
      this.userService.existsByDocument(dto.document),
    ]);
    if (emailExists) {
      throw CustomError.conflict("Ya existe un usuario registrado con este correo");
    }
    if (documentExists) {
      throw CustomError.conflict("Ya existe un usuario registrado con este documento");
    }

    const user = await this.userService.createUser({
      phone: dto.phone,
      name: dto.name,
      email: dto.email,
      document: dto.document,
      documentTypeName: dto.documentTypeName,
      documentTypeId: dto.documentTypeId,
    });

    const businessMembership = await this.businessMembershipService.create({
      businessId: business.id,
      userId: user.document,
    });

    await FirestoreService.createInSubcollection(
      "Users",
      user.id,
      "businessMemberships",
      {
        id: businessMembership.id,
        businessId: business.id,
      }
    );

    return {
      user,
      businessMembership,
    };
  }

  async login(dto: LoginDto): Promise<LoginResult> {
    const user = await this.userService.getByEmail(dto.email);
    if (user == null) {
      // El usuario no existe en nuestra base de datos:
      // eliminar el usuario en Firebase Authentication por correo (getUserByEmail + deleteUser).
      try {
        const firebaseUser = await FirestoreDataBase.getAdmin()
          .auth()
          .getUserByEmail(dto.email);
        await FirestoreDataBase.getAdmin().auth().deleteUser(firebaseUser.uid);
      } catch {
        // Si no existe en Auth o falla la eliminación, igual respondemos que no existe.
      }
      throw CustomError.notFound("El usuario no existe");
    }

    return { user };
  }

  private async findActiveBusinessByName(businessName: string): Promise<Business | null> {
    const businesses = await FirestoreService.getAll<Business>(BUSINESS_COLLECTION, [
      { field: "name", operator: "==", value: businessName },
      { field: "status", operator: "==", value: "ACTIVE" },
    ]);
    return businesses[0] ?? null;
  }
}
