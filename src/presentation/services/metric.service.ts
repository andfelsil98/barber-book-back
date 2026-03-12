import { FirestoreDataBase } from "../../data/firestore/firestore.database";
import { FieldValue } from "firebase-admin/firestore";
import { CustomError } from "../../domain/errors/custom-error";
import type { Metric, MetricType } from "../../domain/interfaces/metric.interface";
import type {
  PaginatedResult,
  PaginationParams,
} from "../../domain/interfaces/pagination.interface";
import { MAX_PAGE_SIZE } from "../../domain/interfaces/pagination.interface";
import FirestoreService from "./firestore.service";

const COLLECTION_NAME = "Metrics";

interface MetricDeltas {
  revenueDelta: number;
  appointmentsDelta: number;
  completedAppointmentsDelta: number;
  cancelledAppointmentsDelta: number;
}

interface MetricIdentity {
  type: MetricType;
  businessId?: string;
  branchId?: string;
  employeeId?: string;
  date?: string;
  month?: string;
}

export interface ApplyAppointmentMetricDeltaInput {
  businessId: string;
  branchId: string;
  employeeId: string;
  date: string;
  revenueDelta?: number;
  appointmentsDelta?: number;
  completedAppointmentsDelta?: number;
  cancelledAppointmentsDelta?: number;
}

export class MetricService {
  async getAllMetrics(
    params: PaginationParams & {
      id?: string;
      type?: MetricType;
      businessId?: string;
      branchId?: string;
      employeeId?: string;
      date?: string;
      month?: string;
    }
  ): Promise<PaginatedResult<Metric>> {
    try {
      const page = Math.max(1, params.page);
      const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, params.pageSize));

      const filters = [
        ...(params.id != null && params.id.trim() !== ""
          ? [{ field: "id" as const, operator: "==" as const, value: params.id.trim() }]
          : []),
        ...(params.type != null
          ? [{ field: "type" as const, operator: "==" as const, value: params.type }]
          : []),
        ...(params.businessId != null && params.businessId.trim() !== ""
          ? [
              {
                field: "businessId" as const,
                operator: "==" as const,
                value: params.businessId.trim(),
              },
            ]
          : []),
        ...(params.branchId != null && params.branchId.trim() !== ""
          ? [
              {
                field: "branchId" as const,
                operator: "==" as const,
                value: params.branchId.trim(),
              },
            ]
          : []),
        ...(params.employeeId != null && params.employeeId.trim() !== ""
          ? [
              {
                field: "employeeId" as const,
                operator: "==" as const,
                value: params.employeeId.trim(),
              },
            ]
          : []),
        ...(params.date != null && params.date.trim() !== ""
          ? [{ field: "date" as const, operator: "==" as const, value: params.date.trim() }]
          : []),
        ...(params.month != null && params.month.trim() !== ""
          ? [
              {
                field: "month" as const,
                operator: "==" as const,
                value: params.month.trim(),
              },
            ]
          : []),
      ];

      const result = await FirestoreService.getAllPaginated<Metric>(
        COLLECTION_NAME,
        { page, pageSize },
        filters
      );

      return result as PaginatedResult<Metric>;
    } catch (error) {
      if (error instanceof CustomError) throw error;
      throw CustomError.internalServerError("Error interno del servidor");
    }
  }

  async applyAppointmentMetricDelta(
    input: ApplyAppointmentMetricDeltaInput
  ): Promise<void> {
    const businessId = input.businessId.trim();
    const branchId = input.branchId.trim();
    const employeeId = input.employeeId.trim();
    const date = input.date.trim();

    if (businessId === "" || branchId === "" || employeeId === "" || date === "") {
      throw CustomError.badRequest(
        "businessId, branchId, employeeId y date son requeridos para actualizar métricas"
      );
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      throw CustomError.badRequest("date debe tener formato YYYY-MM-DD");
    }

    const month = date.slice(0, 7);
    const deltas: MetricDeltas = {
      revenueDelta: this.normalizeDelta(input.revenueDelta),
      appointmentsDelta: this.normalizeDelta(input.appointmentsDelta),
      completedAppointmentsDelta: this.normalizeDelta(input.completedAppointmentsDelta),
      cancelledAppointmentsDelta: this.normalizeDelta(input.cancelledAppointmentsDelta),
    };

    if (this.isZeroDelta(deltas)) return;

    await Promise.all([
      this.applyDeltaToMetricDocument(
        { type: "BUSSINESS", businessId, date },
        deltas
      ),
      this.applyDeltaToMetricDocument(
        { type: "BUSSINESS", businessId, month },
        deltas
      ),
      this.applyDeltaToMetricDocument(
        { type: "BRANCH", branchId, date },
        deltas
      ),
      this.applyDeltaToMetricDocument(
        { type: "BRANCH", branchId, month },
        deltas
      ),
      this.applyDeltaToMetricDocument(
        { type: "EMPLOYEE", employeeId, date },
        deltas
      ),
      this.applyDeltaToMetricDocument(
        { type: "EMPLOYEE", employeeId, month },
        deltas
      ),
    ]);
  }

  private async applyDeltaToMetricDocument(
    identity: MetricIdentity,
    deltas: MetricDeltas
  ): Promise<void> {
    const filters = [
      { field: "type" as const, operator: "==" as const, value: identity.type },
      ...(identity.businessId != null
        ? [
            {
              field: "businessId" as const,
              operator: "==" as const,
              value: identity.businessId,
            },
          ]
        : []),
      ...(identity.branchId != null
        ? [
            {
              field: "branchId" as const,
              operator: "==" as const,
              value: identity.branchId,
            },
          ]
        : []),
      ...(identity.employeeId != null
        ? [
            {
              field: "employeeId" as const,
              operator: "==" as const,
              value: identity.employeeId,
            },
          ]
        : []),
      ...(identity.date != null
        ? [{ field: "date" as const, operator: "==" as const, value: identity.date }]
        : []),
      ...(identity.month != null
        ? [{ field: "month" as const, operator: "==" as const, value: identity.month }]
        : []),
    ];

    const existingMetrics = await FirestoreService.getAll<Metric>(COLLECTION_NAME, filters);
    const existingMetric = existingMetrics[0] ?? null;

    if (existingMetric == null) {
      await FirestoreService.create(COLLECTION_NAME, {
        type: identity.type,
        ...(identity.businessId != null && { businessId: identity.businessId }),
        ...(identity.branchId != null && { branchId: identity.branchId }),
        ...(identity.employeeId != null && { employeeId: identity.employeeId }),
        ...(identity.date != null && { date: identity.date }),
        ...(identity.month != null && { month: identity.month }),
        revenue: this.toNonNegative(deltas.revenueDelta),
        appointments: this.toNonNegative(deltas.appointmentsDelta),
        completedAppointments: this.toNonNegative(deltas.completedAppointmentsDelta),
        cancelledAppointments: this.toNonNegative(deltas.cancelledAppointmentsDelta),
        createdAt: FirestoreDataBase.generateTimeStamp(),
      });
      return;
    }

    const cleanupByType: Record<string, unknown> =
      identity.type === "BUSSINESS"
        ? {
            branchId: FieldValue.delete(),
            employeeId: FieldValue.delete(),
          }
        : identity.type === "BRANCH"
          ? {
              businessId: FieldValue.delete(),
              employeeId: FieldValue.delete(),
            }
          : {
              businessId: FieldValue.delete(),
              branchId: FieldValue.delete(),
            };

    await FirestoreService.update(COLLECTION_NAME, existingMetric.id, {
      ...cleanupByType,
      revenue: this.toNonNegative((existingMetric.revenue ?? 0) + deltas.revenueDelta),
      appointments: this.toNonNegative(
        (existingMetric.appointments ?? 0) + deltas.appointmentsDelta
      ),
      completedAppointments: this.toNonNegative(
        (existingMetric.completedAppointments ?? 0) + deltas.completedAppointmentsDelta
      ),
      cancelledAppointments: this.toNonNegative(
        (existingMetric.cancelledAppointments ?? 0) + deltas.cancelledAppointmentsDelta
      ),
      updatedAt: FirestoreDataBase.generateTimeStamp(),
    });
  }

  private normalizeDelta(value: number | undefined): number {
    if (value == null || !Number.isFinite(value)) return 0;
    return value;
  }

  private isZeroDelta(deltas: MetricDeltas): boolean {
    return (
      deltas.revenueDelta === 0 &&
      deltas.appointmentsDelta === 0 &&
      deltas.completedAppointmentsDelta === 0 &&
      deltas.cancelledAppointmentsDelta === 0
    );
  }

  private toNonNegative(value: number): number {
    if (!Number.isFinite(value) || value <= 0) return 0;
    return value;
  }
}
