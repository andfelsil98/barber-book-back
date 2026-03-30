import { CustomError } from "../errors/custom-error";

export type CanonicalBillingInterval = "MONTHLY" | "QUARTERLY" | "YEARLY";
export type BillingIntervalInput =
  | CanonicalBillingInterval
  | "QUATERLY";

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function formatDate(year: number, month: number, day: number): string {
  return [
    String(year).padStart(4, "0"),
    String(month).padStart(2, "0"),
    String(day).padStart(2, "0"),
  ].join("-");
}

function parseIsoDate(date: string, field: string): {
  year: number;
  month: number;
  day: number;
} {
  const normalizedDate = date.trim();
  const match = normalizedDate.match(ISO_DATE_REGEX);
  if (!match) {
    throw CustomError.badRequest(`${field} debe tener formato YYYY-MM-DD`);
  }

  const year = Number(match[0].slice(0, 4));
  const month = Number(match[0].slice(5, 7));
  const day = Number(match[0].slice(8, 10));
  const parsed = new Date(Date.UTC(year, month - 1, day));

  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    throw CustomError.badRequest(`${field} debe ser una fecha válida`);
  }

  return { year, month, day };
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function validateIsoDateString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw CustomError.badRequest(`${field} es requerido y debe tener formato YYYY-MM-DD`);
  }

  const normalized = value.trim();
  parseIsoDate(normalized, field);
  return normalized;
}

export function getCurrentBogotaDate(): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  return formatter.format(new Date());
}

export function normalizeBillingInterval(
  billingInterval: BillingIntervalInput
): CanonicalBillingInterval {
  if (billingInterval === "QUATERLY") {
    return "QUARTERLY";
  }

  return billingInterval;
}

export function addDays(date: string, days: number): string {
  const { year, month, day } = parseIsoDate(date, "date");
  const parsed = new Date(Date.UTC(year, month - 1, day + days));
  return formatDate(
    parsed.getUTCFullYear(),
    parsed.getUTCMonth() + 1,
    parsed.getUTCDate()
  );
}

export function addBillingInterval(
  startPeriod: string,
  billingInterval: BillingIntervalInput
): string {
  const normalizedBillingInterval = normalizeBillingInterval(billingInterval);
  const { year, month, day } = parseIsoDate(startPeriod, "startPeriod");

  if (normalizedBillingInterval === "YEARLY") {
    const targetYear = year + 1;
    const targetDay = Math.min(day, daysInMonth(targetYear, month));
    return formatDate(targetYear, month, targetDay);
  }

  const monthsToAdd = normalizedBillingInterval === "MONTHLY" ? 1 : 3;
  const baseMonthIndex = month - 1 + monthsToAdd;
  const targetYear = year + Math.floor(baseMonthIndex / 12);
  const targetMonth = (baseMonthIndex % 12 + 12) % 12 + 1;
  const targetDay = Math.min(day, daysInMonth(targetYear, targetMonth));

  return formatDate(targetYear, targetMonth, targetDay);
}

export function computeEndPeriod(
  startPeriod: string,
  billingInterval: BillingIntervalInput
): string {
  return addDays(addBillingInterval(startPeriod, billingInterval), -1);
}

export function isDateWithinPeriod(
  date: string,
  startPeriod: string,
  endPeriod: string
): boolean {
  return date >= startPeriod && date <= endPeriod;
}

export function validateAndNormalizeStartPeriods(
  value: unknown,
  field: string
): string[] {
  if (!Array.isArray(value)) {
    throw CustomError.badRequest(`${field} debe ser un arreglo de fechas YYYY-MM-DD`);
  }

  if (value.length === 0) {
    throw CustomError.badRequest(`${field} debe contener al menos una fecha`);
  }

  const startPeriods = value.map((item, index) =>
    validateIsoDateString(item, `${field}[${index}]`)
  );

  const uniqueStartPeriods = new Set(startPeriods);
  if (uniqueStartPeriods.size !== startPeriods.length) {
    throw CustomError.badRequest(`${field} no puede contener fechas repetidas`);
  }

  return [...startPeriods].sort((a, b) => a.localeCompare(b));
}

export function buildUsagePeriods(
  startPeriods: string[],
  billingInterval: BillingIntervalInput
): Array<{ startPeriod: string; endPeriod: string }> {
  const sortedStartPeriods = [...startPeriods].sort((a, b) => a.localeCompare(b));

  return sortedStartPeriods.map((startPeriod, index) => {
    const endPeriod = computeEndPeriod(startPeriod, billingInterval);

    if (index > 0) {
      const previous = sortedStartPeriods[index - 1]!;
      const previousEndPeriod = computeEndPeriod(previous, billingInterval);
      if (startPeriod <= previousEndPeriod) {
        throw CustomError.badRequest(
          "Los startPeriods no pueden solaparse entre sí"
        );
      }
    }

    return { startPeriod, endPeriod };
  });
}
