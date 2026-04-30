import { envs } from "../../config/envs";
import { outboxProcessorRuntimeConfig } from "../../config/runtime.config";
import { createGoogleCloudTasksQueueProvider } from "../../infrastructure/tasks/google-cloud-tasks.factory";
import { createWhatsAppService } from "../../infrastructure/whatsapp/whatsapp.service.factory";
import { AppointmentStatusTaskSchedulerService } from "../services/appointment-status-task-scheduler.service";
import { AppointmentService } from "../services/appointment.service";
import { BookingService } from "../services/booking.service";
import { BusinessService } from "../services/business.service";
import { OutboxProcessorService } from "../services/outbox-processor.service";
import { PushNotificationService } from "../services/push-notification.service";

export function createOutboxProcessorService(): OutboxProcessorService {
  const cloudTasksProvider = createGoogleCloudTasksQueueProvider();
  const appointmentStatusTaskScheduler =
    new AppointmentStatusTaskSchedulerService(cloudTasksProvider, {
      targetBaseUrl: envs.CLOUD_TASKS_TARGET_BASE_URL,
      internalToken: envs.CLOUD_TASKS_INTERNAL_TOKEN,
    });
  const whatsAppService = createWhatsAppService();
  const pushNotificationService = new PushNotificationService();
  const appointmentService = new AppointmentService(
    undefined,
    appointmentStatusTaskScheduler,
    undefined,
    undefined,
    whatsAppService,
    pushNotificationService
  );
  const bookingService = new BookingService(
    appointmentService,
    undefined,
    appointmentStatusTaskScheduler,
    whatsAppService,
    pushNotificationService
  );
  const businessService = new BusinessService(
    undefined,
    undefined,
    undefined,
    appointmentStatusTaskScheduler
  );

  return new OutboxProcessorService(
    appointmentService,
    bookingService,
    businessService,
    undefined,
    {
      batchSize: outboxProcessorRuntimeConfig.batchSize,
      processingTimeoutSeconds:
        outboxProcessorRuntimeConfig.processingTimeoutSeconds,
      retryBaseDelaySeconds: outboxProcessorRuntimeConfig.retryBaseDelaySeconds,
      retryMaxDelaySeconds: outboxProcessorRuntimeConfig.retryMaxDelaySeconds,
    }
  );
}
