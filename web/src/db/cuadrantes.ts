import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { db } from "./index";
import { cuadrantes } from "./schema";

export interface CuadranteJSON {
  year: number;
  month: number;
  days: number;
  weekdays: string[];
  assignments: Record<string, string[]>;
  violations?: unknown[];
  rest_warnings?: unknown[];
}

/** Devuelve el cuadrante guardado de un mes, o null si no hay (o no hay BD). */
export async function getCuadrante(year: number, month: number) {
  try {
    const rows = await db
      .select()
      .from(cuadrantes)
      .where(and(eq(cuadrantes.year, year), eq(cuadrantes.month, month)))
      .limit(1);
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

/** Devuelve el cuadrante más reciente guardado, o null. */
export async function getLatestCuadrante() {
  try {
    const rows = await db
      .select()
      .from(cuadrantes)
      .orderBy(desc(cuadrantes.year), desc(cuadrantes.month))
      .limit(1);
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

/** Guarda (o actualiza) el cuadrante de un mes. */
export async function saveCuadrante(year: number, month: number, data: CuadranteJSON) {
  await db
    .insert(cuadrantes)
    .values({ year, month, data })
    .onConflictDoUpdate({
      target: [cuadrantes.year, cuadrantes.month],
      set: { data, updatedAt: new Date() },
    });
}
