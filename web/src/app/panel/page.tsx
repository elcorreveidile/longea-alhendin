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
import { getGenConfig } from "@/lib/gen-settings";
import { notifyNewCuadrante } from "@/lib/notify";
import { getCurrentTenant } from "@/lib/tenant";
import { getTenantKind } from "@/lib/tenant-kind";
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
  infeasible: { ok: false, text: "Las reglas no se pueden cumplir con la plantilla actual. Relájalas en «Reglas de generación» (p. ej. sube el máximo de días seguidos o baja los descansos exigidos) y vuelve a generar." },
  sinplantilla: { ok: false, text: "No hay trabajadoras activas en la base de datos. Carga la plantilla primero." },
};

async function importCuadranteAction(formData: FormData) {
  "use server";
  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) return;
  const tenant = await getCurrentTenant();
  if (!tenant) return;
  try {
    const json = JSON.parse(await file.text()) as CuadranteJSON;
    if (!json.year || !json.month || !json.assignments) return;
    await saveCuadrante(tenant.id, json.year, json.month, json);
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
    const tenant = await getCurrentTenant();
    const { cfg, names } = tenant
      ? await buildGenerateConfig(tenant.id, year, month)
      : { cfg: { workers: [] as unknown[] }, names: {} };
    if (!tenant || !cfg.workers.length) {
      outcome = tenant ? "sinplantilla" : "error";
    } else {
      const base = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : appUrl();
      const res = await fetch(`${base}/api/generar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cfg),
      });
      const result = (await res.json()) as CuadranteJSON & { ok?: boolean; status?: string; names?: unknown };
      if (!result?.ok) {
        outcome = result?.status === "INFEASIBLE" ? "infeasible" : "error";
      } else {
        result.names = names;
        await saveCuadrante(tenant.id, year, month, result);
      }
    }
  } catch {
    outcome = "error";
  }
  redirect(`/panel?gen=${outcome}`);
}

const MONTH_LABEL = [
  "", "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

async function publishAction(formData: FormData) {
  "use server";
  const year = Number(formData.get("year"));
  const month = Number(formData.get("month"));
  const tenant = await getCurrentTenant();
  if (!tenant || !year || !month) redirect("/panel");
  const r = await notifyNewCuadrante(tenant.id, `${MONTH_LABEL[month]} ${year}`);
  redirect(`/panel?pub=${r.email}_${r.sms}_${r.skipped}`);
}

export default async function PanelPage({
  searchParams,
}: {
  searchParams: Promise<{ gen?: string; pub?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!isStaffAdmin(session.role)) redirect("/mi-turno");

  const sp = await searchParams;
  const genMsg = sp.gen ? GEN_MSG[sp.gen] : null;
  let pubMsg: { ok: boolean; text: string } | null = null;
  if (sp.pub) {
    const [em, sm, sk] = sp.pub.split("_").map(Number);
    pubMsg = {
      ok: true,
      text: `✓ Avisadas ${em + sm} trabajadoras (${em} por email, ${sm} por SMS)${sk ? ` · ${sk} sin email ni móvil` : ""}.`,
    };
  }

  const tenant = await getCurrentTenant();
  // Las academias usan el panel de profesorado/horas, no el de cuadrantes.
  if (tenant && (await getTenantKind(tenant.id)) === "academia") redirect("/panel/horas");
  const saved = tenant ? await getLatestCuadrante(tenant.id) : null;
  const gen = tenant ? await getGenConfig(tenant.id) : null;
  const data = (saved ? saved.data : sample) as unknown as CuadranteData;
  const isReal = !!saved;
  const legend = ["M", "T", "N", "D", "V", "H", "HD"];

  // Por defecto, el mes siguiente al actual.
  const now = new Date();
  const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const defYear = next.getFullYear();
  const defMonth = next.getMonth() + 1;

  return (
    <div className="min-h-screen bg-[#faf6ee]">
      <TopBar name={session.name} role={session.role} tenantName={tenant?.name} logoUrl={tenant?.logoUrl} />
      <main className="mx-auto max-w-[1400px] space-y-5 p-6">
        <div className="flex flex-wrap justify-end gap-2 print:hidden">
          {[
            { href: "/panel/semana", icon: "icon-semana", label: "Por semanas" },
            { href: "/panel/plantilla", icon: "icon-plantilla", label: "Plantilla" },
            { href: "/panel/vacaciones", icon: "icon-vacaciones", label: "Vacaciones" },
            { href: "/panel/config", icon: "icon-reglas", label: "Reglas" },
            { href: "/panel/accesos", icon: "icon-acceso", label: "Accesos" },
          ].map((it) => (
            <a
              key={it.href}
              href={it.href}
              className="flex items-center gap-2 rounded-xl border border-[#e7dcc4] bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/icons/${it.icon}.png`} alt="" className="h-6 w-6" />
              {it.label}
            </a>
          ))}
        </div>

        {genMsg && (
          <section
            className={`print:hidden rounded-lg border p-3 text-sm ${genMsg.ok ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-800"}`}
          >
            {genMsg.text}
          </section>
        )}

        {pubMsg && (
          <section className="print:hidden rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
            {pubMsg.text}
          </section>
        )}

        {/* Generar mes */}
        <section className="print:hidden rounded-lg border border-[#e7dcc4] bg-white p-4 shadow-sm">
          <h2 className="flex items-center gap-2 font-semibold text-slate-800">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icons/icon-generar.png" alt="" className="h-7 w-7" />
            Generar cuadrante
          </h2>
          {gen && (
            <p className="mt-1 rounded-md bg-slate-50 p-2 text-xs text-slate-600">
              <strong>Reglas activas:</strong> cobertura {gen.coverage.M}/{gen.coverage.T}/{gen.coverage.N} ·
              máx {gen.maxConsecutive} días seguidos · máx {gen.maxConsecutiveRest} descansos seguidos ·
              tras {gen.restAfterStreak.threshold} → {gen.restAfterStreak.minRest} descansos ·{" "}
              {gen.sundayOff} domingo libre.{" "}
              <a href="/panel/config" className="font-medium text-cyan-700 hover:underline">Cambiar</a>
            </p>
          )}
          <p className="mt-2 mb-3 text-sm text-slate-500">
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

        {!isReal ? (
          <section className="rounded-lg border border-[#e7dcc4] bg-white p-8 text-center shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icons/icon-plantilla.png" alt="" className="mx-auto h-12 w-12" />
            <h2 className="mt-3 text-lg font-bold text-slate-900">Aún no hay cuadrantes</h2>
            <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
              Empieza por cargar tu plantilla (tu equipo y sus reglas). Después pulsa
              «Generar mes» y aquí aparecerá el cuadrante.
            </p>
            <a
              href="/panel/plantilla"
              className="mt-4 inline-block rounded-lg bg-cyan-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-cyan-800"
            >
              Cargar plantilla →
            </a>
          </section>
        ) : (
          <>
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
                  <form action={publishAction}>
                    <input type="hidden" name="year" value={data.year} />
                    <input type="hidden" name="month" value={data.month} />
                    <GenerateButton idle="Publicar y avisar" busy="Avisando…" />
                  </form>
                  <a
                    href="/panel/editar"
                    className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Editar
                  </a>
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
          </>
        )}

        {isReal && data.violations && data.violations.length > 0 && (
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

        {isReal && data.rest_warnings && data.rest_warnings.length > 0 && (
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
