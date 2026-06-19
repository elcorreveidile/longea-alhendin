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
  supervisor_warnings?: unknown[];
}

/** Lista de meses con cuadrante guardado (más recientes primero). */
export async function listCuadranteMonths(tenantId: string): Promise<{ year: number; month: number }[]> {
  try {
    const rows = await db
      .select({ year: cuadrantes.year, month: cuadrantes.month })
      .from(cuadrantes)
      .where(eq(cuadrantes.tenantId, tenantId))
      .orderBy(desc(cuadrantes.year), desc(cuadrantes.month));
    return rows;
  } catch {
    return [];
  }
}

/** Devuelve el cuadrante guardado de un mes, o null si no hay (o no hay BD). */
export async function getCuadrante(tenantId: string, year: number, month: number) {
  try {
    const rows = await db
      .select()
      .from(cuadrantes)
      .where(
        and(
          eq(cuadrantes.tenantId, tenantId),
          eq(cuadrantes.year, year),
          eq(cuadrantes.month, month),
        ),
      )
      .limit(1);
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

/** Devuelve el cuadrante más reciente guardado del tenant, o null. */
export async function getLatestCuadrante(tenantId: string) {
  try {
    // El más recientemente generado/editado (no el de mes mayor), para que
    // el panel muestre justo el que se acaba de generar.
    const rows = await db
      .select()
      .from(cuadrantes)
      .where(eq(cuadrantes.tenantId, tenantId))
      .orderBy(desc(cuadrantes.updatedAt))
      .limit(1);
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

/** Guarda (o actualiza) el cuadrante de un mes para el tenant. */
export async function saveCuadrante(
  tenantId: string,
  year: number,
  month: number,
  data: CuadranteJSON,
) {
  await db
    .insert(cuadrantes)
    .values({ tenantId, year, month, data })
    .onConflictDoUpdate({
      target: [cuadrantes.tenantId, cuadrantes.year, cuadrantes.month],
      set: { data, updatedAt: new Date() },
    });
}
