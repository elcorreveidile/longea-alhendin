"use client";

import { shiftDef, WEEKEND_LETTERS } from "@/data/shifts";
import type { WeekData } from "@/lib/week-cuadrantes";
import DownloadWeekPdfButton from "@/components/DownloadWeekPdfButton";

const MONTHS = [
  "", "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

function pretty(iso: string): { dom: number; month: number; year: number } {
  const [y, m, d] = iso.split("-").map(Number);
  return { dom: d, month: m, year: y };
}

export default function WeekCuadrante({ data }: { data: WeekData }) {
  const a = pretty(data.dates[0]);
  const b = pretty(data.dates[data.dates.length - 1]);
  const title =
    a.month === b.month
      ? `Semana del ${a.dom} al ${b.dom} de ${MONTHS[a.month]} ${a.year}`
      : `Semana del ${a.dom} de ${MONTHS[a.month]} al ${b.dom} de ${MONTHS[b.month]} ${b.year}`;

  const ids = Object.keys(data.assignments);
  const cov = data.dates.map((_, d) => {
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
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 print:hidden">
        <h3 className="font-semibold text-slate-800">{title}</h3>
        <div className="flex items-center gap-2">
          <a
            href={`/api/export?week=${data.start_date}`}
            className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
          >
            Descargar Excel
          </a>
          <DownloadWeekPdfButton data={data} />
        </div>
      </div>

      <div className="cuadrante-scroll overflow-x-auto rounded-lg border border-slate-200 shadow-sm print:overflow-visible">
        <table className="border-collapse text-xs">
          <thead>
            <tr className="bg-cyan-700 text-white">
              <th className="sticky left-0 z-10 bg-cyan-700 px-3 py-2 text-left font-semibold">{title}</th>
              {data.dates.map((iso, i) => {
                const p = pretty(iso);
                const wk = data.weekdays[i];
                const weekend = WEEKEND_LETTERS.has(wk);
                return (
                  <th key={iso} className={`px-2 py-1 text-center font-medium ${weekend ? "bg-cyan-800" : ""}`}>
                    <div className="opacity-80">{wk}</div>
                    {p.dom}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {ids.map((id) => (
              <tr key={id} className="border-t border-slate-100">
                <td className="sticky left-0 z-10 whitespace-nowrap bg-white px-3 py-1 font-medium text-slate-700">
                  {data.names?.[id] ?? id}
                </td>
                {data.dates.map((iso, d) => {
                  const code = data.assignments[id]?.[d] ?? "";
                  const def = shiftDef(code);
                  return (
                    <td key={iso} className="p-0.5 text-center">
                      <span className={`inline-block h-6 w-7 rounded text-center leading-6 font-semibold ${def.className}`}>
                        {code}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-slate-300 bg-slate-50 text-[10px] text-slate-500">
              <td className="sticky left-0 z-10 bg-slate-50 px-3 py-1 font-semibold">Cobertura M/T/N</td>
              {cov.map((c, i) => (
                <td key={i} className="px-1 py-1 text-center">
                  {c.m}/{c.t}/{c.n}
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
