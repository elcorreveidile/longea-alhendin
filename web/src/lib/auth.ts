import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { isAdminEmail } from "./env";
import { createMagicToken } from "./magic";
import { sendMagicLink } from "./email";
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

  await createSession({
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    workerId: user.workerId,
  });
}
