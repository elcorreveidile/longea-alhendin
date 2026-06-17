import { redirect } from "next/navigation";
import { getSession, isStaffAdmin } from "@/lib/session";
import TopBar from "@/components/TopBar";
import Cuadrante, { CuadranteData } from "@/components/Cuadrante";
import { SHIFTS } from "@/data/shifts";
import sample from "@/data/sample-cuadrante.json";

export default async function PanelPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!isStaffAdmin(session.role)) redirect("/mi-turno");

  const data = sample as unknown as CuadranteData;
  const legend = ["M", "T", "N", "D", "V", "H", "HD"];

  return (
    <div className="min-h-screen bg-slate-50">
      <TopBar name={session.name} role={session.role} />
      <main className="mx-auto max-w-[1400px] space-y-5 p-6">
        <section className="rounded-lg bg-white p-4 shadow-sm">
          <h2 className="font-semibold text-slate-800">Cuadrante (muestra)</h2>
          <p className="mt-1 text-sm text-slate-500">
            Generado por el motor automático respetando cobertura 9/9/2, descansos
            legales, domingo libre al mes y reglas de M.Mar y supervisoras. La fila
            inferior comprueba la cobertura en vivo.
          </p>
        </section>

        <section className="flex flex-wrap gap-2">
          {legend.map((c) => {
            const def = SHIFTS[c];
            return (
              <span key={c} className={`rounded px-2 py-1 text-xs font-medium ${def.className}`}>
                <strong>{c}</strong> · {def.label}
              </span>
            );
          })}
        </section>

        <Cuadrante data={data} />

        {data.rest_warnings && data.rest_warnings.length > 0 && (
          <section className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <strong>Descanso semanal &lt; 36 h:</strong> el motor no pudo dar 36 h
            seguidas de descanso en estas semanas (revísalas o compénsalas en 14 días):
            <ul className="mt-2 list-disc pl-5">
              {data.rest_warnings.map((w, i) => (
                <li key={i}>
                  <strong>{w.name}</strong> — días {w.from_day} a {w.to_day}
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </div>
  );
}
