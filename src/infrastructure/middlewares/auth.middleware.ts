import type { NextFunction, Request, Response } from "express";
import { FirestoreDataBase } from "../../data/firestore/firestore.database";
import { CustomError } from "../../domain/errors/custom-error";
import {
  PUBLIC_ROUTE_METHOD_PATHS,
  PUBLIC_ROUTE_PREFIXES,
} from "../../config/public-routes.config";
import { logger } from "../logger/logger";

const BEARER_PREFIX = "Bearer ";

function isPublicPath(path: string): boolean {
  const normalized = path.split("?")[0] ?? path;
  return PUBLIC_ROUTE_PREFIXES.some((prefix) => normalized.startsWith(prefix));
}

function isPublicMethodPath(method: string, path: string): boolean {
  const normalizedPathRaw = path.split("?")[0] ?? path;
  const normalizedPath =
    normalizedPathRaw.length > 1 && normalizedPathRaw.endsWith("/")
      ? normalizedPathRaw.slice(0, -1)
      : normalizedPathRaw;
  const normalizedMethod = method.toUpperCase();

  return PUBLIC_ROUTE_METHOD_PATHS.some((rule) => {
    if (rule.method !== normalizedMethod) return false;
    if (rule.match === "prefix") {
      return (
        normalizedPath === rule.path ||
        normalizedPath.startsWith(`${rule.path}/`)
      );
    }
    return rule.path === normalizedPath;
  });
}

function getFirebaseAuthErrorCode(error: unknown): string {
  return typeof error === "object" &&
    error != null &&
    "code" in error &&
    typeof (error as { code?: unknown }).code === "string"
    ? (error as { code: string }).code
    : "";
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const path = req.originalUrl ?? req.path ?? "";

  if (isPublicPath(path) || isPublicMethodPath(req.method, path)) {
    next();
    return;
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith(BEARER_PREFIX)) {
    logger.warn(
      `[authMiddleware] Token de sesión ausente o mal formado. path=${path}, method=${req.method}`
    );
    next(
      CustomError.unauthorized(
        "Token de sesión requerido. Envía Authorization: Bearer <idToken>.",
        "SESSION_TOKEN_REQUIRED"
      )
    );
    return;
  }

  const idToken = authHeader.slice(BEARER_PREFIX.length).trim();
  if (!idToken) {
    logger.warn(
      `[authMiddleware] Token de sesión vacío después de Bearer. path=${path}, method=${req.method}`
    );
    next(CustomError.unauthorized("Token de sesión inválido.", "INVALID_SESSION_TOKEN"));
    return;
  }

  logger.info(
    `[authMiddleware] Token de sesión recibido para validar. path=${path}, method=${req.method}`
  );

  FirestoreDataBase.getAdmin()
    .auth()
    .verifyIdToken(idToken, true)
    .then((decodedToken) => {
      logger.info(
        `[authMiddleware] Token de sesión verificado. uid=${decodedToken.uid}, email=${decodedToken.email ?? "no-email"}, path=${path}, method=${req.method}`
      );
      req.uid = decodedToken.uid;
      req.decodedIdToken = decodedToken;
      next();
    })
    .catch((error: unknown) => {
      const code = getFirebaseAuthErrorCode(error);
      if (code === "auth/user-not-found") {
        logger.warn(
          `[authMiddleware] Usuario inexistente en Firebase Auth para el token enviado. path=${path}, method=${req.method}`
        );
        next(CustomError.unauthorized("Tu usuario fue eliminado.", "ACCOUNT_DELETED"));
        return;
      }
      if (code === "auth/id-token-revoked") {
        logger.warn(
          `[authMiddleware] Token revocado detectado. path=${path}, method=${req.method}`
        );
        next(
          CustomError.unauthorized(
            "Tu sesión fue revocada. Inicia sesión nuevamente.",
            "SESSION_REVOKED"
          )
        );
        return;
      }

      logger.warn(
        `[authMiddleware] Falló la verificación del token de sesión. code=${code || "unknown"}, path=${path}, method=${req.method}`
      );
      next(
        CustomError.unauthorized("Token de sesión inválido o expirado.", "INVALID_OR_EXPIRED_TOKEN")
      );
    });
}
