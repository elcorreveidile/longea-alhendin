import "server-only";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { tenants } from "@/db/schema";

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

/** Tenant (residencia) actual según el subdominio; si no, el por defecto / el primero. */
export async function getCurrentTenant() {
  const host = (await headers()).get("host");
  const slug = slugFromHost(host) ?? DEFAULT_SLUG;
  let t = (await db.select().from(tenants).where(eq(tenants.slug, slug)).limit(1))[0];
  if (!t) t = (await db.select().from(tenants).limit(1))[0];
  return t ?? null;
}
