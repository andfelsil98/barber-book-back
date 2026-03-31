/**
 * Prefijos de rutas que NO requieren token de sesión (rutas públicas).
 * Cualquier ruta cuyo path comience con alguno de estos prefijos se considera pública
 * y no se valida el header Authorization.
 * El resto de rutas exigen: Authorization: Bearer <idToken> (token de sesión Firebase).
 *
 * Ejemplo: si agregas "/health", entonces GET /health y GET /health/ready son públicas.
 */
export const PUBLIC_ROUTE_PREFIXES: string[] = [
  "/auth",
  "/branches",
  "/services",
  "/appointments",
  "/modules",
  "/permissions",
  "/roles"
];

/**
 * Rutas públicas exactas por método.
 * Útil cuando solo una operación puntual debe ser pública sin exponer todo el prefijo.
 */
export const PUBLIC_ROUTE_METHOD_PATHS: Array<{
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  match?: "exact" | "prefix";
}> = [
  { method: "GET", path: "/business" },
  { method: "GET", path: "/business-memberships" },
  { method: "GET", path: "/users" },
  { method: "GET", path: "/reviews" },
  { method: "GET", path: "/bookings", match: "prefix" },
  { method: "POST", path: "/reviews" },
  { method: "POST", path: "/bookings" },
  { method: "PUT", path: "/bookings", match: "prefix" },
  { method: "POST", path: "/whatsapp/send-message", match: "prefix" },
  { method: "POST", path: "/business/usage/reconcile-today" },
  { method: "GET", path: "/plans" },
];

/**
 * Rutas privadas que siguen requiriendo autenticación,
 * pero NO deben exigir el header businessId.
 */
export const BUSINESS_ID_HEADER_EXEMPT_METHOD_PATHS: Array<{
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  match?: "exact" | "prefix";
}> = [
  { method: "POST", path: "/business" },
  { method: "POST", path: "/business-memberships/create-by-document" },
  { method: "PUT", path: "/business", match: "prefix" },
  { method: "PATCH", path: "/business", match: "prefix" },
  { method: "DELETE", path: "/business", match: "prefix" },
  { method: "POST", path: "/plans" },
  { method: "PUT", path: "/plans", match: "prefix" },
  { method: "DELETE", path: "/plans", match: "prefix" },
  { method: "POST", path: "/push-notifications", match: "prefix" },
  { method: "DELETE", path: "/push-notifications", match: "prefix" },
];
