import type { NextFunction, Request, Response } from "express";
import {
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
} from "../../domain/interfaces/pagination.interface";
import { parseDateFilter, parseMetricType, parseMonthFilter } from "./dtos/get-all-metrics.dto";
import type { MetricService } from "../services/metric.service";

export class MetricsController {
  constructor(private readonly metricService: MetricService) {}

  public getAll = (req: Request, res: Response, next: NextFunction) => {
    try {
      const pageRaw = req.query.page != null ? Number(req.query.page) : DEFAULT_PAGE;
      const pageSizeRaw =
        req.query.pageSize != null ? Number(req.query.pageSize) : DEFAULT_PAGE_SIZE;

      if (Number.isNaN(pageRaw) || pageRaw < 1) {
        res.status(400).json({ message: "page debe ser un entero positivo" });
        return;
      }
      if (Number.isNaN(pageSizeRaw) || pageSizeRaw < 1) {
        res.status(400).json({ message: "pageSize debe ser un entero positivo" });
        return;
      }

      const pageSize = Math.min(MAX_PAGE_SIZE, pageSizeRaw);
      const id =
        typeof req.query.id === "string" && req.query.id.trim() !== ""
          ? req.query.id.trim()
          : undefined;
      const type = parseMetricType(req.query.type);
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
      const date = parseDateFilter(req.query.date);
      const month = parseMonthFilter(req.query.month);

      if (date != null && month != null) {
        res.status(400).json({ message: "No puedes enviar date y month al mismo tiempo" });
        return;
      }

      this.metricService
        .getAllMetrics({
          page: pageRaw,
          pageSize,
          ...(id != null && { id }),
          ...(type != null && { type }),
          ...(businessId != null && { businessId }),
          ...(branchId != null && { branchId }),
          ...(employeeId != null && { employeeId }),
          ...(date != null && { date }),
          ...(month != null && { month }),
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
