import type { WhatsAppMessageTaskType } from "../../config/whatsapp-message-types.config";
import type { Booking } from "../../domain/interfaces/booking.interface";
import { CustomError } from "../../domain/errors/custom-error";
import FirestoreService from "./firestore.service";
import { AppointmentService } from "./appointment.service";
import { UserService } from "./user.service";
import type { WhatsAppService } from "./whatsapp.service";

const BOOKINGS_COLLECTION = "Bookings";

export interface HandleWhatsAppTaskInput {
  type: WhatsAppMessageTaskType;
  appointmentId: string;
}

export interface HandleWhatsAppTaskResult {
  type: WhatsAppMessageTaskType;
  appointmentId: string;
  changed: boolean;
  appointmentStatus: string;
  sentWhatsApp: boolean;
}

export class WhatsAppTaskService {
  constructor(
    private readonly appointmentService: AppointmentService,
    private readonly whatsAppService: WhatsAppService,
    private readonly userService: UserService = new UserService()
  ) {}

  async handleTask(input: HandleWhatsAppTaskInput): Promise<HandleWhatsAppTaskResult> {
    if (input.type === "appointment-status-in-progress") {
      const result = await this.appointmentService.markAppointmentInProgressIfDue(
        input.appointmentId
      );
      return {
        type: input.type,
        appointmentId: result.appointment.id,
        changed: result.changed,
        appointmentStatus: result.appointment.status,
        sentWhatsApp: false,
      };
    }

    if (input.type === "appointment-status-finished") {
      const result = await this.appointmentService.markAppointmentFinishedIfDue(
        input.appointmentId
      );
      let sentWhatsApp = false;
      if (result.appointment.status === "FINISHED") {
        const phone = await this.resolveClientPhoneByBookingId(result.appointment.bookingId);
        if (phone != null) {
          await this.whatsAppService.sendTemplateMessage({
            to: phone,
            templateType: "APPOINTMENT_COMPLETION",
          });
          sentWhatsApp = true;
        }
      }

      return {
        type: input.type,
        appointmentId: result.appointment.id,
        changed: result.changed,
        appointmentStatus: result.appointment.status,
        sentWhatsApp,
      };
    }

    throw CustomError.badRequest("type de WhatsApp no soportado");
  }

  private async resolveClientPhoneByBookingId(bookingId: string): Promise<string | null> {
    const sanitizedBookingId = bookingId.trim();
    if (sanitizedBookingId === "") return null;

    let booking: Booking;
    try {
      booking = await FirestoreService.getById<Booking>(
        BOOKINGS_COLLECTION,
        sanitizedBookingId
      );
    } catch (error) {
      if (error instanceof CustomError && error.statusCode === 404) {
        return null;
      }
      throw error;
    }

    const clientDocument = booking.clientId?.trim() ?? "";
    if (clientDocument === "") return null;

    const user = await this.userService.getByDocument(clientDocument);
    const phone = user?.phone?.trim() ?? "";
    return phone !== "" ? phone : null;
  }
}
