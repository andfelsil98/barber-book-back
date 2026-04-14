import type { NextFunction, Request, Response } from "express";
import { FirestoreDataBase } from "../../data/firestore/firestore.database";
import { CustomError } from "../../domain/errors/custom-error";
import type { Business } from "../../domain/interfaces/business.interface";
import type { Plan } from "../../domain/interfaces/plan.interface";
import { logger } from "../logger/logger";
import {
  isBusinessIdHeaderExemptRequest,
  isPublicRequest,
} from "./route-access.utils";

const BUSINESS_COLLECTION = "Businesses";
const PLAN_COLLECTION = "Plans";

export async function businessIdHeaderMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const path = req.originalUrl ?? req.path ?? "";
  const requiresBusinessId =
    !isPublicRequest(req.method, path) &&
    !isBusinessIdHeaderExemptRequest(req.method, path);
  const businessIdHeader = req.header("businessId");
  const hasBusinessIdHeader = businessIdHeader != null;

  if (!hasBusinessIdHeader) {
    if (!requiresBusinessId) {
      next();
      return;
    }

    logger.warn(
      `[businessIdHeaderMiddleware] Header businessId ausente o vacío. path=${path}, method=${req.method}`
    );
    next(
      CustomError.badRequest(
        "El header businessId es requerido y debe ser un texto no vacío",
        "BUSINESS_ID_HEADER_REQUIRED"
      )
    );
    return;
  }

  if (typeof businessIdHeader !== "string" || businessIdHeader.trim() === "") {
    logger.warn(
      `[businessIdHeaderMiddleware] Header businessId presente pero vacío. path=${path}, method=${req.method}`
    );
    next(
      CustomError.badRequest(
        "El header businessId es requerido y debe ser un texto no vacío",
        "BUSINESS_ID_HEADER_REQUIRED"
      )
    );
    return;
  }

  const normalizedBusinessId = businessIdHeader.trim();
  req.businessId = normalizedBusinessId;

  try {
    const db = FirestoreDataBase.getDB();
    const businessSnapshot = await db
      .collection(BUSINESS_COLLECTION)
      .doc(normalizedBusinessId)
      .get();

    if (!businessSnapshot.exists) {
      logger.warn(
        `[businessIdHeaderMiddleware] No existe negocio para businessId=${normalizedBusinessId}. path=${path}, method=${req.method}`
      );
      next(
        CustomError.notFound(
          "No existe un negocio para el businessId enviado",
          "BUSINESS_ID_NOT_FOUND"
        )
      );
      return;
    }

    const business = businessSnapshot.data() as Business;
    const planId = typeof business.planId === "string" ? business.planId.trim() : "";

    if (planId === "") {
      logger.warn(
        `[businessIdHeaderMiddleware] El negocio ${normalizedBusinessId} no tiene plan asignado. path=${path}, method=${req.method}`
      );
      next(
        CustomError.forbidden(
          "El negocio no tiene un plan asignado. Configura un plan para continuar",
          "BUSINESS_PLAN_REQUIRED"
        )
      );
      return;
    }

    const subscriptionStatus = business.subscriptionStatus ?? "ACTIVE";
    if (subscriptionStatus !== "ACTIVE") {
      logger.warn(
        `[businessIdHeaderMiddleware] El negocio ${normalizedBusinessId} no tiene una suscripción activa. path=${path}, method=${req.method}`
      );
      next(
        CustomError.forbidden(
          "El plan del negocio está vencido o inactivo. Renueva o reactiva el plan para continuar",
          "BUSINESS_SUBSCRIPTION_INACTIVE"
        )
      );
      return;
    }

    const planSnapshot = await db.collection(PLAN_COLLECTION).doc(planId).get();
    if (!planSnapshot.exists) {
      logger.warn(
        `[businessIdHeaderMiddleware] No existe plan ${planId} para negocio ${normalizedBusinessId}. path=${path}, method=${req.method}`
      );
      next(
        CustomError.forbidden(
          "El negocio tiene un plan inválido o inexistente",
          "BUSINESS_PLAN_NOT_FOUND"
        )
      );
      return;
    }

    const plan = planSnapshot.data() as Plan;
    if (plan.status !== "ACTIVE") {
      logger.warn(
        `[businessIdHeaderMiddleware] El plan ${planId} del negocio ${normalizedBusinessId} está inactivo. path=${path}, method=${req.method}`
      );
      next(
        CustomError.forbidden(
          "El plan asignado al negocio está inactivo. Activa un plan vigente para continuar",
          "BUSINESS_PLAN_INACTIVE"
        )
      );
      return;
    }

    next();
  } catch (error) {
    const detail = error instanceof Error ? error.stack ?? error.message : String(error);
    logger.error(
      `[businessIdHeaderMiddleware] No se pudo validar el plan del negocio ${normalizedBusinessId}. detalle=${detail}`
    );
    next(CustomError.internalServerError("Error interno del servidor"));
  }
}
