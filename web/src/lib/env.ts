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

export function adminPhones(): string[] {
  return (process.env.ADMIN_PHONES ?? "")
    .split(",")
    .map((p) => p.replace(/[\s\-().]/g, ""))
    .filter(Boolean);
}

export function isAdminPhone(phoneE164: string): boolean {
  return adminPhones().includes(phoneE164);
}

// --- Twilio Verify (SMS) ---
export const twilioAccountSid = () => process.env.TWILIO_ACCOUNT_SID ?? "";
export const twilioAuthToken = () => process.env.TWILIO_AUTH_TOKEN ?? "";
export const twilioVerifyServiceSid = () => process.env.TWILIO_VERIFY_SERVICE_SID ?? "";
export const twilioConfigured = () =>
  !!(twilioAccountSid() && twilioAuthToken() && twilioVerifyServiceSid());

export function authSecret(): string {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 16) {
    throw new Error("AUTH_SECRET no definida o demasiado corta (mín. 16 caracteres).");
  }
  return s;
}

export const emailFrom = () => process.env.EMAIL_FROM ?? "Cuadrantes <onboarding@resend.dev>";
export const resendApiKey = () => process.env.RESEND_API_KEY ?? "";
