import type { DecodedIdToken } from "firebase-admin/auth";

declare global {
  namespace Express {
    interface Request {
      /** UID del usuario de Firebase Auth (solo en rutas protegidas). */
      uid?: string;
      /** Token decodificado de la sesión (solo en rutas protegidas). */
      decodedIdToken?: DecodedIdToken;
      /** businessId resuelto desde el header en rutas privadas. */
      businessId?: string;
    }
  }
}
