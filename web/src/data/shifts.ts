// Tipos de turno/estado y sus colores para el cuadrante.
// Inspirado en la leyenda del Excel de la Residencia Alhendín (Teresa Montes).

export type ShiftCode =
  | "M" | "M1" | "M2" | "M3" | "M4"
  | "T"
  | "N"
  | "D"
  | "V"
  | "H" | "HD";

export interface ShiftDef {
  code: ShiftCode;
  label: string;
  /** Grupo a efectos de cobertura: mañana, tarde, noche, libre */
  group: "mañana" | "tarde" | "noche" | "libre" | "otro";
  /** Clases Tailwind para la celda */
  className: string;
}

export const SHIFTS: Record<string, ShiftDef> = {
  M:  { code: "M",  label: "Mañana",                 group: "mañana", className: "bg-emerald-100 text-emerald-900" },
  M1: { code: "M1", label: "Mañana · grupo ducha 1", group: "mañana", className: "bg-emerald-100 text-emerald-900" },
  M2: { code: "M2", label: "Mañana · grupo ducha 2", group: "mañana", className: "bg-emerald-100 text-emerald-900" },
  M3: { code: "M3", label: "Mañana · grupo ducha 3", group: "mañana", className: "bg-emerald-100 text-emerald-900" },
  M4: { code: "M4", label: "Mañana · grupo ducha 4", group: "mañana", className: "bg-emerald-100 text-emerald-900" },
  T:  { code: "T",  label: "Tarde",                  group: "tarde",  className: "bg-amber-100 text-amber-900" },
  N:  { code: "N",  label: "Noche",                  group: "noche",  className: "bg-indigo-200 text-indigo-900" },
  D:  { code: "D",  label: "Descanso",               group: "libre",  className: "bg-slate-100 text-slate-500" },
  V:  { code: "V",  label: "Vacaciones",             group: "libre",  className: "bg-sky-200 text-sky-900" },
  H:  { code: "H",  label: "Horas a favor (debidas)", group: "otro",  className: "bg-rose-100 text-rose-800" },
  HD: { code: "HD", label: "Horas devueltas",        group: "otro",   className: "bg-rose-50 text-rose-700" },
};

export function shiftDef(code: string): ShiftDef {
  return (
    SHIFTS[code] ?? {
      code: code as ShiftCode,
      label: code,
      group: "otro",
      className: "bg-white text-slate-700",
    }
  );
}

export const WEEKEND_LETTERS = new Set(["S", "D"]);
