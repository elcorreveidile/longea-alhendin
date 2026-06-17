"use client";

import { useState } from "react";
import { shiftDef } from "@/data/shifts";

const CYCLE = ["M", "T", "N", "D", "V"] as const;
const MONTHS = [
  "", "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

interface Data {
  year: number;
  month: number;
  days: number;
  weekdays: string[];
  assignments: Record<string, string[]>;
  names?: Record<string, string>;
}

export default function EditableCuadrante({
  data,
  action,
}: {
  data: Data;
  action: (formData: FormData) => void;
}) {
  const ids = Object.keys(data.assignments);
  const [grid, setGrid] = useState<Record<string, string[]>>(() =>
    Object.fromEntries(ids.map((id) => [id, [...data.assignments[id]]])),
  );
  const [dirty, setDirty] = useState(false);

  function cycle(id: string, d: number) {
    setDirty(true);
    setGrid((g) => {
      const row = [...(g[id] || [])];
      const i = CYCLE.indexOf(row[d] as (typeof CYCLE)[number]);
      row[d] = CYCLE[(i + 1) % CYCLE.length];
      return { ...g, [id]: row };
    });
  }

  const days = data.days;

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="assignments" value={JSON.stringify(grid)} />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-slate-500">
          Toca una celda para cambiar el turno (M → T → N → D → V).
        </p>
        <button className="rounded-lg bg-cyan-700 px-5 py-2 text-sm font-semibold text-white hover:bg-cyan-800">
          {dirty ? "Guardar cambios" : "Guardar"}
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 shadow-sm">
        <table className="border-collapse text-[11px]">
          <thead>
            <tr className="bg-cyan-700 text-white">
              <th className="sticky left-0 z-10 bg-cyan-700 px-3 py-2 text-left font-semibold">
                {MONTHS[data.month]} {data.year}
              </th>
              {Array.from({ length: days }, (_, i) => (
                <th key={i} className="px-1 py-1 text-center font-medium">
                  <div className="text-[9px] opacity-80">{data.weekdays[i]}</div>
                  {i + 1}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ids.map((id) => (
              <tr key={id} className="border-t border-slate-100">
                <td className="sticky left-0 z-10 whitespace-nowrap bg-white px-3 py-1 font-medium text-slate-700">
                  {data.names?.[id] ?? id}
                </td>
                {Array.from({ length: days }, (_, d) => {
                  const code = grid[id]?.[d] ?? "";
                  const def = shiftDef(code);
                  return (
                    <td key={d} className="p-0.5">
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
