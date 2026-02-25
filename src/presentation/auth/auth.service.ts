import { CustomError } from "../../domain/errors/custom-error";
import type { Business } from "../../domain/interfaces/business.interface";
import type { BusinessMembership } from "../../domain/interfaces/business-membership.interface";
import type { User } from "../../domain/interfaces/user.interface";
import type { RegisterDto } from "./dtos/register.dto";
import FirestoreService from "../services/firestore.service";
import { UserService } from "../services/user.service";
import { BusinessMembershipService } from "../services/business-membership.service";

const BUSINESS_COLLECTION = "Businesses";

export interface RegisterResult {
  user: User;
  businessMembership: BusinessMembership;
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
      userId: user.id,
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
      user: { ...user, businessMemberships: [businessMembership.id] },
      businessMembership,
    };
  }

  private async findActiveBusinessByName(businessName: string): Promise<Business | null> {
    const businesses = await FirestoreService.getAll<Business>(BUSINESS_COLLECTION, [
      { field: "name", operator: "==", value: businessName },
      { field: "status", operator: "==", value: "ACTIVE" },
    ]);
    return businesses[0] ?? null;
  }
}
