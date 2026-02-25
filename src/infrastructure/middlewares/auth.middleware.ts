import type { NextFunction, Request, Response } from "express";
import { FirestoreDataBase } from "../../data/firestore/firestore.database";
import { CustomError } from "../../domain/errors/custom-error";
import { PUBLIC_ROUTE_PREFIXES } from "../../config/public-routes.config";
import { logger } from "../logger/logger";

const BEARER_PREFIX = "Bearer ";

function isPublicPath(path: string): boolean {
  const normalized = path.split("?")[0] ?? path;
  return PUBLIC_ROUTE_PREFIXES.some((prefix) => normalized.startsWith(prefix));
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const path = req.originalUrl ?? req.path ?? "";

  if (isPublicPath(path)) {
    next();
    return;
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith(BEARER_PREFIX)) {
    logger.warn(
      `[authMiddleware] Token de sesión ausente o mal formado. path=${path}, method=${req.method}`
    );
    next(CustomError.unauthorized("Token de sesión requerido. Envía Authorization: Bearer <idToken>."));
    return;
  }

  const idToken = authHeader.slice(BEARER_PREFIX.length).trim();
  if (!idToken) {
    logger.warn(
      `[authMiddleware] Token de sesión vacío después de Bearer. path=${path}, method=${req.method}`
    );
    next(CustomError.unauthorized("Token de sesión inválido."));
    return;
  }

  logger.info(
    `[authMiddleware] Token de sesión recibido para validar. path=${path}, method=${req.method}`
  );

  FirestoreDataBase.getAdmin()
    .auth()
    .verifyIdToken(idToken)
    .then((decodedToken) => {
      logger.info(
        `[authMiddleware] Token de sesión verificado. uid=${decodedToken.uid}, email=${decodedToken.email ?? "no-email"}, path=${path}, method=${req.method}`
      );
      req.uid = decodedToken.uid;
      req.decodedIdToken = decodedToken;
      next();
    })
    .catch(() => {
      logger.warn(
        `[authMiddleware] Falló la verificación del token de sesión. path=${path}, method=${req.method}`
      );
      next(CustomError.unauthorized("Token de sesión inválido o expirado."));
    });
}
