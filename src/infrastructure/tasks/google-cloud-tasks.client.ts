import { CloudTasksClient, protos } from "@google-cloud/tasks";
import { CustomError } from "../../domain/errors/custom-error";
import type {
  CreateHttpTaskInput,
  CreateHttpTaskResult,
  QueueHttpMethod,
  TaskQueueProvider,
} from "../../domain/interfaces/task-queue.interface";

export interface GoogleCloudTasksConfig {
  projectId: string;
  location: string;
  queue: string;
}

export class GoogleCloudTasksQueueProvider implements TaskQueueProvider {
  private readonly client: CloudTasksClient;

  constructor(
    private readonly config: GoogleCloudTasksConfig,
    client?: CloudTasksClient
  ) {
    this.client = client ?? new CloudTasksClient();
  }

  async createHttpTask(input: CreateHttpTaskInput): Promise<CreateHttpTaskResult> {
    this.ensureConfigured();

    const projectId = this.config.projectId.trim();
    const location = this.config.location.trim();
    const queue = this.config.queue.trim();

    const parent = this.client.queuePath(projectId, location, queue);
    const taskNameForRequest = this.resolveTaskName(projectId, location, queue, input.taskId);
    const task = this.buildTask(input, taskNameForRequest);

    try {
      const [response] = await this.client.createTask({
        parent,
        task,
      });

      const taskName = response.name?.trim() ?? "";
      if (taskName === "") {
        throw CustomError.internalServerError(
          "Google Cloud Tasks respondió sin nombre de tarea"
        );
      }

      return {
        taskName,
        ...(this.toIsoString(response.scheduleTime) != null && {
          scheduleTime: this.toIsoString(response.scheduleTime)!,
        }),
      };
    } catch (error) {
      if (this.isAlreadyExistsError(error) && taskNameForRequest != null) {
        return { taskName: taskNameForRequest };
      }

      if (error instanceof CustomError) throw error;

      const details =
        error instanceof Error
          ? error.message
          : typeof error === "string"
            ? error
            : JSON.stringify(error);

      throw CustomError.internalServerError(
        `No se pudo crear la task en Google Cloud Tasks. detalle=${details}`
      );
    }
  }

  private buildTask(
    input: CreateHttpTaskInput,
    taskNameForRequest?: string
  ): protos.google.cloud.tasks.v2.ITask {
    const url = input.url.trim();
    if (url === "") {
      throw CustomError.internalServerError(
        "No se puede crear una task sin URL destino"
      );
    }

    const method = input.method ?? "POST";
    const headers = {
      ...(input.headers ?? {}),
    };

    const hasBody = input.body !== undefined;
    const bodyBuffer = hasBody ? Buffer.from(JSON.stringify(input.body)) : undefined;

    if (hasBody && headers["Content-Type"] == null && headers["content-type"] == null) {
      headers["Content-Type"] = "application/json";
    }

    const task: protos.google.cloud.tasks.v2.ITask = {
      ...(taskNameForRequest != null && { name: taskNameForRequest }),
      httpRequest: {
        httpMethod: this.resolveHttpMethod(method),
        url,
        headers,
        ...(bodyBuffer != null && { body: bodyBuffer }),
      },
    };

    if (
      input.scheduleDelaySeconds != null &&
      Number.isFinite(input.scheduleDelaySeconds) &&
      input.scheduleDelaySeconds > 0
    ) {
      const delaySeconds = Math.floor(input.scheduleDelaySeconds);
      const scheduleEpochSeconds = Math.floor(Date.now() / 1000) + delaySeconds;
      task.scheduleTime = {
        seconds: scheduleEpochSeconds,
        nanos: 0,
      };
    }

    return task;
  }

  private resolveTaskName(
    projectId: string,
    location: string,
    queue: string,
    taskId: string | undefined
  ): string | undefined {
    if (taskId == null || taskId.trim() === "") return undefined;

    const normalizedTaskId = taskId
      .trim()
      .replace(/[^a-zA-Z0-9_-]/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 500);

    if (normalizedTaskId === "") return undefined;

    return this.client.taskPath(projectId, location, queue, normalizedTaskId);
  }

  private isAlreadyExistsError(error: unknown): boolean {
    const code =
      typeof error === "object" &&
      error != null &&
      "code" in error &&
      typeof (error as { code?: unknown }).code === "number"
        ? (error as { code: number }).code
        : undefined;

    if (code === 6) return true;

    const message =
      error instanceof Error
        ? error.message
        : typeof error === "string"
          ? error
          : "";

    return message.toUpperCase().includes("ALREADY_EXISTS");
  }

  private resolveHttpMethod(
    method: QueueHttpMethod
  ): protos.google.cloud.tasks.v2.HttpMethod {
    switch (method) {
      case "POST":
        return protos.google.cloud.tasks.v2.HttpMethod.POST;
      case "PUT":
        return protos.google.cloud.tasks.v2.HttpMethod.PUT;
      case "PATCH":
        return protos.google.cloud.tasks.v2.HttpMethod.PATCH;
      case "DELETE":
        return protos.google.cloud.tasks.v2.HttpMethod.DELETE;
      default:
        return protos.google.cloud.tasks.v2.HttpMethod.POST;
    }
  }

  private toIsoString(
    scheduleTime: protos.google.protobuf.ITimestamp | null | undefined
  ): string | undefined {
    if (scheduleTime == null || scheduleTime.seconds == null) return undefined;

    const seconds = Number(scheduleTime.seconds);
    if (!Number.isFinite(seconds)) return undefined;

    const nanos = Number(scheduleTime.nanos ?? 0);
    const millis = seconds * 1000 + Math.floor(nanos / 1_000_000);
    return new Date(millis).toISOString();
  }

  private ensureConfigured(): void {
    const missing: string[] = [];

    if (this.isUnset(this.config.projectId)) missing.push("CLOUD_TASKS_PROJECT_ID");
    if (this.isUnset(this.config.location)) missing.push("CLOUD_TASKS_LOCATION");
    if (this.isUnset(this.config.queue)) missing.push("CLOUD_TASKS_QUEUE");

    if (missing.length > 0) {
      throw CustomError.internalServerError(
        `Configuración incompleta de Cloud Tasks: ${missing.join(", ")}`
      );
    }
  }

  private isUnset(value: string): boolean {
    const normalized = value.trim();
    return (
      normalized === "" ||
      normalized.toUpperCase().includes("REPLACE_ME") ||
      normalized.includes("<") ||
      normalized.includes(">")
    );
  }
}
