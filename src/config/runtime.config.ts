export const infobipRuntimeConfig = {
  timeoutMs: 10000,
} as const;

export const outboxProcessorRuntimeConfig = {
  enabled: false,
  intervalMs: 15000,
  batchSize: 20,
  processingTimeoutSeconds: 300,
  retryBaseDelaySeconds: 15,
  retryMaxDelaySeconds: 900,
} as const;
