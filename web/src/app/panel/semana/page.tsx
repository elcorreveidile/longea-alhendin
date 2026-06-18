import { redirect } from "next/navigation";
import { getSession, isStaffAdmin } from "@/lib/session";
import { getCurrentTenant } from "@/lib/tenant";
import { buildGenerateConfigWeek } from "@/lib/generate-config";
import { getWeek, saveWeek, listWeekStarts, type WeekData } from "@/lib/week-cuadrantes";
import { getGenConfig } from "@/lib/gen-settings";
import { appUrl } from "@/lib/env";
import TopBar from "@/components/TopBar";
import WeekCuadrante from "@/components/WeekCuadrante";
import GenerateButton from "@/components/GenerateButton";

const GEN_MSG: Record<string, { ok: boolean; text: string }> = {
  ok: { ok: true, text: "✓ Semana generada." },
  error: { ok: false, text: "No se pudo generar la semana. Reinténtalo." },
  infeasible: { ok: false, text: "Las reglas no se pueden cumplir esa semana. Relájalas en «Reglas de generación»." },
  sinplantilla: { ok: false, text: "No hay trabajadoras activas en la plantilla." },
};

/** Lunes (ISO) de la semana que contiene a `from`, o el siguiente lunes. */
function nextMonday(from = new Date()): string {
  const d = new Date(Date.UTC(from.getFullYear(), from.getMonth(), from.getDate()));
  const dow = d.getUTCDay(); // 0=domingo
  const add = dow === 1 ? 7 : (8 - dow) % 7 || 7;
  d.setUTCDate(d.getUTCDate() + add);
  return d.toISOString().slice(0, 10);
}

function prettyStart(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const months = ["", "ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  return `${d} ${months[m]} ${y}`;
}

async function generarSemanaAction(formData: FormData) {
  "use server";
  const start = String(formData.get("start") ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start)) redirect("/panel/semana?gen=error");
  let outcome = "ok";
  try {
    const tenant = await getCurrentTenant();
    const { cfg, names } = tenant
      ? await buildGenerateConfigWeek(tenant.id, start, 7)
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
      const result = (await res.json()) as WeekData & { ok?: boolean; status?: string; names?: unknown };
      if (!result?.ok) {
        outcome = result?.status === "INFEASIBLE" ? "infeasible" : "error";
      } else {
        result.names = names;
        await saveWeek(tenant.id, start, result);
      }
    }
  } catch {
    outcome = "error";
  }
  redirect(`/panel/semana?gen=${outcome}&d=${start}`);
}

export default async function SemanaPage({
  searchParams,
}: {
  searchParams: Promise<{ gen?: string; d?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!isStaffAdmin(session.role)) redirect("/mi-turno");

  const sp = await searchParams;
  const genMsg = sp.gen ? GEN_MSG[sp.gen] : null;
  const tenant = await getCurrentTenant();
  const weeks = tenant ? await listWeekStarts(tenant.id) : [];
  const gen = tenant ? await getGenConfig(tenant.id) : null;
  const selected = sp.d && weeks.includes(sp.d) ? sp.d : weeks[0];
  const data = tenant && selected ? await getWeek(tenant.id, selected) : null;
  const defaultStart = nextMonday();

  return (
    <div className="min-h-screen bg-[#faf6ee]">
      <TopBar name={session.name} role={session.role} tenantName={tenant?.name} logoUrl={tenant?.logoUrl} />
      <main className="mx-auto max-w-[1400px] space-y-5 p-6">
        <div className="flex items-center justify-between print:hidden">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-800">{/* eslint-disable-next-line @next/next/no-img-element */}<img src="/icons/icon-semana.png" alt="" className="h-7 w-7" />Cuadrante por semanas</h2>
          <a href="/panel" className="text-sm font-medium text-cyan-700 hover:underline">← Volver al panel</a>
        </div>

        {genMsg && (
          <div className={`print:hidden rounded-lg border p-3 text-sm ${genMsg.ok ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-700"}`}>
            {genMsg.text}
          </div>
        )}

        {/* Generar semana */}
        <section className="print:hidden rounded-lg border border-cyan-200 bg-white p-4 shadow-sm">
          <h3 className="font-semibold text-slate-800">Generar una semana</h3>
          <p className="mt-1 mb-2 text-sm text-slate-500">
            Elige el <strong>lunes</strong> de la semana. El motor genera 7 días con las mismas reglas.
          </p>
          {gen && (
            <p className="mb-3 rounded-md bg-slate-50 p-2 text-xs text-slate-600">
              <strong>Reglas activas (las mismas que el mes):</strong> cobertura {gen.coverage.M}/{gen.coverage.T}/{gen.coverage.N} ·
              máx {gen.maxConsecutive} días seguidos · máx {gen.maxConsecutiveRest} descansos seguidos ·
              tras {gen.restAfterStreak.threshold} → {gen.restAfterStreak.minRest} descansos.{" "}
              <a href="/panel/config" className="font-medium text-cyan-700 hover:underline">Cambiar</a>
            </p>
          )}
          <form action={generarSemanaAction} className="flex flex-wrap items-end gap-3">
            <label className="text-sm">Lunes de la semana
              <input type="date" name="start" defaultValue={defaultStart} className="mt-1 block rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            </label>
            <GenerateButton idle="Generar semana" />
          </form>
        </section>

        {/* Selector de semanas guardadas */}
        {weeks.length > 0 && (
          <div className="flex flex-wrap gap-2 print:hidden">
            {weeks.map((w) => (
              <a
                key={w}
                href={`/panel/semana?d=${w}`}
                className={`rounded-full border px-3 py-1 text-xs font-medium ${
                  w === selected
                    ? "border-cyan-600 bg-cyan-50 text-cyan-800"
                    : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                {prettyStart(w)}
              </a>
            ))}
          </div>
        )}

        {data && selected && (
          <div className="flex justify-end print:hidden">
            <a
              href={`/panel/semana/editar?d=${selected}`}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Editar a mano
            </a>
          </div>
        )}

        {data ? (
          <WeekCuadrante data={data} />
        ) : (
          <p className="rounded-lg bg-white p-4 text-sm text-slate-500 shadow-sm">
            Aún no has generado ninguna semana. Elige un lunes arriba y pulsa «Generar semana».
          </p>
        )}
      </main>
    </div>
  );
}
