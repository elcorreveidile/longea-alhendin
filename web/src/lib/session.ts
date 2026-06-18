import "server-only";
import { cookies, headers } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { authSecret } from "./env";

const COOKIE = "session";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 días

/**
 * Dominio de la cookie. En *.planturnos.com la fijamos a ".planturnos.com" para
 * que la sesión se comparta entre el dominio raíz y todos los subdominios de
 * empresa (si no, al saltar de planturnos.com a empresa.planturnos.com se
 * perdería la sesión). En local/vercel.app se deja a nivel de host.
 */
async function cookieDomain(): Promise<string | undefined> {
  try {
    const host = (await headers()).get("host")?.split(":")[0].toLowerCase();
    if (host && (host === "planturnos.com" || host.endsWith(".planturnos.com"))) {
      return ".planturnos.com";
    }
  } catch {
    // fuera de contexto de petición
  }
  return undefined;
}

export type AppRole = "superadmin" | "admin" | "worker";

export interface SessionData {
  userId: string;
  email: string;
  name: string | null;
  role: AppRole;
  workerId: string | null;
  // Empresa a la que pertenece el usuario. null para el superadmin (acceso global).
  tenantId: string | null;
}

/** ¿Tiene acceso al panel de administración? (admin o superadmin) */
export function isStaffAdmin(role: AppRole): boolean {
  return role === "admin" || role === "superadmin";
}

/** Página de inicio tras iniciar sesión según el rol. */
export function homeForRole(role: AppRole): string {
  return role === "superadmin" ? "/admin" : role === "admin" ? "/panel" : "/mi-turno";
}

/** ¿Puede este usuario gestionar el panel de la empresa indicada? */
export function canManageTenant(session: SessionData, tenantId: string): boolean {
  if (session.role === "superadmin") return true;
  return session.role === "admin" && session.tenantId === tenantId;
}

function key(): Uint8Array {
  return new TextEncoder().encode(authSecret());
}

export async function createSession(data: SessionData): Promise<void> {
  const token = await new SignJWT({ ...data })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(key());

  const store = await cookies();
  const domain = await cookieDomain();
  store.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
    ...(domain ? { domain } : {}),
  });
}

export async function getSession(): Promise<SessionData | null> {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key());
    return {
      userId: String(payload.userId),
      email: String(payload.email),
      name: (payload.name as string | null) ?? null,
      role:
        payload.role === "superadmin"
          ? "superadmin"
          : payload.role === "admin"
            ? "admin"
            : "worker",
      workerId: (payload.workerId as string | null) ?? null,
      tenantId: (payload.tenantId as string | null) ?? null,
    };
  } catch {
    return null;
  }
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  const domain = await cookieDomain();
  // Borramos tanto la cookie a nivel de host como la de dominio compartido.
  store.delete(COOKIE);
  store.set(COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
    ...(domain ? { domain } : {}),
  });
}
