import {
  CLOUD_TASK_TOKEN_HEADER,
  WHATSAPP_SEND_MESSAGE_PATH,
} from "../../config/cloud-tasks.config";
import type { WhatsAppMessageTaskType } from "../../config/whatsapp-message-types.config";
import { CustomError } from "../../domain/errors/custom-error";
import type { TaskQueueProvider } from "../../domain/interfaces/task-queue.interface";

export interface ScheduleAppointmentStatusTasksInput {
  appointmentId: string;
  date: string;
  startTime: string;
  endTime: string;
}

export interface AppointmentStatusTaskScheduler {
  scheduleAppointmentStatusTasks(input: ScheduleAppointmentStatusTasksInput): Promise<void>;
}

export interface AppointmentStatusTaskSchedulerConfig {
  targetBaseUrl: string;
  internalToken: string;
}

export class AppointmentStatusTaskSchedulerService
  implements AppointmentStatusTaskScheduler
{
  constructor(
    private readonly taskQueueProvider: TaskQueueProvider,
    private readonly config: AppointmentStatusTaskSchedulerConfig
  ) {}

  async scheduleAppointmentStatusTasks(
    input: ScheduleAppointmentStatusTasksInput
  ): Promise<void> {
    const appointmentId = input.appointmentId.trim();
    if (appointmentId === "") {
      throw CustomError.badRequest("No se puede programar task sin appointmentId");
    }

    const targetBaseUrl = this.config.targetBaseUrl.trim();
    if (targetBaseUrl === "") {
      throw CustomError.internalServerError(
        "Configuración incompleta de Cloud Tasks: CLOUD_TASKS_TARGET_BASE_URL"
      );
    }

    const internalToken = this.config.internalToken.trim();
    if (internalToken === "") {
      throw CustomError.internalServerError(
        "Configuración incompleta de Cloud Tasks: CLOUD_TASKS_INTERNAL_TOKEN"
      );
    }

    await Promise.all([
      this.enqueueStatusTask(
        "appointment-status-in-progress",
        appointmentId,
        input.date,
        input.startTime,
        targetBaseUrl,
        internalToken
      ),
      this.enqueueStatusTask(
        "appointment-status-finished",
        appointmentId,
        input.date,
        input.endTime,
        targetBaseUrl,
        internalToken
      ),
    ]);
  }

  private async enqueueStatusTask(
    type: WhatsAppMessageTaskType,
    appointmentId: string,
    date: string,
    time: string,
    targetBaseUrl: string,
    internalToken: string
  ): Promise<void> {
    const delaySeconds = this.computeDelaySeconds(date, time);
    const taskId = this.buildTaskId(type, appointmentId);

    await this.taskQueueProvider.createHttpTask({
      taskId,
      url: this.buildTaskUrl(targetBaseUrl, type),
      method: "POST",
      scheduleDelaySeconds: delaySeconds,
      headers: {
        [CLOUD_TASK_TOKEN_HEADER]: internalToken,
      },
      body: {
        appointmentId,
      },
    });
  }

  private buildTaskUrl(targetBaseUrl: string, type: WhatsAppMessageTaskType): string {
    const normalizedBaseUrl = targetBaseUrl.trim().replace(/\/+$/, "");
    return `${normalizedBaseUrl}${WHATSAPP_SEND_MESSAGE_PATH}/${type}`;
  }

  private buildTaskId(type: WhatsAppMessageTaskType, appointmentId: string): string {
    return `appointment-${type}-${appointmentId}`;
  }

  private computeDelaySeconds(date: string, time: string): number {
    const dateMatch = date.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
    const timeMatch = time.trim().match(/^([01]\d|2[0-3]):([0-5]\d)$/);
    if (!dateMatch || !timeMatch) {
      return 0;
    }

    const year = Number(dateMatch[1]);
    const month = Number(dateMatch[2]);
    const day = Number(dateMatch[3]);
    const hours = Number(timeMatch[1]);
    const minutes = Number(timeMatch[2]);

    const scheduledDate = new Date(year, month - 1, day, hours, minutes, 0, 0);
    const delayMs = scheduledDate.getTime() - Date.now();
    if (!Number.isFinite(delayMs) || delayMs <= 0) {
      return 0;
    }

    return Math.floor(delayMs / 1000);
  }
}
