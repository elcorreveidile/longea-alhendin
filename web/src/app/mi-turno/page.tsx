import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import TopBar from "@/components/TopBar";
import { shiftDef } from "@/data/shifts";
import sample from "@/data/sample-cuadrante.json";
import { CuadranteData } from "@/components/Cuadrante";
import { getLatestCuadrante } from "@/db/cuadrantes";

const MONTH_NAMES = [
  "", "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

export default async function MiTurnoPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const saved = await getLatestCuadrante();
  const data = (saved ? saved.data : sample) as unknown as CuadranteData;
  // Si el usuario tiene ficha enlazada y existe en el cuadrante, mostramos su fila.
  const ids = Object.keys(data.assignments);
  const myId = session.workerId && data.assignments[session.workerId] ? session.workerId : ids[3];
  const row = data.assignments[myId] ?? [];

  return (
    <div className="min-h-screen bg-slate-50">
      <TopBar name={session.name} role={session.role} />
      <main className="mx-auto max-w-xl space-y-4 p-6">
        <h2 className="text-lg font-semibold text-slate-800">
          Mi turno · {MONTH_NAMES[data.month]} {data.year}
        </h2>
        {!session.workerId && (
          <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
            Aún no tienes una ficha de plantilla enlazada (esto lo configura la
            administradora). Mostramos un ejemplo.
          </p>
        )}
        <div className="grid grid-cols-7 gap-1">
          {row.map((code, i) => {
            const def = shiftDef(code);
            const wl = data.weekdays[i];
            return (
              <div key={i} className={`rounded p-2 text-center ${def.className}`} title={def.label}>
                <div className="text-[10px] opacity-70">{wl} {i + 1}</div>
                <div className="text-sm font-semibold">{code}</div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
