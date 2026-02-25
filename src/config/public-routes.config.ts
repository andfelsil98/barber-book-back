/**
 * Prefijos de rutas que NO requieren token de sesión (rutas públicas).
 * Cualquier ruta cuyo path comience con alguno de estos prefijos se considera pública
 * y no se valida el header Authorization.
 * El resto de rutas exigen: Authorization: Bearer <idToken> (token de sesión Firebase).
 *
 * Ejemplo: si agregas "/api/health", entonces GET /api/health y GET /api/health/ready son públicas.
 */
export const PUBLIC_ROUTE_PREFIXES: string[] = [
  "/api/auth",
  "/api/branches",
  "/api/services",
  "/api/modules",
  "/api/permissions",
  "/api/roles"
];
