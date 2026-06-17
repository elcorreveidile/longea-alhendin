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
  violations: { day: number; shift: string; required: number; assigned: number; short: number }[];
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

export default function Cuadrante({ data }: { data: CuadranteData }) {
  const dayNums = Array.from({ length: data.days }, (_, i) => i + 1);

  // recuento de cobertura por día
  const supervisors = new Set(["diana", "sup2"]);
  const coverage = dayNums.map((_, d) => {
    // Las supervisoras también cuentan en la cobertura de mañana/tarde.
    let m = 0, t = 0, n = 0;
    for (const row of Object.values(data.assignments)) {
      const c = row[d];
      if (c?.startsWith("M")) m++;
      else if (c === "T") t++;
      else if (c === "N") n++;
    }
    return { m, t, n };
  });

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 shadow-sm">
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
            const isSup = supervisors.has(id);
            return (
              <tr key={id} className={isSup ? "bg-slate-200/60" : ""}>
                <td className={`sticky left-0 z-10 whitespace-nowrap px-3 py-1 font-medium ${isSup ? "bg-slate-200" : "bg-white"}`}>
                  {nameFor(id)}
                </td>
                {row.map((code, d) => {
                  const def = shiftDef(code);
                  return (
                    <td key={d} className={`border border-white/70 text-center ${def.className}`} title={def.label}>
                      {code}
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
              const ok = c.m === 9 && c.t === 9 && c.n === 2;
              return (
                <td key={d} className={`px-0 text-center text-[9px] leading-tight ${ok ? "" : "bg-red-600"}`}>
                  <div>{c.m}</div>
                  <div>{c.t}</div>
                  <div>{c.n}</div>
                </td>
              );
            })}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
