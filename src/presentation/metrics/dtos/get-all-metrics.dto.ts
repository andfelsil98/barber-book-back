import { CustomError } from "../../../domain/errors/custom-error";
import type { MetricType } from "../../../domain/interfaces/metric.interface";

export function parseMetricType(value: unknown): MetricType | undefined {
  if (value == null) return undefined;
  if (typeof value !== "string") {
    throw CustomError.badRequest("type debe ser BUSSINESS, BRANCH o EMPLOYEE");
  }
  const normalized = value.trim().toUpperCase();
  if (normalized === "") return undefined;
  if (normalized !== "BUSSINESS" && normalized !== "BRANCH" && normalized !== "EMPLOYEE") {
    throw CustomError.badRequest("type debe ser BUSSINESS, BRANCH o EMPLOYEE");
  }
  return normalized as MetricType;
}

export function parseDateFilter(value: unknown): string | undefined {
  if (value == null) return undefined;
  if (typeof value !== "string") {
    throw CustomError.badRequest("date debe tener formato YYYY-MM-DD");
  }
  const normalized = value.trim();
  if (normalized === "") return undefined;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    throw CustomError.badRequest("date debe tener formato YYYY-MM-DD");
  }
  return normalized;
}

export function parseMonthFilter(value: unknown): string | undefined {
  if (value == null) return undefined;
  if (typeof value !== "string") {
    throw CustomError.badRequest("month debe tener formato YYYY-MM");
  }
  const normalized = value.trim();
  if (normalized === "") return undefined;
  if (!/^\d{4}-\d{2}$/.test(normalized)) {
    throw CustomError.badRequest("month debe tener formato YYYY-MM");
  }
  return normalized;
}
