import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { workers as workersT, vacations as vacationsT } from "@/db/schema";
import { getGenConfig } from "./gen-settings";
import { getCuadrante } from "@/db/cuadrantes";

// Horarios reales (fijos): mañana 7-14:30, tarde 14:30-22, noche 22-7.
const SHIFT_HOURS = { M: [7, 14.5], T: [14.5, 22], N: [22, 31] };

interface EngineWorker {
  id: string;
  name: string;
  role: "gerocultora" | "gerocultora_lv" | "supervisora";
  vacations?: number[];
  no_night?: boolean;
  only_shift?: string;
  prev_tail?: string[]; // últimos días del mes anterior (continuidad)
}

/** Días del mes (1..n) que caen dentro de un rango de fechas [start, end]. */
function vacationDays(year: number, month: number, start: string, end: string): number[] {
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 0); // último día del mes
  const s = new Date(start);
  const e = new Date(end);
  const from = s > monthStart ? s : monthStart;
  const to = e < monthEnd ? e : monthEnd;
  const days: number[] = [];
  for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
    if (d.getMonth() === month - 1 && d.getFullYear() === year) days.push(d.getDate());
  }
  return days;
}

/**
 * Construye la configuración del motor a partir de la plantilla y vacaciones
 * guardadas en la base de datos. Devuelve también el mapa de nombres por id.
 */
export async function buildGenerateConfig(tenantId: string, year: number, month: number) {
  const rows = await db
    .select()
    .from(workersT)
    .where(and(eq(workersT.tenantId, tenantId), eq(workersT.active, true)));
  const ids = new Set(rows.map((w) => w.id));
  const vacs = (await db.select().from(vacationsT)).filter((v) => ids.has(v.workerId));

  const vacByWorker = new Map<string, number[]>();
  for (const v of vacs) {
    const days = vacationDays(year, month, v.startDate, v.endDate);
    if (days.length) {
      vacByWorker.set(v.workerId, [...(vacByWorker.get(v.workerId) ?? []), ...days]);
    }
  }

  const names: Record<string, string> = {};
  const workers: EngineWorker[] = rows.map((w) => {
    names[w.id] = w.name;
    const ew: EngineWorker = { id: w.id, name: w.name, role: w.jobRole };
    const vd = vacByWorker.get(w.id);
    if (vd && vd.length) ew.vacations = [...new Set(vd)].sort((a, b) => a - b);
    if (w.noNight) ew.no_night = true;
    if (w.onlyShift) ew.only_shift = w.onlyShift;
    return ew;
  });

  // Continuidad con el mes anterior: pasamos la "cola" de días de cada
  // trabajadora para que el motor arranque respetando cómo acabó (noche -> día 1
  // descanso, racha de días seguidos, descanso entre jornadas).
  const prevY = month === 1 ? year - 1 : year;
  const prevM = month === 1 ? 12 : month - 1;
  try {
    const prev = await getCuadrante(tenantId, prevY, prevM);
    const prevAssign = (prev?.data as { assignments?: Record<string, string[]> } | undefined)?.assignments;
    if (prevAssign) {
      const TAIL = 6; // suficiente para arrastrar la racha (máx. 5) y la noche
      for (const w of workers) {
        const row = prevAssign[w.id];
        if (Array.isArray(row) && row.length) w.prev_tail = row.slice(-TAIL).map(String);
      }
    }
  } catch {
    // si no hay mes anterior guardado, se genera sin continuidad
  }

  const gen = await getGenConfig(tenantId);
  const cfg = {
    year,
    month,
    coverage: gen.coverage,
    supervisors_count_in_coverage: gen.supervisorsCountInCoverage,
    shift_hours: SHIFT_HOURS,
    rules: {
      max_consecutive_work_days: gen.maxConsecutive,
      max_consecutive_rest_days: gen.maxConsecutiveRest,
      rest_block_window_days: 14,
      sunday_off_per_month: gen.sundayOff,
      no_morning_or_afternoon_after_night: true,
      min_hours_between_shifts: 12,
      rest_after_streak: { threshold: gen.restAfterStreak.threshold, min_rest: gen.restAfterStreak.minRest },
    },
    time_limit_seconds: 35,
    workers,
  };

  return { cfg, names, count: workers.length };
}

/** Lista de fechas ISO (YYYY-MM-DD) de un rango que empieza en `startDate`. */
function rangeDates(startDate: string, numDays: number): string[] {
  const [y, m, d] = startDate.split("-").map(Number);
  const out: string[] = [];
  for (let i = 0; i < numDays; i++) {
    const dt = new Date(Date.UTC(y, m - 1, d + i));
    out.push(dt.toISOString().slice(0, 10));
  }
  return out;
}

/**
 * Igual que buildGenerateConfig pero para una SEMANA (o rango de N días) a
 * partir de una fecha. Desactiva las reglas mensuales (domingo libre / bloque
 * de 36h) que no aplican a un tramo corto.
 */
export async function buildGenerateConfigWeek(tenantId: string, startDate: string, numDays = 7) {
  const rows = await db
    .select()
    .from(workersT)
    .where(and(eq(workersT.tenantId, tenantId), eq(workersT.active, true)));
  const ids = new Set(rows.map((w) => w.id));
  const vacs = (await db.select().from(vacationsT)).filter((v) => ids.has(v.workerId));
  const dates = rangeDates(startDate, numDays);

  const vacByWorker = new Map<string, number[]>();
  for (const v of vacs) {
    for (let i = 0; i < dates.length; i++) {
      if (dates[i] >= v.startDate && dates[i] <= v.endDate) {
        vacByWorker.set(v.workerId, [...(vacByWorker.get(v.workerId) ?? []), i + 1]);
      }
    }
  }

  const names: Record<string, string> = {};
  const workers: EngineWorker[] = rows.map((w) => {
    names[w.id] = w.name;
    const ew: EngineWorker = { id: w.id, name: w.name, role: w.jobRole };
    const vd = vacByWorker.get(w.id);
    if (vd && vd.length) ew.vacations = [...new Set(vd)].sort((a, b) => a - b);
    if (w.noNight) ew.no_night = true;
    if (w.onlyShift) ew.only_shift = w.onlyShift;
    return ew;
  });

  const gen = await getGenConfig(tenantId);
  const cfg = {
    start_date: startDate,
    num_days: numDays,
    coverage: gen.coverage,
    supervisors_count_in_coverage: gen.supervisorsCountInCoverage,
    shift_hours: SHIFT_HOURS,
    rules: {
      max_consecutive_work_days: gen.maxConsecutive,
      max_consecutive_rest_days: gen.maxConsecutiveRest,
      rest_block_window_days: 0,
      sunday_off_per_month: 0,
      no_morning_or_afternoon_after_night: true,
      min_hours_between_shifts: 12,
      rest_after_streak: { threshold: gen.restAfterStreak.threshold, min_rest: gen.restAfterStreak.minRest },
    },
    time_limit_seconds: 25,
    workers,
  };

  return { cfg, names, count: workers.length };
}
