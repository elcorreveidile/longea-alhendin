"use client";

import { useState } from "react";
import { shiftDef, WEEKEND_LETTERS } from "@/data/shifts";
import type { WeekData } from "@/lib/week-cuadrantes";

const CYCLE = ["M", "T", "N", "D", "V"] as const;
const MONTHS = [
  "", "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

function pretty(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return { dom: d, month: m, year: y };
}

export default function EditableWeek({
  data,
  action,
}: {
  data: WeekData;
  action: (formData: FormData) => void;
}) {
  const ids = Object.keys(data.assignments);
  const [grid, setGrid] = useState<Record<string, string[]>>(() =>
    Object.fromEntries(ids.map((id) => [id, [...data.assignments[id]]])),
  );

  function cycle(id: string, d: number) {
    setGrid((g) => {
      const row = [...(g[id] || [])];
      const i = CYCLE.indexOf(row[d] as (typeof CYCLE)[number]);
      row[d] = CYCLE[(i + 1) % CYCLE.length];
      return { ...g, [id]: row };
    });
  }

  const a = pretty(data.dates[0]);
  const b = pretty(data.dates[data.dates.length - 1]);
  const title =
    a.month === b.month
      ? `Semana del ${a.dom} al ${b.dom} de ${MONTHS[a.month]} ${a.year}`
      : `Semana del ${a.dom} de ${MONTHS[a.month]} al ${b.dom} de ${MONTHS[b.month]} ${b.year}`;

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="start" value={data.start_date} />
      <input type="hidden" name="assignments" value={JSON.stringify(grid)} />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-slate-500">
          Toca una celda para cambiar el turno (M → T → N → D → V).
        </p>
        <button className="rounded-lg bg-cyan-700 px-5 py-2 text-sm font-semibold text-white hover:bg-cyan-800">
          Guardar cambios
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 shadow-sm">
        <table className="border-collapse text-xs">
          <thead>
            <tr className="bg-cyan-700 text-white">
              <th className="sticky left-0 z-10 bg-cyan-700 px-3 py-2 text-left font-semibold">{title}</th>
              {data.dates.map((iso, i) => {
                const p = pretty(iso);
                const weekend = WEEKEND_LETTERS.has(data.weekdays[i]);
                return (
                  <th key={iso} className={`px-2 py-1 text-center font-medium ${weekend ? "bg-cyan-800" : ""}`}>
                    <div className="opacity-80">{data.weekdays[i]}</div>
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
                  const code = grid[id]?.[d] ?? "";
                  const def = shiftDef(code);
                  return (
                    <td key={iso} className="p-0.5 text-center">
                      <button
                        type="button"
                        onClick={() => cycle(id, d)}
                        className={`h-6 w-7 rounded text-center font-semibold ${def.className} hover:ring-2 hover:ring-cyan-500`}
                        title={def.label}
                      >
                        {code}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </form>
  );
}
