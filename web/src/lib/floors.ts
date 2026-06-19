import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { settings } from "@/db/schema";

/**
 * Planta fija por trabajadora (0, 1 o 2). Por defecto nadie tiene planta fija
 * y el motor reparte 4/4/1 con continuidad. Mar va siempre en planta 0 (baja
 * temporal): se modela poniéndole aquí la planta fija 0.
 *
 * Se guarda en `settings` (clave fixed_floors) como JSON {workerId: planta},
 * para no requerir migración. Las plantas:
 *   0 = baja (azul) · 1 = planta uno (verde) · 2 = planta dos (rosa)
 */
const KEY = "fixed_floors";

export type FixedFloors = Record<string, 0 | 1 | 2>;

export async function getFixedFloors(tenantId: string): Promise<FixedFloors> {
  const r = (
    await db.select().from(settings).where(and(eq(settings.tenantId, tenantId), eq(settings.key, KEY))).limit(1)
  )[0];
  if (!r?.value) return {};
  try {
    const obj = JSON.parse(r.value) as Record<string, number>;
    const out: FixedFloors = {};
    for (const [id, f] of Object.entries(obj)) {
      if (f === 0 || f === 1 || f === 2) out[id] = f;
    }
    return out;
  } catch {
    return {};
  }
}

/** Fija (0/1/2) o quita (null) la planta de una trabajadora. */
export async function setFixedFloor(tenantId: string, workerId: string, floor: 0 | 1 | 2 | null): Promise<void> {
  const cur = await getFixedFloors(tenantId);
  if (floor === null) delete cur[workerId];
  else cur[workerId] = floor;
  await db
    .insert(settings)
    .values({ tenantId, key: KEY, value: JSON.stringify(cur) })
    .onConflictDoUpdate({ target: [settings.tenantId, settings.key], set: { value: JSON.stringify(cur), updatedAt: new Date() } });
}
