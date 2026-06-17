import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSession, isStaffAdmin } from "@/lib/session";
import { appUrl } from "@/lib/env";
import TopBar from "@/components/TopBar";
import Cuadrante, { CuadranteData } from "@/components/Cuadrante";
import { SHIFTS } from "@/data/shifts";
import sample from "@/data/sample-cuadrante.json";
import { getLatestCuadrante, saveCuadrante, type CuadranteJSON } from "@/db/cuadrantes";
import { buildGenerateConfig } from "@/lib/generate-config";
import GenerateButton from "@/components/GenerateButton";
import DownloadPdfButton from "@/components/DownloadPdfButton";

// La generación llama al motor (Python) y espera su respuesta; ampliamos el
// tiempo máximo de la función para que dé tiempo a resolver el cuadrante.
export const maxDuration = 60;

const MONTH_NAMES = [
  "", "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const GEN_MSG: Record<string, { ok: boolean; text: string }> = {
  ok: { ok: true, text: "✓ Cuadrante generado y guardado." },
  error: { ok: false, text: "No se pudo generar (la generación tardó demasiado o falló). Puedes reintentar o usar Importar." },
  sinplantilla: { ok: false, text: "No hay trabajadoras activas en la base de datos. Carga la plantilla primero." },
};

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
    // JSON inválido: se ignora
  }
}

async function generarMesAction(formData: FormData) {
  "use server";
  const year = Number(formData.get("year"));
  const month = Number(formData.get("month"));
  let outcome = "ok";
  try {
    const { cfg, names } = await buildGenerateConfig(year, month);
    if (!cfg.workers.length) {
      outcome = "sinplantilla";
    } else {
      const base = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : appUrl();
      const res = await fetch(`${base}/api/generar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cfg),
      });
      const result = (await res.json()) as CuadranteJSON & { ok?: boolean; names?: unknown };
      if (!result?.ok) {
        outcome = "error";
      } else {
        result.names = names;
        await saveCuadrante(year, month, result);
      }
    }
  } catch {
    outcome = "error";
  }
  redirect(`/panel?gen=${outcome}`);
}

export default async function PanelPage({
  searchParams,
}: {
  searchParams: Promise<{ gen?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!isStaffAdmin(session.role)) redirect("/mi-turno");

  const sp = await searchParams;
  const genMsg = sp.gen ? GEN_MSG[sp.gen] : null;

  const saved = await getLatestCuadrante();
  const data = (saved ? saved.data : sample) as unknown as CuadranteData;
  const isReal = !!saved;
  const legend = ["M", "T", "N", "D", "V", "H", "HD"];

  // Por defecto, el mes siguiente al actual.
  const now = new Date();
  const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const defYear = next.getFullYear();
  const defMonth = next.getMonth() + 1;

  return (
    <div className="min-h-screen bg-slate-50">
      <TopBar name={session.name} role={session.role} />
      <main className="mx-auto max-w-[1400px] space-y-5 p-6">
        {genMsg && (
          <section
            className={`print:hidden rounded-lg border p-3 text-sm ${genMsg.ok ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-800"}`}
          >
            {genMsg.text}
          </section>
        )}

        {/* Generar mes */}
        <section className="print:hidden rounded-lg border border-cyan-200 bg-white p-4 shadow-sm">
          <h2 className="font-semibold text-slate-800">Generar cuadrante</h2>
          <p className="mt-1 mb-3 text-sm text-slate-500">
            El motor genera el mes con la plantilla y vacaciones de la base de datos,
            respetando el convenio, y lo guarda. Puede tardar unos segundos.
          </p>
          <form action={generarMesAction} className="flex flex-wrap items-end gap-3">
            <label className="text-sm">
              <span className="block text-slate-600">Mes</span>
              <select name="month" defaultValue={defMonth} className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm">
                {MONTH_NAMES.slice(1).map((m, i) => (
                  <option key={i + 1} value={i + 1}>{m}</option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              <span className="block text-slate-600">Año</span>
              <input name="year" type="number" defaultValue={defYear} className="mt-1 w-24 rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            </label>
            <GenerateButton />
          </form>
        </section>

        <section className="rounded-lg bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-semibold text-slate-800">
              Cuadrante · {MONTH_NAMES[data.month]} {data.year}
            </h2>
            <div className="flex items-center gap-2">
              <span className={`rounded px-2 py-1 text-xs font-medium ${isReal ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-500"}`}>
                {isReal ? "Guardado en la base de datos" : "Ejemplo (sin datos cargados)"}
              </span>
              {isReal && (
                <div className="flex items-center gap-2 print:hidden">
                  <a
                    href={`/api/export?year=${data.year}&month=${data.month}`}
                    className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
                  >
                    Descargar Excel
                  </a>
                  <DownloadPdfButton data={data} />
                </div>
              )}
            </div>
          </div>
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

        {data.violations && data.violations.length > 0 && (
          <section className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-900">
            <strong>⚠️ Cobertura sin cubrir (falta personal):</strong> no hay
            suficientes trabajadoras disponibles para el mínimo 9/9/2 en estos
            turnos. Revisa vacaciones o refuerzos:
            <ul className="mt-2 grid grid-cols-2 gap-x-6 sm:grid-cols-3 md:grid-cols-4">
              {data.violations.map((v, i) => (
                <li key={i}>
                  Día {v.day} ·{" "}
                  {v.shift === "M" ? "mañana" : v.shift === "T" ? "tarde" : "noche"}: faltan {v.short}
                </li>
              ))}
            </ul>
          </section>
        )}

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
        <section className="print:hidden rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="font-semibold text-slate-800">Importar cuadrante</h3>
          <p className="mt-1 mb-3 text-sm text-slate-500">
            Alternativa: sube el fichero <code>output.json</code> del motor para guardarlo.
          </p>
          <form action={importCuadranteAction} className="flex items-center gap-3">
            <input type="file" name="file" accept="application/json,.json" required className="text-sm" />
            <button className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
              Guardar
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}
