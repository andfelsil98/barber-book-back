export const ROOT_USER_EMAILS = ["felipe@hotmail.com"] as const;

export function isRootUserEmail(email: string): boolean {
  const normalizedEmail = email.trim().toLowerCase();
  return ROOT_USER_EMAILS.some(
    (rootUserEmail) => rootUserEmail.trim().toLowerCase() === normalizedEmail
  );
}