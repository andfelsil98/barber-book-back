/**
 * Quita espacios al inicio, al final y deja solo un espacio entre palabras.
 * Para usar en body de POST y PUT.
 */
export function normalizeSpaces(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

/**
 * Quita tildes/diacríticos (á→a, é→e, ñ→n, etc.).
 */
export function removeAccents(value: string): string {
  return value.normalize("NFD").replace(/\p{Diacritic}/gu, "");
}

/** Solo letras, números y espacios. Sin tildes ni caracteres especiales. */
const ONLY_LETTERS_NUMBERS_SPACES = /^[a-zA-Z0-9\s]+$/;

export function isOnlyLettersNumbersAndSpaces(value: string): boolean {
  const withoutAccents = removeAccents(value);
  return ONLY_LETTERS_NUMBERS_SPACES.test(withoutAccents);
}

/**
 * Devuelve el string con tildes removidas y solo letras, números y espacios.
 * Lanza si después de quitar tildes hay caracteres no permitidos (opcional: podríamos filtrar en vez de validar).
 */
export function toLettersNumbersAndSpaces(value: string): string {
  return removeAccents(value).replace(/[^a-zA-Z0-9\s]/g, "");
}

/**
 * Primera letra de la primera palabra en mayúscula, resto en minúscula.
 * Ej: "MI BARBERIA" → "Mi barberia"
 */
export function formatName(value: string): string {
  const normalized = normalizeSpaces(value);
  if (!normalized) return "";
  const words = normalized.split(/\s+/).filter(Boolean);
  return words
    .map((word, i) =>
      i === 0
        ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        : word.toLowerCase()
    )
    .join(" ");
}

/**
 * Slug a partir del nombre: minúsculas, palabras separadas por guiones, sin tildes.
 * Ej: "Mi Barbería" → "mi-barberia"
 */
export function slugFromName(name: string): string {
  const noAccents = removeAccents(name);
  const singleSpaces = normalizeSpaces(noAccents);
  return singleSpaces
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

/**
 * Normaliza teléfono a dígitos y garantiza prefijo país 57 (Colombia).
 * Si ya inicia en 57, lo mantiene.
 */
export function ensureColombiaCountryCode(phone: string): string {
  const digitsOnly = phone.replace(/\D+/g, "");
  if (digitsOnly === "") return "";
  return digitsOnly.startsWith("57") ? digitsOnly : `57${digitsOnly}`;
}
