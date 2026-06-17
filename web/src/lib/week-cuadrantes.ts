import "server-only";
import { and, eq, like } from "drizzle-orm";
import { db } from "@/db";
import { settings } from "@/db/schema";

// Los cuadrantes semanales se guardan en la tabla `settings` con clave
// `week:<YYYY-MM-DD>` (sin migración). El valor es el JSON del resultado.

const PREFIX = "week:";

export interface WeekData {
  start_date: string;
  num_days: number;
  days: number;
  dates: string[];
  weekdays: string[];
  assignments: Record<string, string[]>;
  violations: { day: number; shift: string; required: number; assigned: number; short: number }[];
  names?: Record<string, string>;
}

export async function getWeek(tenantId: string, startDate: string): Promise<WeekData | null> {
  const r = (
    await db
      .select()
      .from(settings)
      .where(and(eq(settings.tenantId, tenantId), eq(settings.key, PREFIX + startDate)))
      .limit(1)
  )[0];
  if (!r) return null;
  try {
    return JSON.parse(r.value) as WeekData;
  } catch {
    return null;
  }
}

export async function saveWeek(tenantId: string, startDate: string, data: WeekData): Promise<void> {
  const v = JSON.stringify(data);
  await db
    .insert(settings)
    .values({ tenantId, key: PREFIX + startDate, value: v })
    .onConflictDoUpdate({ target: [settings.tenantId, settings.key], set: { value: v, updatedAt: new Date() } });
}

/** Fechas de inicio (YYYY-MM-DD) de las semanas guardadas, más recientes primero. */
export async function listWeekStarts(tenantId: string): Promise<string[]> {
  const rows = await db
    .select({ key: settings.key })
    .from(settings)
    .where(and(eq(settings.tenantId, tenantId), like(settings.key, PREFIX + "%")));
  return rows
    .map((r) => r.key.slice(PREFIX.length))
    .sort((a, b) => b.localeCompare(a));
}
