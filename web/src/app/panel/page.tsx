import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSession, isStaffAdmin } from "@/lib/session";
import TopBar from "@/components/TopBar";
import Cuadrante, { CuadranteData } from "@/components/Cuadrante";
import { SHIFTS } from "@/data/shifts";
import sample from "@/data/sample-cuadrante.json";
import { getLatestCuadrante, saveCuadrante, type CuadranteJSON } from "@/db/cuadrantes";

const MONTH_NAMES = [
  "", "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

async function importCuadranteAction(formData: FormData) {
  "use server";
  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) return;
  try {
    const json = JSON.parse(await file.text()) as CuadranteJSON;
    if (!json.year || !json.month || !json.assignments) return;
    await saveCuadrante(json.year, json.month, json);
    revalidatePath("/panel");
  } catch {
    // JSON inválido: se ignora (en una versión futura mostraremos el error)
  }
}

export default async function PanelPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!isStaffAdmin(session.role)) redirect("/mi-turno");

  const saved = await getLatestCuadrante();
  const data = (saved ? saved.data : sample) as unknown as CuadranteData;
  const isReal = !!saved;
  const legend = ["M", "T", "N", "D", "V", "H", "HD"];

  return (
    <div className="min-h-screen bg-slate-50">
      <TopBar name={session.name} role={session.role} />
      <main className="mx-auto max-w-[1400px] space-y-5 p-6">
        <section className="rounded-lg bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-semibold text-slate-800">
              Cuadrante · {MONTH_NAMES[data.month]} {data.year}
            </h2>
            <span
              className={`rounded px-2 py-1 text-xs font-medium ${isReal ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-500"}`}
            >
              {isReal ? "Guardado en la base de datos" : "Ejemplo (sin datos cargados)"}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Cobertura 9 mañana / 9 tarde / 2 noche, descansos legales, domingo libre al
            mes y reglas de M.Mar y supervisoras. La fila inferior comprueba la cobertura.
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

        {/* Importar un cuadrante generado por el motor (JSON) */}
        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="font-semibold text-slate-800">Importar cuadrante</h3>
          <p className="mt-1 mb-3 text-sm text-slate-500">
            Sube el fichero <code>output.json</code> generado por el motor para
            guardarlo como cuadrante del mes. (Próximamente: generar desde aquí.)
          </p>
          <form action={importCuadranteAction} className="flex items-center gap-3">
            <input
              type="file"
              name="file"
              accept="application/json,.json"
              required
              className="text-sm"
            />
            <button className="rounded-lg bg-cyan-700 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-800">
              Guardar
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}
