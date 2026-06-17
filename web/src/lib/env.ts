/** Acceso centralizado a variables de entorno (con valores por defecto seguros). */

export function appUrl(): string {
  return (
    process.env.APP_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "http://localhost:3000")
  );
}

export function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string): boolean {
  return adminEmails().includes(email.trim().toLowerCase());
}

export function authSecret(): string {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 16) {
    throw new Error("AUTH_SECRET no definida o demasiado corta (mín. 16 caracteres).");
  }
  return s;
}

export const emailFrom = () => process.env.EMAIL_FROM ?? "Cuadrantes <onboarding@resend.dev>";
export const resendApiKey = () => process.env.RESEND_API_KEY ?? "";
