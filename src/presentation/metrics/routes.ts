import { Router } from "express";
import { MetricsController } from "./metrics.controller";
import { MetricService } from "../services/metric.service";

export class MetricsRoutes {
  static get routes(): Router {
    const router = Router();
    const metricService = new MetricService();
    const metricsController = new MetricsController(metricService);

    router.get("/", metricsController.getAll);

    return router;
  }
}
