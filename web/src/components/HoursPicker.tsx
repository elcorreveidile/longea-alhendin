"use client";
import { useState } from "react";

const CHIPS = [0.5, 1, 1.5, 2, 2.5, 3, 4];

function fmt(n: number): string {
  // Sin decimales innecesarios: 2 -> "2", 1.5 -> "1.5"
  return Number.isInteger(n) ? String(n) : String(Math.round(n * 100) / 100);
}
function label(n: number): string {
  const h = Math.floor(n);
  const m = Math.round((n - h) * 60);
  if (h && m) return `${h} h ${m} min`;
  if (h) return `${h} h`;
  return `${m} min`;
}

/** Selector de horas: botones rápidos, rango horario (de–a) o entrada manual. */
export default function HoursPicker({ name = "hours", defaultValue = "" }: { name?: string; defaultValue?: string }) {
  const [value, setValue] = useState(defaultValue);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  function recalc(f: string, t: string) {
    if (/^\d{2}:\d{2}$/.test(f) && /^\d{2}:\d{2}$/.test(t)) {
      const [fh, fm] = f.split(":").map(Number);
      const [th, tm] = t.split(":").map(Number);
      const diff = th * 60 + tm - (fh * 60 + fm);
      if (diff > 0) setValue(fmt(diff / 60));
    }
  }

  const current = parseFloat(value.replace(",", "."));

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1">
        {CHIPS.map((c) => {
          const active = current === c;
          return (
            <button
              key={c}
              type="button"
              onClick={() => setValue(fmt(c))}
              className={`rounded-full border px-3 py-1 text-xs font-medium ${active ? "border-cyan-600 bg-cyan-600 text-white" : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"}`}
            >
              {label(c)}
            </button>
          );
        })}
      </div>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-xs text-slate-400">o de</span>
        <input type="time" value={from} onChange={(e) => { setFrom(e.target.value); recalc(e.target.value, to); }} className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm" />
        <span className="text-xs text-slate-400">a</span>
        <input type="time" value={to} onChange={(e) => { setTo(e.target.value); recalc(from, e.target.value); }} className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm" />
        <span className="mx-1 text-slate-300">·</span>
        <input
          name={name}
          type="number"
          step="0.25"
          min="0"
          required
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="horas"
          className="w-24 rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
        />
        {value && current > 0 && <span className="text-xs font-medium text-cyan-700">= {label(current)}</span>}
      </div>
    </div>
  );
}
