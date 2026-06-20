import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSession, isStaffAdmin } from "@/lib/session";
import { getCurrentTenant } from "@/lib/tenant";
import { requireAcademiaPanel } from "@/lib/panel-guard";
import { listTerms, listSubjects, listGroups, addGroup, deleteGroup, setGroupSchedule } from "@/db/docencia";
import ConfirmButton from "@/components/ConfirmButton";
import TopBar from "@/components/TopBar";

const KINDS = [
  { value: "clase", label: "Clase" },
  { value: "practicas", label: "Prácticas" },
  { value: "vigilancia_examen", label: "Vigilancia de examen" },
  { value: "prueba_nivel", label: "Prueba de nivel" },
  { value: "tutoria", label: "Tutoría (no computa carga)" },
  { value: "otro", label: "Otro" },
];
const KIND_LABEL: Record<string, string> = Object.fromEntries(KINDS.map((k) => [k.value, k.label]));
const WEEKDAYS = ["L", "M", "X", "J", "V"];
const input = "rounded-lg border border-slate-300 px-3 py-2 text-sm";

function hLabel(min: number) {
  return (min / 60).toLocaleString("es-ES", { maximumFractionDigits: 2 });
}

async function addGroupAction(formData: FormData) {
  "use server";
  const session = await getSession();
  if (!session || !isStaffAdmin(session.role)) redirect("/login");
  const tenant = await getCurrentTenant();
  const termId = String(formData.get("termId") ?? "");
  if (!tenant || !termId) redirect("/panel/docencia/grupos");

  const weekdays = WEEKDAYS.filter((d) => formData.get(`wd_${d}`) === "on");
  const start = String(formData.get("start") ?? "");
  const end = String(formData.get("end") ?? "");
  const schedule = weekdays.length && start && end ? [{ weekdays, start, end }] : null;
  const hours = parseFloat(String(formData.get("hours") ?? "0").replace(",", "."));

  await addGroup({
    tenantId: tenant.id, termId,
    subjectId: String(formData.get("subjectId") ?? "") || null,
    groupCode: String(formData.get("groupCode") ?? "").trim() || null,
    kind: String(formData.get("kind") ?? "clase"),
    language: String(formData.get("language") ?? "es"),
    level: String(formData.get("level") ?? "").trim() || null,
    minutes: Number.isFinite(hours) ? Math.round(hours * 60) : 0,
    schedule,
  });
  revalidatePath("/panel/docencia/grupos");
  redirect(`/panel/docencia/grupos?term=${termId}`);
}

async function deleteGroupAction(formData: FormData) {
  "use server";
  const session = await getSession();
  if (!session || !isStaffAdmin(session.role)) redirect("/login");
  const tenant = await getCurrentTenant();
  const id = String(formData.get("id") ?? "");
  const termId = String(formData.get("termId") ?? "");
  if (tenant && id) await deleteGroup(tenant.id, id);
  revalidatePath("/panel/docencia/grupos");
  redirect(`/panel/docencia/grupos?term=${termId}`);
}

async function updateScheduleAction(formData: FormData) {
  "use server";
  const session = await getSession();
  if (!session || !isStaffAdmin(session.role)) redirect("/login");
  const tenant = await getCurrentTenant();
  const id = String(formData.get("id") ?? "");
  const termId = String(formData.get("termId") ?? "");
  const weekdays = WEEKDAYS.filter((d) => formData.get(`wd_${d}`) === "on");
  const start = String(formData.get("start") ?? "");
  const end = String(formData.get("end") ?? "");
  const schedule = weekdays.length && start && end ? [{ weekdays, start, end }] : null;
  if (tenant && id) await setGroupSchedule(tenant.id, id, schedule);
  revalidatePath("/panel/docencia/grupos");
  redirect(`/panel/docencia/grupos?term=${termId}`);
}

type SchedBlock = { weekdays?: string[]; start?: string; end?: string };
function scheduleText(schedule: unknown): string {
  if (!Array.isArray(schedule) || schedule.length === 0) return "—";
  return (schedule as SchedBlock[]).map((b) => `${(b.weekdays ?? []).join("")} ${b.start ?? ""}–${b.end ?? ""}`).join(" · ");
}
function firstBlock(schedule: unknown): SchedBlock {
  return Array.isArray(schedule) && schedule[0] ? (schedule[0] as SchedBlock) : {};
}

export default async function GruposPage({ searchParams }: { searchParams: Promise<{ term?: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!isStaffAdmin(session.role)) redirect("/mi-turno");
  await requireAcademiaPanel();
  const tenant = await getCurrentTenant();

  const [terms, subjects] = tenant ? await Promise.all([listTerms(tenant.id), listSubjects(tenant.id)]) : [[], []];
  const sp = await searchParams;
  const termId = sp.term && terms.some((t) => t.id === sp.term) ? sp.term : terms[0]?.id;
  const groups = tenant && termId ? await listGroups(tenant.id, termId) : [];

  return (
    <div className="min-h-screen bg-[#faf6ee]">
      <TopBar name={session.name} role={session.role} tenantName={tenant?.name} logoUrl={tenant?.logoUrl} />
      <main className="mx-auto max-w-[1100px] space-y-6 p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900">Grupos / plazas</h1>
          <a href="/panel/docencia" className="text-sm font-medium text-cyan-700 hover:underline">← Docencia</a>
        </div>

        {terms.length === 0 ? (
          <p className="rounded-xl border border-[#e7dcc4] bg-white p-5 text-sm text-slate-500 shadow-sm">
            Crea antes una <a href="/panel/docencia/programas" className="text-cyan-700 underline">edición</a>.
          </p>
        ) : (
          <>
            <form method="get" className="flex items-end gap-2">
              <label className="text-sm">Edición
                <select name="term" defaultValue={termId} className={`${input} mt-1 block`}>
                  {terms.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </label>
              <button className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Ver</button>
            </form>

            <section className="rounded-xl border border-[#e7dcc4] bg-white p-5 shadow-sm">
              <h2 className="font-semibold text-slate-800">Añadir plaza</h2>
              <form action={addGroupAction} className="mt-3 space-y-3">
                <input type="hidden" name="termId" value={termId} />
                <div className="flex flex-wrap items-end gap-3">
                  <label className="text-sm">Asignatura
                    <select name="subjectId" className={`${input} mt-1 block`}><option value="">— (sin asignatura)</option>{subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
                  </label>
                  <label className="text-sm">Grupo<input name="groupCode" placeholder="0A01" className={`${input} mt-1 block w-24`} /></label>
                  <label className="text-sm">Tipo
                    <select name="kind" className={`${input} mt-1 block`}>{KINDS.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}</select>
                  </label>
                  <label className="text-sm">Idioma
                    <select name="language" className={`${input} mt-1 block`}><option value="es">Español</option><option value="en">Inglés</option></select>
                  </label>
                  <label className="text-sm">Nivel<input name="level" placeholder="B2" className={`${input} mt-1 block w-20`} /></label>
                  <label className="text-sm">Horas<input name="hours" type="number" step="0.25" min="0" placeholder="45" className={`${input} mt-1 block w-24`} /></label>
                </div>
                <div className="flex flex-wrap items-end gap-3">
                  <fieldset className="text-sm">
                    <span className="block text-slate-600">Días</span>
                    <div className="mt-1 flex gap-2">
                      {WEEKDAYS.map((d) => (
                        <label key={d} className="flex items-center gap-1 rounded border border-slate-300 px-2 py-1.5">
                          <input type="checkbox" name={`wd_${d}`} className="h-4 w-4" />{d}
                        </label>
                      ))}
                    </div>
                  </fieldset>
                  <label className="text-sm">Desde<input name="start" type="time" className={`${input} mt-1 block`} /></label>
                  <label className="text-sm">Hasta<input name="end" type="time" className={`${input} mt-1 block`} /></label>
                  <button className="rounded-lg bg-cyan-700 px-5 py-2 text-sm font-semibold text-white hover:bg-cyan-800">Añadir plaza</button>
                </div>
              </form>
            </section>

            <section className="overflow-x-auto rounded-xl border border-[#e7dcc4] bg-white shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-4 py-3">Grupo</th><th className="px-3 py-3">Asignatura</th><th className="px-3 py-3">Tipo</th><th className="px-3 py-3">Idioma</th><th className="px-3 py-3">Horas</th><th className="px-3 py-3">Horario</th><th className="px-3 py-3">Estado</th><th className="px-3 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {groups.map((g) => (
                    <tr key={g.id} className="border-b border-slate-100">
                      <td className="px-4 py-2 font-medium text-slate-800">{g.groupCode ?? "—"}</td>
                      <td className="px-3 py-2 text-slate-600">{g.subjectName ?? "—"}</td>
                      <td className="px-3 py-2 text-slate-500">{KIND_LABEL[g.kind] ?? g.kind}</td>
                      <td className="px-3 py-2 text-slate-500">{g.language === "en" ? "Inglés" : "Español"}</td>
                      <td className="px-3 py-2 tabular-nums text-slate-600">{hLabel(g.minutes)}</td>
                      <td className="px-3 py-2 text-slate-500">
                        <details>
                          <summary className="cursor-pointer list-none">
                            <span className="rounded border border-slate-200 px-1.5 py-0.5 text-xs hover:bg-slate-50">{scheduleText(g.schedule)} ✎</span>
                          </summary>
                          {(() => {
                            const fb = firstBlock(g.schedule);
                            return (
                              <form action={updateScheduleAction} className="mt-2 space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-2">
                                <input type="hidden" name="id" value={g.id} />
                                <input type="hidden" name="termId" value={termId} />
                                <div className="flex flex-wrap gap-1">
                                  {WEEKDAYS.map((d) => (
                                    <label key={d} className="flex items-center gap-1 rounded border border-slate-300 bg-white px-1.5 py-1 text-xs">
                                      <input type="checkbox" name={`wd_${d}`} defaultChecked={(fb.weekdays ?? []).includes(d)} className="h-3.5 w-3.5" />{d}
                                    </label>
                                  ))}
                                </div>
                                <div className="flex items-center gap-1">
                                  <input name="start" type="time" defaultValue={fb.start ?? ""} className="rounded border border-slate-300 px-1.5 py-1 text-xs" />
                                  <span className="text-xs text-slate-400">–</span>
                                  <input name="end" type="time" defaultValue={fb.end ?? ""} className="rounded border border-slate-300 px-1.5 py-1 text-xs" />
                                  <button className="ml-1 rounded bg-cyan-700 px-2 py-1 text-xs font-semibold text-white hover:bg-cyan-800">Guardar</button>
                                </div>
                                <p className="text-[10px] text-slate-400">Vacía los días para quitar el horario.</p>
                              </form>
                            );
                          })()}
                        </details>
                      </td>
                      <td className="px-3 py-2"><span className="rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-800">{g.status === "sin_asignar" ? "Sin asignar" : g.status}</span></td>
                      <td className="px-3 py-2 text-right">
                        <form action={deleteGroupAction}>
                          <input type="hidden" name="id" value={g.id} />
                          <input type="hidden" name="termId" value={termId} />
                          <ConfirmButton confirm="¿Borrar esta plaza?" className="rounded border border-red-200 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50">Borrar</ConfirmButton>
                        </form>
                      </td>
                    </tr>
                  ))}
                  {groups.length === 0 && <tr><td colSpan={8} className="px-4 py-6 text-center text-sm text-slate-400">Sin plazas en esta edición.</td></tr>}
                </tbody>
              </table>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
