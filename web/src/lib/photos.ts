import "server-only";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { settings } from "@/db/schema";

// La URL de la foto de cada trabajadora se guarda en `settings` con clave
// `photo:<workerId>` (sin migración). El archivo vive en Vercel Blob.

const PREFIX = "photo:";

export async function getPhotoUrl(tenantId: string, workerId: string): Promise<string | null> {
  const r = (
    await db
      .select()
      .from(settings)
      .where(and(eq(settings.tenantId, tenantId), eq(settings.key, PREFIX + workerId)))
      .limit(1)
  )[0];
  return r?.value ?? null;
}

export async function setPhotoUrl(tenantId: string, workerId: string, url: string): Promise<void> {
  await db
    .insert(settings)
    .values({ tenantId, key: PREFIX + workerId, value: url })
    .onConflictDoUpdate({ target: [settings.tenantId, settings.key], set: { value: url, updatedAt: new Date() } });
}

export async function clearPhotoUrl(tenantId: string, workerId: string): Promise<void> {
  await db.delete(settings).where(and(eq(settings.tenantId, tenantId), eq(settings.key, PREFIX + workerId)));
}

/** Mapa workerId -> url para varias trabajadoras (para listados). */
export async function getPhotoUrls(tenantId: string, workerIds: string[]): Promise<Record<string, string>> {
  if (workerIds.length === 0) return {};
  const keys = workerIds.map((id) => PREFIX + id);
  const rows = await db
    .select()
    .from(settings)
    .where(and(eq(settings.tenantId, tenantId), inArray(settings.key, keys)));
  const out: Record<string, string> = {};
  for (const r of rows) out[r.key.slice(PREFIX.length)] = r.value;
  return out;
}
