import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { settings } from "@/db/schema";

/**
 * Tipo de empresa (sector). Determina qué panel se muestra:
 *  - "residencia": cuadrantes por turnos (comportamiento original, Alhendín).
 *  - "academia": profesorado y control de horas.
 * Se guarda en `settings` (clave tenant_kind) para no requerir migración.
 */
export type TenantKind = "residencia" | "academia";

const KEY = "tenant_kind";

export async function getTenantKind(tenantId: string): Promise<TenantKind> {
  const r = (
    await db.select().from(settings).where(and(eq(settings.tenantId, tenantId), eq(settings.key, KEY))).limit(1)
  )[0];
  return r?.value === "academia" ? "academia" : "residencia";
}

export async function setTenantKind(tenantId: string, kind: TenantKind): Promise<void> {
  await db
    .insert(settings)
    .values({ tenantId, key: KEY, value: kind })
    .onConflictDoUpdate({ target: [settings.tenantId, settings.key], set: { value: kind, updatedAt: new Date() } });
}
