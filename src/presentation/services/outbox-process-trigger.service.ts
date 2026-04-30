import { CLOUD_TASK_TOKEN_HEADER } from "../../config/cloud-tasks.config";
import type { TaskQueueProvider } from "../../domain/interfaces/task-queue.interface";
import { logger } from "../../infrastructure/logger/logger";

export interface OutboxProcessTrigger {
  enqueueProcessBatch(input?: { reason?: string; limit?: number }): Promise<void>;
}

export interface OutboxProcessTriggerConfig {
  targetBaseUrl: string;
  internalToken: string;
  defaultLimit: number;
}

export class OutboxProcessTriggerService implements OutboxProcessTrigger {
  constructor(
    private readonly taskQueueProvider: TaskQueueProvider,
    private readonly config: OutboxProcessTriggerConfig
  ) {}

  async enqueueProcessBatch(input?: { reason?: string; limit?: number }): Promise<void> {
    const targetBaseUrl = this.normalizeBaseUrl(this.config.targetBaseUrl);
    const internalToken = this.config.internalToken.trim();
    if (targetBaseUrl === "" || internalToken === "") {
      logger.warn(
        "[OutboxProcessTriggerService] No se programa procesamiento de outbox por configuración incompleta"
      );
      return;
    }

    const limit = this.normalizeLimit(input?.limit, this.config.defaultLimit);
    const url = `${targetBaseUrl}/outbox/process?limit=${limit}`;
    await this.taskQueueProvider.createHttpTask({
      url,
      method: "POST",
      headers: {
        [CLOUD_TASK_TOKEN_HEADER]: internalToken,
      },
      body: {
        source: "outbox-process-trigger",
        reason: input?.reason?.trim() ?? "outbox-event-enqueued",
      },
    });
  }

  private normalizeBaseUrl(value: string): string {
    const normalized = value.trim();
    return normalized.endsWith("/") ? normalized.slice(0, -1) : normalized;
  }

  private normalizeLimit(value: number | undefined, fallback: number): number {
    const candidate = value ?? fallback;
    if (!Number.isFinite(candidate) || candidate <= 0) {
      return 20;
    }
    return Math.floor(candidate);
  }
}
