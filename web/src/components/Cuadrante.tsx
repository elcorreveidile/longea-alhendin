"use client";

import { shiftDef, WEEKEND_LETTERS } from "@/data/shifts";

const MONTH_NAMES = [
  "", "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

export interface CuadranteData {
  year: number;
  month: number;
  days: number;
  weekdays: string[];
  assignments: Record<string, string[]>;
  floors?: Record<string, (number | null)[]>;
  roles?: Record<string, string>;
  violations: { day: number; shift: string; required: number; assigned: number; short: number }[];
  rest_warnings?: { worker: string; name: string; from_day: number; to_day: number }[];
  supervisor_warnings?: { day: number }[];
  names?: Record<string, string>;
}

// Nombre legible a partir del id (de momento; vendrá del modelo de datos real)
function nameFor(id: string): string {
  const map: Record<string, string> = {
    diana: "Diana (sup.)", sup2: "Supervisora 2", mmar: "M.Mar",
    monica: "Mónica", barbara: "Bárbara", rocio: "Rocío", pamela: "Pamela",
    irene: "Irene León", desiree: "Desiree", cloe: "Cloe", laurap: "Laura Padilla",
    montse: "Montse", mar: "Mar", melody: "Melody", mjose: "Mª José", sandra: "Sandra",
    anamontoro: "Ana Montoro", isabel: "Isabel", noemi: "Noemí", ainhoa: "Ainhoa",
    conce: "Conce", anaisabel: "Ana Isabel", sara: "Sara", azblais: "Azblais",
    diego: "Diego", isabelm: "Isabel María", yolanda: "Yolanda", laura: "Laura",
    sustituta: "Sustituta", toni: "Toñi", wisan: "Wisan", nuria: "Nuria", susana: "Susana",
  };
  return map[id] ?? id;
}

// Colores de planta (Diana): 0 azul · 1 verde · 2 rosa · noche negro · super. gris.
const FLOOR_CLASS: Record<number, string> = {
  0: "bg-blue-300 text-blue-950",
  1: "bg-emerald-300 text-emerald-950",
  2: "bg-pink-300 text-pink-950",
};
const FLOOR_LABEL: Record<number, string> = { 0: "planta 0", 1: "planta 1", 2: "planta 2" };
const NIGHT_CLASS = "bg-slate-900 text-white";
const SUP_SHIFT_CLASS = "bg-slate-400 text-slate-900";

/** Clase y etiqueta de una celda según turno, planta y rol. */
function cellStyle(code: string, floor: number | null | undefined, isSup: boolean) {
  const base = shiftDef(code);
  if (code === "N") return { className: NIGHT_CLASS, label: "Noche" };
  if ((code === "M" || code === "T") && isSup) {
    return { className: SUP_SHIFT_CLASS, label: `${base.label} · supervisora` };
  }
  if ((code === "M" || code === "T") && (floor === 0 || floor === 1 || floor === 2)) {
    return { className: FLOOR_CLASS[floor], label: `${base.label} · ${FLOOR_LABEL[floor]}` };
  }
  return { className: base.className, label: base.label };
}

export default function Cuadrante({
  data,
  cycleFloorAction,
}: {
  data: CuadranteData;
  /** Si se pasa, las celdas de mañana/tarde se pueden pulsar para cambiar de
   * planta a mano (rosa → verde → azul → rosa). Solo en el panel de la admin. */
  cycleFloorAction?: (id: string, d: number, formData: FormData) => void | Promise<void>;
}) {
  const dayNums = Array.from({ length: data.days }, (_, i) => i + 1);

  const isSupRow = (id: string) =>
    data.roles ? data.roles[id] === "supervisora" : new Set(["diana", "sup2"]).has(id);

  // recuento de cobertura por día
  const coverage = dayNums.map((_, d) => {
    let m = 0, t = 0, n = 0;
    for (const row of Object.values(data.assignments)) {
      const c = row[d];
      if (c?.startsWith("M")) m++;
      else if (c === "T") t++;
      else if (c === "N") n++;
    }
    return { m, t, n };
  });

  const editable = typeof cycleFloorAction === "function";

  const table = (
    <table className="border-collapse text-[11px]">
      <thead>
        <tr className="bg-cyan-700 text-white">
          <th className="sticky left-0 z-10 bg-cyan-700 px-3 py-2 text-left font-semibold">
            {MONTH_NAMES[data.month]} {data.year}
          </th>
          {dayNums.map((d) => {
            const wl = data.weekdays[d - 1];
            const weekend = WEEKEND_LETTERS.has(wl);
            return (
              <th key={d} className={`w-7 px-0 py-1 text-center font-medium ${weekend ? "bg-cyan-800" : ""}`}>
                <div>{wl}</div>
                <div className="text-[10px] opacity-90">{d}</div>
              </th>
            );
          })}
        </tr>
      </thead>
      <tbody>
        {Object.entries(data.assignments).map(([id, row]) => {
          const isSup = isSupRow(id);
          const frow = data.floors?.[id];
          return (
            <tr key={id} className={isSup ? "bg-slate-200/60" : ""}>
              <td className={`sticky left-0 z-10 whitespace-nowrap px-3 py-1 font-medium ${isSup ? "bg-slate-200" : "bg-white"}`}>
                {data.names?.[id] ?? nameFor(id)}
              </td>
              {row.map((code, d) => {
                const floor = frow ? frow[d] : null;
                const { className, label } = cellStyle(code, floor, isSup);
                const canEdit = editable && !isSup && (code === "M" || code === "T");
                const content = (
                  <>
                    {code}
                    {(code === "M" || code === "T") && (floor === 0 || floor === 1 || floor === 2) && (
                      <sup className="ml-px text-[7px] font-bold opacity-80">{floor}</sup>
                    )}
                  </>
                );
                if (canEdit && cycleFloorAction) {
                  return (
                    <td key={d} className="border border-white/70 p-0 text-center">
                      <form action={cycleFloorAction.bind(null, id, d)}>
                        <button
                          type="submit"
                          title={`${label} — pulsa para cambiar de planta`}
                          className={`block h-full w-full cursor-pointer px-0 py-1 ${className} hover:brightness-95`}
                        >
                          {content}
                        </button>
                      </form>
                    </td>
                  );
                }
                return (
                  <td key={d} className={`border border-white/70 text-center ${className}`} title={label}>
                    {content}
                  </td>
                );
              })}
            </tr>
          );
        })}
        {/* fila de recuento de cobertura */}
        <tr className="bg-slate-800 text-white font-semibold">
          <td className="sticky left-0 z-10 bg-slate-800 px-3 py-1">Cobertura M/T/N (objetivo 9/9/2)</td>
          {coverage.map((c, d) => {
            // Por turno: rojo solo si FALTA gente (déficit, problema real); ámbar
            // si SOBRA (excedente, no pasa nada); normal si está justo en el objetivo.
            const cell = (val: number, target: number) =>
              val < target ? "bg-red-600 text-white" : val > target ? "text-amber-300" : "";
            return (
              <td key={d} className="px-0 text-center text-[9px] leading-tight">
                <div className={cell(c.m, 9)}>{c.m}</div>
                <div className={cell(c.t, 9)}>{c.t}</div>
                <div className={cell(c.n, 2)}>{c.n}</div>
              </td>
            );
          })}
        </tr>
        <tr className="bg-slate-800 text-white">
          <td className="sticky left-0 z-10 bg-slate-800 px-3 pb-2 text-[10px] font-normal text-slate-300">
            <span className="text-red-300">Rojo</span> = falta gente ·{" "}
            <span className="text-amber-300">Ámbar</span> = sobra (refuerzo)
          </td>
          <td colSpan={data.days} className="bg-slate-800" />
        </tr>
      </tbody>
    </table>
  );

  return (
    <div>
      <div className="cuadrante-scroll overflow-x-auto rounded-lg border border-slate-200 shadow-sm print:overflow-visible">
        {table}
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        <span className={`rounded px-2 py-0.5 text-[11px] font-medium ${FLOOR_CLASS[2]}`}><strong>Rosa</strong> planta 2</span>
        <span className={`rounded px-2 py-0.5 text-[11px] font-medium ${FLOOR_CLASS[1]}`}><strong>Verde</strong> planta 1</span>
        <span className={`rounded px-2 py-0.5 text-[11px] font-medium ${FLOOR_CLASS[0]}`}><strong>Azul</strong> planta 0</span>
        <span className={`rounded px-2 py-0.5 text-[11px] font-medium ${NIGHT_CLASS}`}><strong>Negro</strong> noche</span>
        <span className={`rounded px-2 py-0.5 text-[11px] font-medium ${SUP_SHIFT_CLASS}`}><strong>Gris</strong> supervisora</span>
        <span className={`rounded px-2 py-0.5 text-[11px] font-medium ${shiftDef("D").className}`}><strong>D</strong> descanso</span>
        <span className={`rounded px-2 py-0.5 text-[11px] font-medium ${shiftDef("V").className}`}><strong>V</strong> vacaciones</span>
      </div>
      {editable && (
        <p className="mt-1 text-[11px] text-slate-500">
          Pulsa una celda de mañana o tarde para cambiarle la planta (rosa → verde → azul). Las plantas se
          mantienen estables entre días; aquí las ajustas a mano cuando haga falta.
        </p>
      )}
    </div>
  );
}
