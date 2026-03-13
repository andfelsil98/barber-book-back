import type { NextFunction, Request, Response } from "express";
import { parseDateFilter, parseEntityType, parseMetricTimeFrame, parseMetricTypes, parseSameDate } from "./dtos/get-all-metrics.dto";
import type { MetricService } from "../services/metric.service";

export class MetricsController {
  constructor(private readonly metricService: MetricService) {}

  public getInsights = (req: Request, res: Response, next: NextFunction) => {
    try {
      const metricTypes = parseMetricTypes(req.query.metricTypes);
      const entityType = parseEntityType(req.query.entityType);
      const timeframe = parseMetricTimeFrame(req.query.timeframe);
      const startDate = parseDateFilter(req.query.startDate, "startDate");
      const endDate = parseDateFilter(req.query.endDate, "endDate");
      const sameDate = parseSameDate(req.query.sameDate);

      const businessId =
        typeof req.query.businessId === "string" && req.query.businessId.trim() !== ""
          ? req.query.businessId.trim()
          : undefined;
      const branchId =
        typeof req.query.branchId === "string" && req.query.branchId.trim() !== ""
          ? req.query.branchId.trim()
          : undefined;
      const employeeId =
        typeof req.query.employeeId === "string" && req.query.employeeId.trim() !== ""
          ? req.query.employeeId.trim()
          : undefined;

      this.metricService
        .getMetricInsights({
          metricTypes,
          entityType,
          ...(businessId != null && { businessId }),
          ...(branchId != null && { branchId }),
          ...(employeeId != null && { employeeId }),
          ...(timeframe != null && { timeframe }),
          ...(startDate != null && { startDate }),
          ...(endDate != null && { endDate }),
          sameDate,
        })
        .then((result) => {
          res.status(200).json(result);
        })
        .catch(next);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Parámetros inválidos";
      res.status(400).json({ message });
    }
  };
}
