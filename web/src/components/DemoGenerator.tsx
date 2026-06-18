"use client";

import { useState } from "react";
import { shiftDef } from "@/data/shifts";

interface Result {
  ok?: boolean;
  status?: string;
  dates?: string[];
  weekdays?: string[];
  assignments?: Record<string, string[]>;
  violations?: unknown[];
}

function nextMonday(): string {
  const d = new Date();
  const dow = d.getDay(); // 0=domingo
  const add = dow === 1 ? 7 : (8 - dow) % 7 || 7;
  d.setDate(d.getDate() + add);
  return d.toISOString().slice(0, 10);
}

export default function DemoGenerator() {
  const [n, setN] = useState(12);
  const [cov, setCov] = useState({ M: 4, T: 4, N: 2 });
  const [loading, setLoading] = useState(false);
  const [res, setRes] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function generar() {
    setLoading(true);
    setError(null);
    setRes(null);
    const workers = Array.from({ length: n }, (_, i) => ({
      id: `P${i + 1}`,
      name: `Persona ${i + 1}`,
      role: "gerocultora",
    }));
    const cfg = {
      start_date: nextMonday(),
      num_days: 7,
      coverage: cov,
      supervisors_count_in_coverage: true,
      shift_hours: { M: [7, 14.5], T: [14.5, 22], N: [22, 31] },
      rules: {
        max_consecutive_work_days: 5,
        max_consecutive_rest_days: 2,
        rest_block_window_days: 0,
        sunday_off_per_month: 0,
        no_morning_or_afternoon_after_night: true,
        min_hours_between_shifts: 12,
        rest_after_streak: { threshold: 5, min_rest: 2 },
      },
      time_limit_seconds: 6,
      workers,
    };
    try {
      const r = await fetch("/api/generar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cfg),
      });
      const data = (await r.json()) as Result;
      if (!data.ok) setError("No se pudo generar con esos números. Prueba a bajar la cobertura o subir el equipo.");
      else setRes(data);
    } catch {
      setError("Hubo un problema al generar. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  const ids = res?.assignments ? Object.keys(res.assignments) : [];

  return (
    <div className="rounded-2xl border border-[#e7dcc4] bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-end gap-4">
        <label className="text-sm">
          <span className="block text-slate-600">Personas en el equipo</span>
          <input
            type="number" min={6} max={24} value={n}
            onChange={(e) => setN(Math.max(6, Math.min(24, Number(e.target.value) || 6)))}
            className="mt-1 w-24 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </label>
        {(["M", "T", "N"] as const).map((k) => (
          <label key={k} className="text-sm">
            <span className="block text-slate-600">{k === "M" ? "Mañana" : k === "T" ? "Tarde" : "Noche"}</span>
            <input
              type="number" min={0} max={12} value={cov[k]}
              onChange={(e) => setCov({ ...cov, [k]: Math.max(0, Math.min(12, Number(e.target.value) || 0)) })}
              className="mt-1 w-20 rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
        ))}
        <button
          onClick={generar}
          disabled={loading}
          className="rounded-lg bg-cyan-700 px-6 py-2.5 text-sm font-semibold text-white hover:bg-cyan-800 disabled:opacity-60"
        >
          {loading ? "Generando…" : "Generar semana de ejemplo"}
        </button>
      </div>

      <p className="mt-3 text-xs text-slate-400">
        Datos de ejemplo (Persona 1, 2, 3…). El motor cuadra una semana real respetando descansos y máximos.
      </p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {([["M", "Mañana"], ["T", "Tarde"], ["N", "Noche"], ["D", "Descanso"], ["V", "Vacaciones"]] as const).map(
          ([c, l]) => (
            <span key={c} className={`rounded px-2 py-1 text-xs font-medium ${shiftDef(c).className}`}>
              <strong>{c}</strong> {l}
            </span>
          ),
        )}
      </div>

      {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      {res?.assignments && res.weekdays && (
        <div className="mt-5 overflow-x-auto rounded-lg border border-slate-200">
          <table className="border-collapse text-xs">
            <thead>
              <tr className="bg-cyan-700 text-white">
                <th className="sticky left-0 z-10 bg-cyan-700 px-3 py-2 text-left">Semana de ejemplo</th>
                {res.weekdays.map((wd, i) => (
                  <th key={i} className="px-2 py-1 text-center font-medium">{wd}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ids.map((id) => (
                <tr key={id} className="border-t border-slate-100">
                  <td className="sticky left-0 z-10 whitespace-nowrap bg-white px-3 py-1 font-medium text-slate-700">{id.replace("P", "Persona ")}</td>
                  {res.assignments![id].map((c, i) => {
                    const def = shiftDef(c);
                    return (
                      <td key={i} className="p-0.5 text-center">
                        <span className={`inline-block h-6 w-7 rounded text-center leading-6 font-semibold ${def.className}`}>{c}</span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
