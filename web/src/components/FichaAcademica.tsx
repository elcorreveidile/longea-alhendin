import type { TeacherGroupRow } from "@/db/docencia";

// Estilo "expediente académico": pergamino sobrio, serif, azul universidad y granate.
const PARCH = "#f6f1e3";
const INK = "#1f3a5f";   // azul universidad
const RUBY = "#7a2434";  // granate

function hLabel(min: number) {
  return (min / 60).toLocaleString("es-ES", { maximumFractionDigits: 2 });
}
function scheduleText(schedule: unknown): string {
  if (!Array.isArray(schedule)) return "";
  return (schedule as { weekdays?: string[]; start?: string; end?: string }[])
    .map((b) => `${(b.weekdays ?? []).join("")} ${b.start ?? ""}–${b.end ?? ""}`.trim())
    .join(" · ");
}

const KINDS: { key: string; label: string; carga: boolean }[] = [
  { key: "clase", label: "Docencia", carga: true },
  { key: "practicas", label: "Prácticas", carga: true },
  { key: "vigilancia_examen", label: "Vigilancia de exámenes", carga: true },
  { key: "prueba_nivel", label: "Pruebas de nivel", carga: true },
  { key: "tutoria", label: "Tutorías", carga: false },
  { key: "otro", label: "Otros", carga: true },
];

export function FichaHeader({
  name, centerName, meta,
}: {
  name: string;
  centerName?: string;
  meta?: { label: string; value: string }[];
}) {
  return (
    <header
      className="relative overflow-hidden rounded-xl border-2 border-double p-6 shadow-sm"
      style={{ background: PARCH, borderColor: INK }}
    >
      <div className="flex items-center gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-symbol.png" alt="" className="h-12 w-12 shrink-0 opacity-90" />
        <div>
          <p className="font-serif text-[11px] uppercase tracking-[0.3em]" style={{ color: RUBY }}>
            {centerName ?? "Centro"} · Expediente del profesorado
          </p>
          <h1 className="font-serif text-2xl font-bold tracking-wide" style={{ color: INK }}>{name}</h1>
        </div>
      </div>
      {meta && meta.length > 0 && (
        <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-1 border-t pt-3 text-sm sm:grid-cols-4"
          style={{ borderColor: "#c9b98f" }}>
          {meta.map((m) => (
            <div key={m.label}>
              <dt className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#8a7a52" }}>{m.label}</dt>
              <dd className="font-serif" style={{ color: INK }}>{m.value}</dd>
            </div>
          ))}
        </dl>
      )}
    </header>
  );
}

export function SeccionAcademica({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border bg-white p-5 shadow-sm" style={{ borderColor: "#e3d9bd" }}>
      <h2 className="mb-3 border-b pb-2 font-serif text-lg font-bold uppercase tracking-wide"
        style={{ color: INK, borderColor: "#c9b98f" }}>
        {title}
      </h2>
      {children}
    </section>
  );
}

export function DocenciaSecciones({ groups }: { groups: TeacherGroupRow[] }) {
  const cargaMin = groups.filter((g) => g.kind !== "tutoria").reduce((a, g) => a + g.minutes, 0);
  return (
    <SeccionAcademica title="Docencia asignada">
      {groups.length === 0 ? (
        <p className="font-serif text-sm text-slate-500">Aún no tiene docencia asignada este curso.</p>
      ) : (
        <div className="space-y-4">
          {KINDS.map((k) => {
            const rows = groups.filter((g) => g.kind === k.key);
            if (rows.length === 0) return null;
            return (
              <div key={k.key}>
                <h3 className="font-serif text-sm font-semibold" style={{ color: RUBY }}>
                  {k.label} {!k.carga && <span className="text-[10px] font-normal text-slate-400">(no computa carga)</span>}
                </h3>
                <ul className="mt-1 divide-y divide-slate-100 text-sm">
                  {rows.map((g) => (
                    <li key={g.id} className="flex flex-wrap items-center justify-between gap-2 py-1.5">
                      <span className="text-slate-700">
                        <strong>{g.subjectName ?? "—"}</strong>
                        {g.groupCode ? <span className="text-slate-400"> · {g.groupCode}</span> : null}
                        <span className="text-slate-400"> · {g.termName}</span>
                        {g.language === "en" ? <span className="ml-1 rounded bg-slate-100 px-1.5 text-[10px] text-slate-500">EN</span> : null}
                        {scheduleText(g.schedule) ? <span className="text-slate-500"> · {scheduleText(g.schedule)}</span> : null}
                      </span>
                      <span className="tabular-nums text-slate-500">{hLabel(g.minutes)} h</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
          <p className="border-t pt-2 font-serif text-sm" style={{ borderColor: "#c9b98f", color: INK }}>
            Carga docente (sin tutorías): <strong>{hLabel(cargaMin)} h</strong>
          </p>
        </div>
      )}
    </SeccionAcademica>
  );
}

export const ABSENCE_KINDS = [
  { value: "vacaciones", label: "Vacaciones" },
  { value: "asuntos_propios", label: "Asuntos propios" },
  { value: "permiso", label: "Permiso" },
  { value: "no_retribuido", label: "Permiso no retribuido" },
  { value: "baja_medica", label: "Baja médica" },
  { value: "otro", label: "Otro" },
];
export const ABSENCE_LABEL: Record<string, string> = Object.fromEntries(ABSENCE_KINDS.map((a) => [a.value, a.label]));

export const ABSENCE_STATUS: Record<string, { label: string; cls: string }> = {
  solicitada: { label: "Solicitada", cls: "bg-amber-100 text-amber-800" },
  aprobada: { label: "Aprobada", cls: "bg-emerald-100 text-emerald-800" },
  rechazada: { label: "Rechazada", cls: "bg-red-100 text-red-700" },
};
