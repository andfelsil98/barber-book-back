import { FirestoreDataBase } from "../../data/firestore/firestore.database";
import { FieldValue } from "firebase-admin/firestore";
import { CustomError } from "../../domain/errors/custom-error";
import type {
  Booking,
  BookingPaymentStatus,
  BookingStatus,
} from "../../domain/interfaces/booking.interface";
import type { Service } from "../../domain/interfaces/service.interface";
import type {
  PaginatedResult,
  PaginationParams,
} from "../../domain/interfaces/pagination.interface";
import { MAX_PAGE_SIZE } from "../../domain/interfaces/pagination.interface";
import type {
  CreateBookingAppointmentDto,
  CreateBookingDto,
} from "../booking/dtos/create-booking.dto";
import type { UpdateBookingDto } from "../booking/dtos/update-booking.dto";
import FirestoreService from "./firestore.service";
import { AppointmentService } from "./appointment.service";
import { ReviewService } from "./review.service";

const BOOKINGS_COLLECTION = "Bookings";
const APPOINTMENTS_COLLECTION = "Appointments";
const SERVICES_COLLECTION = "Services";

export class BookingService {
  constructor(
    private readonly appointmentService: AppointmentService = new AppointmentService(),
    private readonly reviewService: ReviewService = new ReviewService()
  ) {}

  async getAllBookings(
    params: PaginationParams & { id?: string }
  ): Promise<PaginatedResult<Booking>> {
    try {
      const page = Math.max(1, params.page);
      const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, params.pageSize));
      const filters = [
        {
          field: "status" as const,
          operator: "in" as const,
          value: ["CREATED", "CANCELLED", "FINISHED"],
        },
        ...(params.id != null && params.id.trim() !== ""
          ? [
              {
                field: "id" as const,
                operator: "==" as const,
                value: params.id.trim(),
              },
            ]
          : []),
      ];

      const result = await FirestoreService.getAllPaginated<Booking>(
        BOOKINGS_COLLECTION,
        { page, pageSize },
        filters
      );
      return {
        ...result,
        data: result.data.map((booking) => this.normalizeBooking(booking)),
      };
    } catch (error) {
      if (error instanceof CustomError) throw error;
      throw CustomError.internalServerError("Error interno del servidor");
    }
  }

  async createBooking(dto: CreateBookingDto): Promise<Booking> {
    let createdBookingId: string | null = null;
    const createdAppointmentIds: string[] = [];

    try {
      if (dto.appointments.length === 0) {
        throw CustomError.badRequest(
          "Un booking debe incluir al menos un servicio/cita"
        );
      }
      this.ensureBookingAppointmentsNotInPast(dto.appointments);

      await this.appointmentService.ensureBusinessAndBranch(
        dto.businessId,
        dto.branchId
      );
      await this.appointmentService.ensureClientForBusiness(dto.businessId, {
        document: dto.clientId,
        ...(dto.clientDocumentTypeId !== undefined && {
          documentTypeId: dto.clientDocumentTypeId,
        }),
        ...(dto.clientDocumentTypeName !== undefined && {
          documentTypeName: dto.clientDocumentTypeName,
        }),
        ...(dto.clientName !== undefined && { name: dto.clientName }),
        ...(dto.clientPhone !== undefined && { phone: dto.clientPhone }),
        ...(dto.clientEmail !== undefined && { email: dto.clientEmail }),
      });

      const totalPrice = await this.calculateTotalPrice(dto.businessId, dto.appointments);
      const paidAmount = dto.paidAmount ?? 0;
      if (paidAmount > totalPrice) {
        throw CustomError.badRequest(
          "paidAmount no puede ser mayor al totalAmount"
        );
      }
      const paymentStatus = this.resolvePaymentStatus(totalPrice, paidAmount);

      const createdBooking = await FirestoreService.create<{
        businessId: string;
        branchId: string;
        appointments: string[];
        clientId: string;
        status: "CREATED";
        totalAmount: number;
        paymentMethod: CreateBookingDto["paymentMethod"];
        paidAmount: number;
        paymentStatus: BookingPaymentStatus;
        createdAt: ReturnType<typeof FirestoreDataBase.generateTimeStamp>;
      }>(BOOKINGS_COLLECTION, {
        businessId: dto.businessId,
        branchId: dto.branchId,
        appointments: [],
        clientId: dto.clientId,
        status: "CREATED",
        totalAmount: totalPrice,
        paymentMethod: dto.paymentMethod,
        paidAmount,
        paymentStatus,
        createdAt: FirestoreDataBase.generateTimeStamp(),
      });
      createdBookingId = createdBooking.id;

      for (const appointmentInput of dto.appointments) {
        const createdAppointment =
          await this.appointmentService.createAppointmentForBooking({
            bookingId: createdBooking.id,
            date: appointmentInput.date,
            startTime: appointmentInput.startTime,
            endTime: appointmentInput.endTime,
            serviceId: appointmentInput.serviceId,
            employeeId: appointmentInput.employeeId,
          });
        createdAppointmentIds.push(createdAppointment.id);
      }

      await FirestoreService.update(BOOKINGS_COLLECTION, createdBooking.id, {
        appointments: createdAppointmentIds,
        updatedAt: FirestoreDataBase.generateTimeStamp(),
      });

      return await this.getBookingById(createdBooking.id);
    } catch (error) {
      await this.compensateFailedCreation(createdBookingId, createdAppointmentIds);
      if (error instanceof CustomError) throw error;
      throw CustomError.internalServerError("Error interno del servidor");
    }
  }

  async updateBooking(id: string, dto: UpdateBookingDto): Promise<Booking> {
    try {
      const existingBooking = await this.getBookingById(id);
      if (existingBooking.status === "DELETED") {
        throw CustomError.badRequest("No se puede editar un booking eliminado");
      }

      const nextBranchId = dto.branchId ?? existingBooking.branchId;
      if (
        dto.branchId !== undefined &&
        dto.branchId.trim() !== existingBooking.branchId.trim()
      ) {
        await this.appointmentService.ensureBusinessAndBranch(
          existingBooking.businessId,
          nextBranchId
        );
      }

      if (dto.clientId !== undefined) {
        await this.appointmentService.ensureClientForBusiness(
          existingBooking.businessId,
          {
            document: dto.clientId,
            ...(dto.clientDocumentTypeId !== undefined && {
              documentTypeId: dto.clientDocumentTypeId,
            }),
            ...(dto.clientDocumentTypeName !== undefined && {
              documentTypeName: dto.clientDocumentTypeName,
            }),
            ...(dto.clientName !== undefined && { name: dto.clientName }),
            ...(dto.clientPhone !== undefined && { phone: dto.clientPhone }),
            ...(dto.clientEmail !== undefined && { email: dto.clientEmail }),
          }
        );
      }

      const isDeletingBooking = dto.status === "DELETED";
      if (!isDeletingBooking) {
        await this.ensureServicesEditableForBookingUpdate(
          existingBooking.businessId,
          dto
        );
      }
      this.ensureBookingOperationsNotInPast(dto);

      const appointmentIds = new Set(existingBooking.appointments);

      if (dto.operations != null) {
        for (const operation of dto.operations) {
          if (operation.op === "add") {
            const createdAppointment =
              await this.appointmentService.createAppointmentForBooking({
                bookingId: existingBooking.id,
                date: operation.date,
                startTime: operation.startTime,
                endTime: operation.endTime,
                serviceId: operation.serviceId,
                employeeId: operation.employeeId,
              });
            appointmentIds.add(createdAppointment.id);
            continue;
          }

          const appointment = await this.ensureAppointmentBelongsToBooking(
            existingBooking.id,
            operation.appointmentId
          );
          appointmentIds.add(appointment.id);

          if (operation.op === "cancel") {
            if (appointment.status !== "DELETED") {
              await this.appointmentService.cancelAppointment(operation.appointmentId);
            }
            continue;
          }

          if (appointment.status === "DELETED") {
            throw CustomError.badRequest(
              "No se puede editar una cita eliminada"
            );
          }

          await this.appointmentService.updateAppointment(
            operation.appointmentId,
            {
              date: operation.date,
              startTime: operation.startTime,
              endTime: operation.endTime,
              serviceId: operation.serviceId,
              employeeId: operation.employeeId,
            },
            { branchIdOverride: nextBranchId }
          );
        }
      }

      const normalizedAppointmentIds = Array.from(appointmentIds);
      if (normalizedAppointmentIds.length === 0) {
        throw CustomError.badRequest(
          "Un booking debe incluir al menos un servicio/cita"
        );
      }

      let totalAmount = existingBooking.totalAmount;
      let paidAmount = dto.paidAmount ?? existingBooking.paidAmount;
      let paymentStatus = existingBooking.paymentStatus;
      if (!isDeletingBooking) {
        totalAmount = await this.calculateTotalPriceFromAppointments(
          existingBooking.businessId,
          normalizedAppointmentIds
        );
        if (paidAmount > totalAmount) {
          throw CustomError.badRequest(
            "paidAmount no puede ser mayor al totalAmount"
          );
        }
        paymentStatus = this.resolvePaymentStatus(totalAmount, paidAmount);
      }

      const payload: Record<string, unknown> = {
        appointments: normalizedAppointmentIds,
        totalAmount,
        paidAmount,
        paymentStatus,
        updatedAt: FirestoreDataBase.generateTimeStamp(),
      };

      if (dto.branchId !== undefined) {
        payload.branchId = nextBranchId;
      }

      if (dto.clientId !== undefined) {
        payload.clientId = dto.clientId;
      }
      if (dto.paymentMethod !== undefined) {
        payload.paymentMethod = dto.paymentMethod;
      }

      if (dto.status !== undefined) {
        if (dto.status === "DELETED") {
          await this.reviewService.deleteReviewsByAppointmentIds(
            normalizedAppointmentIds
          );
        }
        await this.applyStatusToAppointments(dto.status, normalizedAppointmentIds);
        payload.status = dto.status;

        if (dto.status === "CANCELLED") {
          payload.cancelledAt = FirestoreDataBase.generateTimeStamp();
          payload.deletedAt = FieldValue.delete();
        } else if (dto.status === "DELETED") {
          payload.deletedAt = FirestoreDataBase.generateTimeStamp();
          payload.cancelledAt = FieldValue.delete();
        } else {
          payload.cancelledAt = FieldValue.delete();
          payload.deletedAt = FieldValue.delete();
        }

        payload.totalAmount = totalAmount;
        payload.paidAmount = paidAmount;
        payload.paymentStatus = paymentStatus;
      }

      await FirestoreService.update(BOOKINGS_COLLECTION, id, payload);
      return await this.getBookingById(id);
    } catch (error) {
      if (error instanceof CustomError) throw error;
      throw CustomError.internalServerError("Error interno del servidor");
    }
  }

  async deleteBooking(id: string): Promise<Booking> {
    try {
      return await this.updateBooking(id, { status: "DELETED" });
    } catch (error) {
      if (error instanceof CustomError) throw error;
      throw CustomError.internalServerError("Error interno del servidor");
    }
  }

  private async compensateFailedCreation(
    bookingId: string | null,
    appointmentIds: string[]
  ): Promise<void> {
    const deletedAt = FirestoreDataBase.generateTimeStamp();

    await Promise.allSettled(
      appointmentIds.map((appointmentId) =>
        FirestoreService.update("Appointments", appointmentId, {
          status: "DELETED",
          deletedAt,
        }).catch(() => undefined)
      )
    );

    if (bookingId) {
      await FirestoreService.update(BOOKINGS_COLLECTION, bookingId, {
        appointments: appointmentIds,
        status: "DELETED",
        deletedAt,
        updatedAt: deletedAt,
      }).catch(() => undefined);
    }
  }

  private async calculateTotalPrice(
    businessId: string,
    appointmentInputs: CreateBookingAppointmentDto[]
  ): Promise<number> {
    const requestedServiceIds = appointmentInputs.map(
      (appointment) => appointment.serviceId
    );
    return this.calculateTotalPriceFromServiceIds(businessId, requestedServiceIds);
  }

  private async calculateTotalPriceFromAppointments(
    businessId: string,
    appointmentIds: string[]
  ): Promise<number> {
    if (appointmentIds.length === 0) return 0;

    const appointments = await Promise.all(
      appointmentIds.map((appointmentId) =>
        this.appointmentService.getAppointmentById(appointmentId)
      )
    );
    const activeServiceIds = appointments
      .filter(
        (appointment) =>
          appointment.status !== "CANCELLED" && appointment.status !== "DELETED"
      )
      .map((appointment) => appointment.serviceId.trim())
      .filter((serviceId) => serviceId !== "");

    return this.calculateTotalPriceFromServiceIds(businessId, activeServiceIds);
  }

  private ensureBookingAppointmentsNotInPast(
    appointments: CreateBookingAppointmentDto[]
  ): void {
    appointments.forEach((appointment) => {
      this.appointmentService.ensureAppointmentDateTimeIsNotPast(
        appointment.date,
        appointment.startTime
      );
    });
  }

  private ensureBookingOperationsNotInPast(dto: UpdateBookingDto): void {
    (dto.operations ?? []).forEach((operation) => {
      if (operation.op === "cancel") return;
      this.appointmentService.ensureAppointmentDateTimeIsNotPast(
        operation.date,
        operation.startTime
      );
    });
  }

  private async ensureServicesEditableForBookingUpdate(
    businessId: string,
    dto: UpdateBookingDto
  ): Promise<void> {
    const requestedServiceIds = (dto.operations ?? [])
      .filter((operation) => operation.op !== "cancel")
      .map((operation) => operation.serviceId.trim())
      .filter((serviceId) => serviceId !== "");

    if (requestedServiceIds.length === 0) return;

    const requestedUniqueServiceIds = Array.from(new Set(requestedServiceIds));
    const services = await FirestoreService.getAll<Service>(SERVICES_COLLECTION, [
      { field: "businessId", operator: "==", value: businessId },
    ]);
    const servicesById = new Map(
      services.map((service) => [service.id.trim(), service] as const)
    );

    const deletedServiceIds: string[] = [];
    const missingServiceIds: string[] = [];
    for (const serviceId of requestedUniqueServiceIds) {
      const service = servicesById.get(serviceId);
      if (service == null) {
        missingServiceIds.push(serviceId);
        continue;
      }
      if (service.status === "DELETED") {
        deletedServiceIds.push(serviceId);
      }
    }

    if (deletedServiceIds.length > 0) {
      throw CustomError.badRequest(
        `No se puede editar el agendamiento porque estos servicios están eliminados: ${deletedServiceIds.join(", ")}`
      );
    }

    if (missingServiceIds.length > 0) {
      throw CustomError.badRequest(
        `Los siguientes servicios no existen en el negocio: ${missingServiceIds.join(", ")}`
      );
    }
  }

  private async calculateTotalPriceFromServiceIds(
    businessId: string,
    serviceIds: string[]
  ): Promise<number> {
    const requestedServiceIds = serviceIds.map((serviceId) => serviceId.trim());
    const requestedUniqueServiceIds = Array.from(
      new Set(requestedServiceIds.filter((serviceId) => serviceId !== ""))
    );

    const services = await FirestoreService.getAll<Service>(SERVICES_COLLECTION, [
      { field: "businessId", operator: "==", value: businessId },
    ]);
    const servicesById = new Map(
      services
        .filter((service) => service.status !== "DELETED")
        .map((service) => [service.id.trim(), service] as const)
    );

    const invalidServiceIds = requestedUniqueServiceIds.filter(
      (serviceId) => !servicesById.has(serviceId)
    );
    if (invalidServiceIds.length > 0) {
      throw CustomError.badRequest(
        `Los siguientes servicios no existen en el negocio: ${invalidServiceIds.join(", ")}`
      );
    }

    return requestedServiceIds.reduce((total, serviceId) => {
      const service = servicesById.get(serviceId);
      return total + (service?.price ?? 0);
    }, 0);
  }

  private async ensureAppointmentBelongsToBooking(
    bookingId: string,
    appointmentId: string
  ): Promise<{ id: string; status: string }> {
    const appointment = await this.appointmentService.getAppointmentById(appointmentId);
    if (appointment.bookingId !== bookingId) {
      throw CustomError.badRequest(
        `La cita ${appointmentId} no pertenece al booking ${bookingId}`
      );
    }

    return {
      id: appointment.id,
      status: appointment.status,
    };
  }

  private async applyStatusToAppointments(
    status: BookingStatus,
    appointmentIds: string[]
  ): Promise<void> {
    if (appointmentIds.length === 0) return;

    await Promise.all(
      appointmentIds.map(async (appointmentId) => {
        const appointment = await this.appointmentService.getAppointmentById(
          appointmentId
        );
        if (appointment.status === "DELETED") {
          return;
        }

        const timestamp = FirestoreDataBase.generateTimeStamp();
        const payload: Record<string, unknown> = {
          status,
          updatedAt: timestamp,
        };

        if (status === "CANCELLED") {
          payload.cancelledAt = timestamp;
          payload.deletedAt = FieldValue.delete();
        } else if (status === "DELETED") {
          payload.deletedAt = timestamp;
          payload.cancelledAt = FieldValue.delete();
        } else {
          payload.cancelledAt = FieldValue.delete();
          payload.deletedAt = FieldValue.delete();
        }

        await FirestoreService.update(APPOINTMENTS_COLLECTION, appointmentId, payload);
      })
    );
  }

  private async getBookingById(id: string): Promise<Booking> {
    const booking = await FirestoreService.getById<Booking>(BOOKINGS_COLLECTION, id);
    return this.normalizeBooking(booking);
  }

  private normalizeBooking(booking: Booking): Booking {
    const appointments = Array.from(
      new Set(
        (booking.appointments ?? [])
          .map((appointmentId) => appointmentId.trim())
          .filter((appointmentId) => appointmentId !== "")
      )
    );

    const legacyBooking = booking as Booking & { totalPrice?: number };
    const totalAmount =
      Number.isFinite(booking.totalAmount) && booking.totalAmount >= 0
        ? booking.totalAmount
        : Number.isFinite(legacyBooking.totalPrice) && (legacyBooking.totalPrice ?? 0) >= 0
          ? (legacyBooking.totalPrice as number)
          : 0;
    const paidAmount =
      Number.isFinite(booking.paidAmount) && booking.paidAmount >= 0
        ? booking.paidAmount
        : 0;

    return {
      ...booking,
      appointments,
      totalAmount,
      paidAmount,
      paymentStatus: this.resolvePaymentStatus(totalAmount, paidAmount),
    };
  }

  private resolvePaymentStatus(
    totalAmount: number,
    paidAmount: number
  ): BookingPaymentStatus {
    if (totalAmount <= 0 || paidAmount <= 0) {
      return "PENDING";
    }
    if (paidAmount >= totalAmount) {
      return "PAID";
    }
    return "PARTIALLY_PAID";
  }
}
