export const METRIC_TYPES = {
  REVENUE: "REVENUE",
  APPOINTMENTS_COUNT: "APPOINTMENTS_COUNT",
  AVERAGE_TICKET: "AVERAGE_TICKET",
  CANCELLATION_RATE: "CANCELLATION_RATE",
  COMPLETION_RATE: "COMPLETION_RATE",
  EMPLOYEE_PRODUCTIVITY: "EMPLOYEE_PRODUCTIVITY",
  BUSINESS_GROWTH: "BUSINESS_GROWTH",
} as const;

export type MetricCalculationType =
  (typeof METRIC_TYPES)[keyof typeof METRIC_TYPES];

// Admite aliases en distintos formatos para facilitar integración desde cliente.
export const METRIC_TYPE_QUERY_ALIASES: Record<string, MetricCalculationType> = {
  revenue: METRIC_TYPES.REVENUE,
  appointments: METRIC_TYPES.APPOINTMENTS_COUNT,
  appointments_count: METRIC_TYPES.APPOINTMENTS_COUNT,
  number_of_appointments: METRIC_TYPES.APPOINTMENTS_COUNT,
  average_ticket: METRIC_TYPES.AVERAGE_TICKET,
  ticket_average: METRIC_TYPES.AVERAGE_TICKET,
  cancel_rate: METRIC_TYPES.CANCELLATION_RATE,
  cancellation_rate: METRIC_TYPES.CANCELLATION_RATE,
  completion_rate: METRIC_TYPES.COMPLETION_RATE,
  employee_productivity: METRIC_TYPES.EMPLOYEE_PRODUCTIVITY,
  business_growth: METRIC_TYPES.BUSINESS_GROWTH,
  growth_rate: METRIC_TYPES.BUSINESS_GROWTH,
};
