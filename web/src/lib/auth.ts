import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { isAdminEmail, isAdminPhone } from "./env";
import { createMagicToken } from "./magic";
import { sendMagicLink } from "./email";
import { startSmsVerification, checkSmsVerification } from "./sms";
import { appUrl } from "./env";
import { createSession } from "./session";

/**
 * Solicita un magic link. Solo se envía si el correo está dado de alta como
 * usuario o figura en ADMIN_EMAILS. Por privacidad, la respuesta al usuario es
 * siempre la misma (no revelamos si el correo existe o no).
 */
export async function requestMagicLink(rawEmail: string): Promise<void> {
  const email = rawEmail.trim().toLowerCase();

  const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
  const allowed = existing.length > 0 || isAdminEmail(email);
  if (!allowed) return; // silenciosamente, sin enviar nada

  const token = await createMagicToken(email);
  const url = `${appUrl()}/api/auth/verify?token=${encodeURIComponent(token)}`;
  await sendMagicLink(email, url);
}

/**
 * Valida el email (ya verificado por el token) e inicia sesión.
 * Si el correo está en ADMIN_EMAILS y aún no existe, lo crea como admin.
 */
export async function loginByEmail(email: string): Promise<void> {
  const normalized = email.trim().toLowerCase();

  let user = (
    await db.select().from(users).where(eq(users.email, normalized)).limit(1)
  )[0];

  if (!user) {
    if (!isAdminEmail(normalized)) {
      // No debería ocurrir (no se envía link a desconocidos), pero por si acaso.
      throw new Error("Correo no autorizado.");
    }
    user = (
      await db
        .insert(users)
        .values({ email: normalized, role: "admin", name: "Administradora" })
        .returning()
    )[0];
  }

  await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id));

  await startSession(user);
}

async function startSession(user: typeof users.$inferSelect): Promise<void> {
  await createSession({
    userId: user.id,
    email: user.email ?? "",
    name: user.name,
    role: user.role,
    workerId: user.workerId,
  });
}

/**
 * Solicita un código por SMS. Solo se envía si el teléfono está dado de alta
 * o figura en ADMIN_PHONES. Respuesta siempre genérica (no revela si existe).
 * Devuelve true si se ha enviado (para mostrar el paso de código).
 */
export async function requestSmsCode(phoneE164: string): Promise<boolean> {
  const existing = await db.select().from(users).where(eq(users.phone, phoneE164)).limit(1);
  const allowed = existing.length > 0 || isAdminPhone(phoneE164);
  if (!allowed) return false;

  await startSmsVerification(phoneE164);
  return true;
}

/**
 * Comprueba el código SMS e inicia sesión. Si el teléfono está en ADMIN_PHONES
 * y aún no existe usuaria, la crea como admin.
 */
export async function loginByPhone(phoneE164: string, code: string): Promise<boolean> {
  const ok = await checkSmsVerification(phoneE164, code);
  if (!ok) return false;

  let user = (
    await db.select().from(users).where(eq(users.phone, phoneE164)).limit(1)
  )[0];

  if (!user) {
    if (!isAdminPhone(phoneE164)) return false;
    user = (
      await db
        .insert(users)
        .values({ phone: phoneE164, role: "admin", name: "Administradora" })
        .returning()
    )[0];
  }

  await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id));
  await startSession(user);
  return true;
}
