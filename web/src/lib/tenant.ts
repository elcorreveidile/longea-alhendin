import "server-only";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { tenants } from "@/db/schema";
import { getSession } from "./session";

// Tenant por defecto cuando no hay subdominio (dominio raíz, vercel.app, local).
const DEFAULT_SLUG = process.env.DEFAULT_TENANT ?? "alhendin";

/** Extrae el slug del subdominio: alhendin.planturnos.com -> "alhendin". */
export function slugFromHost(host: string | null): string | null {
  if (!host) return null;
  const h = host.split(":")[0].toLowerCase();
  if (h === "localhost" || h.endsWith(".vercel.app") || /^\d+\./.test(h)) return null;
  const parts = h.split(".");
  if (parts.length >= 3 && parts[0] !== "www") return parts[0];
  return null;
}

/**
 * Empresa (tenant) actual.
 *
 * 1. Si hay una sesión de admin o trabajadora con empresa propia, esa manda:
 *    así el acceso por correo lleva a cada persona a SU empresa desde cualquier
 *    dominio, sin depender del subdominio.
 * 2. Si no (público, trabajadora antes de entrar, o superadmin que no tiene
 *    empresa propia), se resuelve por el subdominio; y si no, la por defecto.
 */
export async function getCurrentTenant() {
  const session = await getSession();
  // El superadmin NO pertenece a ninguna empresa: siempre se resuelve por el
  // subdominio (así puede abrir el panel de cualquier empresa). Solo las admins
  // y trabajadoras quedan fijadas a su empresa.
  if (session && session.role !== "superadmin" && session.tenantId) {
    const own = (
      await db.select().from(tenants).where(eq(tenants.id, session.tenantId)).limit(1)
    )[0];
    if (own) return own;
  }

  const host = (await headers()).get("host");
  const slug = slugFromHost(host) ?? DEFAULT_SLUG;
  let t = (await db.select().from(tenants).where(eq(tenants.slug, slug)).limit(1))[0];
  if (!t) t = (await db.select().from(tenants).limit(1))[0];
  return t ?? null;
}
