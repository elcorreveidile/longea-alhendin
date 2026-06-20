import type { TeacherGroupRow } from "@/db/docencia";

const WEEK = ["L", "M", "X", "J", "V", "S", "D"];
const DAY_NAME = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const HOURPX = 40;

const KIND_CLS: Record<string, string> = {
  clase: "bg-cyan-100 border-cyan-300 text-cyan-900",
  tutoria: "bg-violet-100 border-violet-300 text-violet-900",
  prueba_nivel: "bg-amber-100 border-amber-300 text-amber-900",
  vigilancia: "bg-slate-200 border-slate-300 text-slate-700",
};

type ScheduleSeg = { weekdays?: string[]; start?: string; end?: string };
interface Block { dayIdx: number; startMin: number; endMin: number; label: string; sub: string; cls: string; sim: boolean }

function toMin(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

/** Horario orientativo, estable por grupo (cuando no hay horario real cargado). */
function simulate(g: TeacherGroupRow): { days: string[]; start: number; end: number } {
  const hash = [...g.id].reduce((a, c) => a + c.charCodeAt(0), 0);
  const pairs = [["L", "X"], ["M", "J"], ["X", "V"], ["L", "J"], ["M", "V"], ["L", "M"]];
  const days = pairs[hash % pairs.length];
  const startH = [16, 17, 18][hash % 3];
  const durMin = [90, 120][hash % 2];
  let start = startH * 60;
  let end = start + durMin;
  if (end > 21 * 60) { end = 21 * 60; start = end - durMin; }
  return { days, start, end };
}

function buildBlocks(groups: TeacherGroupRow[]): Block[] {
  const blocks: Block[] = [];
  for (const g of groups) {
    const label = g.subjectName || g.groupCode || g.kind;
    const meta = [g.level, g.language?.toUpperCase(), g.termName].filter(Boolean).join(" · ");
    const cls = KIND_CLS[g.kind] ?? KIND_CLS.clase;
    const segs = (Array.isArray(g.schedule) ? g.schedule : []) as ScheduleSeg[];
    const real = segs.filter((s) => s.start && s.end && s.weekdays?.length);
    if (real.length) {
      for (const s of real) {
        for (const wd of s.weekdays!) {
          const dayIdx = WEEK.indexOf(wd);
          if (dayIdx >= 0) blocks.push({ dayIdx, startMin: toMin(s.start!), endMin: toMin(s.end!), label, sub: meta, cls, sim: false });
        }
      }
    } else {
      const sim = simulate(g);
      for (const wd of sim.days) {
        const dayIdx = WEEK.indexOf(wd);
        if (dayIdx >= 0) blocks.push({ dayIdx, startMin: sim.start, endMin: sim.end, label, sub: meta, cls, sim: true });
      }
    }
  }
  return blocks;
}

const fmt = (min: number) => `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;

export default function WeeklyTimetable({ groups }: { groups: TeacherGroupRow[] }) {
  const blocks = buildBlocks(groups);
  if (!blocks.length) {
    return <p className="font-serif text-sm text-slate-500">No tienes grupos asignados para mostrar un horario.</p>;
  }

  const maxDay = Math.max(4, ...blocks.map((b) => b.dayIdx)); // al menos L–V
  const days = Array.from({ length: maxDay + 1 }, (_, i) => i);
  const startMin = Math.min(9 * 60, ...blocks.map((b) => Math.floor(b.startMin / 60) * 60));
  const endMin = Math.max(21 * 60, ...blocks.map((b) => Math.ceil(b.endMin / 60) * 60));
  const hours = Array.from({ length: (endMin - startMin) / 60 }, (_, i) => startMin + i * 60);
  const bodyH = ((endMin - startMin) / 60) * HOURPX;
  const anySim = blocks.some((b) => b.sim);

  return (
    <div>
      <div className="flex overflow-x-auto rounded-lg border border-slate-200 bg-white">
        {/* Columna de horas */}
        <div className="shrink-0" style={{ width: 48 }}>
          <div className="h-7 border-b border-slate-200" />
          <div className="relative" style={{ height: bodyH }}>
            {hours.map((hmin, i) => (
              <div key={hmin} className="absolute right-1 -translate-y-1/2 text-[10px] text-slate-400" style={{ top: i * HOURPX }}>
                {fmt(hmin)}
              </div>
            ))}
          </div>
        </div>
        {/* Columnas por día */}
        {days.map((d) => (
          <div key={d} className="min-w-[6rem] flex-1 border-l border-slate-100">
            <div className="flex h-7 items-center justify-center border-b border-slate-200 text-xs font-semibold text-slate-600">
              {DAY_NAME[d]}
            </div>
            <div className="relative" style={{ height: bodyH }}>
              {hours.map((_, i) => (
                <div key={i} className="absolute w-full border-b border-dashed border-slate-100" style={{ top: i * HOURPX, height: HOURPX }} />
              ))}
              {blocks.filter((b) => b.dayIdx === d).map((b, i) => (
                <div
                  key={i}
                  className={`absolute left-0.5 right-0.5 overflow-hidden rounded border px-1 py-0.5 text-[10px] leading-tight ${b.cls}`}
                  style={{ top: ((b.startMin - startMin) / 60) * HOURPX, height: Math.max(((b.endMin - b.startMin) / 60) * HOURPX - 2, 18) }}
                >
                  <div className="truncate font-semibold">{b.label}</div>
                  <div className="truncate opacity-80">{fmt(b.startMin)}–{fmt(b.endMin)}</div>
                  {b.sub && <div className="truncate opacity-70">{b.sub}</div>}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      {anySim && (
        <p className="mt-2 text-[11px] text-amber-600">
          ⓘ Algunos bloques son <strong>orientativos</strong> (el grupo aún no tiene horario asignado). Se ajustarán cuando dirección cargue el horario real.
        </p>
      )}
    </div>
  );
}
