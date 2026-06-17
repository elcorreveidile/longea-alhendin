import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { workers as workersT, vacations as vacationsT } from "@/db/schema";

// Constantes del convenio confirmadas con Diana.
const COVERAGE = { M: 9, T: 9, N: 2 };
const SHIFT_HOURS = { M: [7, 14.5], T: [14.5, 22], N: [22, 31] };
const RULES = {
  max_consecutive_work_days: 6,
  rest_block_window_days: 14,
  sunday_off_per_month: 1,
  no_morning_or_afternoon_after_night: true,
  min_hours_between_shifts: 12,
};

interface EngineWorker {
  id: string;
  name: string;
  role: "gerocultora" | "gerocultora_lv" | "supervisora";
  vacations?: number[];
  no_night?: boolean;
  only_shift?: string;
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

  const cfg = {
    year,
    month,
    coverage: COVERAGE,
    supervisors_count_in_coverage: true,
    shift_hours: SHIFT_HOURS,
    rules: RULES,
    time_limit_seconds: 35,
    workers,
  };

  return { cfg, names, count: workers.length };
}
