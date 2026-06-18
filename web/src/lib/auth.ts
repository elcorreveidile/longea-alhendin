import "server-only";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { isAdminEmail, isAdminPhone, isSuperAdminEmail } from "./env";
import { createMagicToken } from "./magic";
import { sendMagicLink } from "./email";
import { sendSms } from "./sms";
import { createOtp, verifyOtp } from "./otp";
import { appUrl } from "./env";
import { createSession } from "./session";
import { getCurrentTenant } from "./tenant";

/** Base del enlace según el dominio desde el que se pide (subdominio incluido). */
async function requestBaseUrl(): Promise<string> {
  try {
    const h = await headers();
    const host = h.get("host");
    if (host) {
      const proto = h.get("x-forwarded-proto") ?? "https";
      return `${proto}://${host}`;
    }
  } catch {
    // fuera de contexto de petición
  }
  return appUrl();
}

/**
 * Solicita un magic link. Solo se envía si el correo está dado de alta como
 * usuario o figura en ADMIN_EMAILS. Por privacidad, la respuesta al usuario es
 * siempre la misma (no revelamos si el correo existe o no).
 */
export async function requestMagicLink(rawEmail: string): Promise<void> {
  const email = rawEmail.trim().toLowerCase();

  const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
  const allowed = existing.length > 0 || isAdminEmail(email) || isSuperAdminEmail(email);
  if (!allowed) return; // silenciosamente, sin enviar nada

  const token = await createMagicToken(email);
  const base = await requestBaseUrl();
  const url = `${base}/api/auth/verify?token=${encodeURIComponent(token)}`;
  await sendMagicLink(email, url);
}

/**
 * Valida el email (ya verificado por el token) e inicia sesión.
 * Si el correo está en ADMIN_EMAILS y aún no existe, lo crea como admin.
 */
export async function loginByEmail(email: string): Promise<void> {
  const normalized = email.trim().toLowerCase();

  // Rol que corresponde según las listas de entorno (superadmin manda sobre admin).
  const envRole: "superadmin" | "admin" | null = isSuperAdminEmail(normalized)
    ? "superadmin"
    : isAdminEmail(normalized)
      ? "admin"
      : null;

  // Empresa del subdominio desde el que se accede (para atar a las admins).
  const tenant = envRole === "superadmin" ? null : await getCurrentTenant();

  let user = (
    await db.select().from(users).where(eq(users.email, normalized)).limit(1)
  )[0];

  if (!user) {
    if (!envRole) {
      // No debería ocurrir (no se envía link a desconocidos), pero por si acaso.
      throw new Error("Correo no autorizado.");
    }
    user = (
      await db
        .insert(users)
        .values({
          email: normalized,
          role: envRole,
          name: envRole === "superadmin" ? "Súper administrador" : "Administradora",
          // El superadmin es global (sin empresa); la admin queda atada a la suya.
          tenantId: envRole === "superadmin" ? null : tenant?.id ?? null,
        })
        .returning()
    )[0];
  } else if (envRole && user.role !== envRole && rank(envRole) > rank(user.role)) {
    // Eleva el rol si la lista de entorno le da más permisos de los que tenía.
    user = (
      await db.update(users).set({ role: envRole }).where(eq(users.id, user.id)).returning()
    )[0];
  }

  // Un superadmin no pertenece a ninguna empresa: limpiamos cualquier empresa
  // heredada (p. ej. si antes fue administradora y luego se le elevó). Sin esto,
  // el superadmin se quedaría "atrapado" viendo siempre esa empresa.
  if (user.role === "superadmin" && user.tenantId) {
    user = (
      await db.update(users).set({ tenantId: null }).where(eq(users.id, user.id)).returning()
    )[0];
  }

  // Red de seguridad: una admin sin empresa asignada se ata a la del subdominio
  // desde el que entra (resuelve a las admins antiguas creadas como globales).
  if (user.role === "admin" && !user.tenantId && tenant) {
    user = (
      await db.update(users).set({ tenantId: tenant.id }).where(eq(users.id, user.id)).returning()
    )[0];
  }

  await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id));

  await startSession(user);
}

function rank(role: string): number {
  return role === "superadmin" ? 3 : role === "admin" ? 2 : 1;
}

async function startSession(user: typeof users.$inferSelect): Promise<void> {
  await createSession({
    userId: user.id,
    email: user.email ?? "",
    name: user.name,
    role: user.role,
    workerId: user.workerId,
    tenantId: user.tenantId,
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

  const code = await createOtp(phoneE164); // null si se pidió hace muy poco (antiflood)
  if (code) {
    await sendSms(phoneE164, `Tu código de acceso a Cuadrantes (Residencia Alhendín) es: ${code}`);
  }
  return true;
}

/**
 * Comprueba el código SMS e inicia sesión. Si el teléfono está en ADMIN_PHONES
 * y aún no existe usuaria, la crea como admin.
 */
export async function loginByPhone(phoneE164: string, code: string): Promise<boolean> {
  const ok = await verifyOtp(phoneE164, code);
  if (!ok) return false;

  let user = (
    await db.select().from(users).where(eq(users.phone, phoneE164)).limit(1)
  )[0];

  if (!user) {
    if (!isAdminPhone(phoneE164)) return false;
    const tenant = await getCurrentTenant();
    user = (
      await db
        .insert(users)
        .values({ phone: phoneE164, role: "admin", name: "Administradora", tenantId: tenant?.id ?? null })
        .returning()
    )[0];
  }

  // Ata a su empresa a una admin que aún no la tuviera (subdominio de acceso).
  if (user.role === "admin" && !user.tenantId) {
    const tenant = await getCurrentTenant();
    if (tenant) {
      user = (
        await db.update(users).set({ tenantId: tenant.id }).where(eq(users.id, user.id)).returning()
      )[0];
    }
  }

  await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id));
  await startSession(user);
  return true;
}
