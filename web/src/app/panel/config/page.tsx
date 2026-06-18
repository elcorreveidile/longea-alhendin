import { redirect } from "next/navigation";
import { getSession, isStaffAdmin } from "@/lib/session";
import { getCurrentTenant } from "@/lib/tenant";
import { getGenConfig, setGenConfig, DEFAULT_GEN } from "@/lib/gen-settings";
import TopBar from "@/components/TopBar";

function num(fd: FormData, key: string, def: number, min = 0, max = 99) {
  const n = Number(fd.get(key));
  if (!Number.isFinite(n)) return def;
  return Math.max(min, Math.min(max, Math.round(n)));
}

async function saveConfigAction(formData: FormData) {
  "use server";
  const tenant = await getCurrentTenant();
  if (!tenant) redirect("/panel/config");
  await setGenConfig(tenant!.id, {
    coverage: {
      M: num(formData, "covM", DEFAULT_GEN.coverage.M),
      T: num(formData, "covT", DEFAULT_GEN.coverage.T),
      N: num(formData, "covN", DEFAULT_GEN.coverage.N),
    },
    maxConsecutive: num(formData, "maxConsec", DEFAULT_GEN.maxConsecutive, 1, 14),
    maxConsecutiveRest: num(formData, "maxRest", DEFAULT_GEN.maxConsecutiveRest, 0, 7),
    restAfterStreak: {
      threshold: num(formData, "streakThreshold", DEFAULT_GEN.restAfterStreak.threshold, 0, 14),
      minRest: num(formData, "streakMinRest", DEFAULT_GEN.restAfterStreak.minRest, 1, 4),
    },
    sundayOff: num(formData, "sundayOff", DEFAULT_GEN.sundayOff, 0, 5),
    supervisorsCountInCoverage: formData.get("supCount") === "on",
  });
  redirect("/panel/config?ok=1");
}

export default async function ConfigPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!isStaffAdmin(session.role)) redirect("/mi-turno");

  const sp = await searchParams;
  const tenant = await getCurrentTenant();
  const cfg = tenant ? await getGenConfig(tenant.id) : DEFAULT_GEN;

  const numCls = "mt-1 w-20 rounded-lg border border-slate-300 px-3 py-2 text-sm";

  return (
    <div className="min-h-screen bg-[#faf6ee]">
      <TopBar name={session.name} role={session.role} tenantName={tenant?.name} logoUrl={tenant?.logoUrl} />
      <main className="mx-auto max-w-2xl space-y-5 p-6">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-800">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icons/icon-reglas.png" alt="" className="h-7 w-7" />Reglas de generación
          </h2>
          <a href="/panel" className="text-sm font-medium text-cyan-700 hover:underline">← Volver al panel</a>
        </div>

        {sp.ok && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
            ✓ Configuración guardada. Se aplicará en la próxima generación.
          </div>
        )}

        <form action={saveConfigAction} className="space-y-6">
          {/* Cobertura */}
          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="font-semibold text-slate-800">Personal por turno (cobertura)</h3>
            <p className="mt-1 text-sm text-slate-500">Cuántas personas tiene que haber cada día en cada turno.</p>
            <div className="mt-3 flex flex-wrap gap-5">
              <label className="text-sm">Mañana
                <input name="covM" type="number" min={0} max={30} defaultValue={cfg.coverage.M} className={numCls} />
              </label>
              <label className="text-sm">Tarde
                <input name="covT" type="number" min={0} max={30} defaultValue={cfg.coverage.T} className={numCls} />
              </label>
              <label className="text-sm">Noche
                <input name="covN" type="number" min={0} max={30} defaultValue={cfg.coverage.N} className={numCls} />
              </label>
            </div>
          </section>

          {/* Descansos */}
          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="font-semibold text-slate-800">Días seguidos y descansos</h3>
            <div className="mt-3 space-y-4">
              <label className="block text-sm">
                Máximo de días seguidos trabajando
                <input name="maxConsec" type="number" min={1} max={14} defaultValue={cfg.maxConsecutive} className={numCls} />
              </label>
              <label className="block text-sm">
                Máximo de descansos seguidos
                <input name="maxRest" type="number" min={0} max={7} defaultValue={cfg.maxConsecutiveRest} className={numCls} />
                <span className="ml-2 text-xs text-slate-400">0 = sin límite. Las vacaciones no cuentan.</span>
              </label>
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-sm font-medium text-slate-700">Descanso tras una racha larga</p>
                <p className="mb-2 text-xs text-slate-500">
                  Para evitar “muchos días seguidos y luego un solo descanso”.
                </p>
                <div className="flex flex-wrap items-end gap-4 text-sm">
                  <label>Tras
                    <input name="streakThreshold" type="number" min={0} max={14} defaultValue={cfg.restAfterStreak.threshold} className={numCls} />
                    <span className="ml-1 text-slate-500">días seguidos</span>
                  </label>
                  <label>dar al menos
                    <input name="streakMinRest" type="number" min={1} max={4} defaultValue={cfg.restAfterStreak.minRest} className={numCls} />
                    <span className="ml-1 text-slate-500">descansos juntos</span>
                  </label>
                </div>
                <p className="mt-1 text-xs text-slate-400">Pon “Tras 0 días” para desactivar esta regla.</p>
              </div>
              <label className="block text-sm">
                Domingos libres al mes (mínimo)
                <input name="sundayOff" type="number" min={0} max={5} defaultValue={cfg.sundayOff} className={numCls} />
              </label>
            </div>
          </section>

          {/* Otros */}
          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" name="supCount" defaultChecked={cfg.supervisorsCountInCoverage}
                className="h-4 w-4 rounded border-slate-300 text-cyan-700 focus:ring-cyan-500" />
              Las supervisoras cuentan en la cobertura de mañana/tarde
            </label>
            <p className="mt-3 text-xs text-slate-400">
              El descanso de 12 h entre turnos y el descanso tras noche son obligatorios por ley y no se desactivan.
            </p>
          </section>

          <button className="rounded-lg bg-cyan-700 px-6 py-2.5 text-sm font-semibold text-white hover:bg-cyan-800">
            Guardar configuración
          </button>
        </form>
      </main>
    </div>
  );
}
