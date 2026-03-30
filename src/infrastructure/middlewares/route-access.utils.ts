import {
  BUSINESS_ID_HEADER_EXEMPT_METHOD_PATHS,
  PUBLIC_ROUTE_METHOD_PATHS,
  PUBLIC_ROUTE_PREFIXES,
} from "../../config/public-routes.config";

export function isPublicPath(path: string): boolean {
  const normalized = path.split("?")[0] ?? path;
  return PUBLIC_ROUTE_PREFIXES.some((prefix) => normalized.startsWith(prefix));
}

export function isPublicMethodPath(method: string, path: string): boolean {
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

export function isPublicRequest(method: string, path: string): boolean {
  return isPublicPath(path) || isPublicMethodPath(method, path);
}

export function isBusinessIdHeaderExemptRequest(
  method: string,
  path: string
): boolean {
  const normalizedPathRaw = path.split("?")[0] ?? path;
  const normalizedPath =
    normalizedPathRaw.length > 1 && normalizedPathRaw.endsWith("/")
      ? normalizedPathRaw.slice(0, -1)
      : normalizedPathRaw;
  const normalizedMethod = method.toUpperCase();

  return BUSINESS_ID_HEADER_EXEMPT_METHOD_PATHS.some((rule) => {
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
