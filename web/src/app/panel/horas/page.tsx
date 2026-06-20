import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { getSession, isStaffAdmin } from "@/lib/session";
import { getCurrentTenant } from "@/lib/tenant";
import { requireAcademiaPanel } from "@/lib/panel-guard";
import { db } from "@/db";
import { workers } from "@/db/schema";
import { listTeachers, upsertTeacherProfile, lockCourse } from "@/db/teachers";
import { getStaffRole } from "@/lib/staff-roles";
import { courseYearStart, courseYearLabel } from "@/data/hour-concepts";
import { ACENTOS_DEMO_ROSTER } from "@/data/acentos-demo-roster";
import ConfirmButton from "@/components/ConfirmButton";
import TopBar from "@/components/TopBar";

const MSG: Record<string, { ok: boolean; text: string }> = {
  cargado: { ok: true, text: "✓ Profesorado de ejemplo cargado." },
  yaexiste: { ok: false, text: "Ya hay profesorado cargado; vacíalo antes de recargar." },
  cerrado: { ok: true, text: "✓ Curso cerrado: las horas quedan bloqueadas." },
  vaciado: { ok: true, text: "✓ Profesorado de prueba vaciado. Puedes volver a cargarlo." },
  noperm: { ok: false, text: "La Secretaría de Dirección no puede cerrar cursos." },
};

const AVAIL: Record<string, string> = { both: "Mañana y tarde", morning: "Solo mañana", afternoon: "Solo tarde" };

/** Minutos → horas con hasta 2 decimales, formato español. */
function h(min: number): string {
  return (min / 60).toLocaleString("es-ES", { maximumFractionDigits: 2 });
}

async function loadDemoAction() {
  "use server";
  const session = await getSession();
  if (!session || !isStaffAdmin(session.role)) redirect("/login");
  const tenant = await getCurrentTenant();
  if (!tenant) redirect("/panel/horas");
  const existing = await listTeachers(tenant.id, courseYearStart(new Date()));
  if (existing.length > 0) redirect("/panel/horas?m=yaexiste");
  for (const t of ACENTOS_DEMO_ROSTER) {
    const [w] = await db.insert(workers).values({ tenantId: tenant.id, name: t.name }).returning();
    await upsertTeacherProfile({
      workerId: w.id,
      tenantId: tenant.id,
      annualTargetMin: t.targetMin,
      reductionMin: t.reductionMin,
      reductionType: t.reductionType || null,
      availability: t.availability,
      notes: t.notes || null,
    });
  }
  revalidatePath("/panel/horas");
  redirect("/panel/horas?m=cargado");
}

async function clearDemoAction() {
  "use server";
  const session = await getSession();
  if (!session || !isStaffAdmin(session.role)) redirect("/login");
  const tenant = await getCurrentTenant();
  if (tenant) await db.delete(workers).where(eq(workers.tenantId, tenant.id));
  revalidatePath("/panel/horas");
  redirect("/panel/horas?m=vaciado");
}

async function lockCourseAction(formData: FormData) {
  "use server";
  const session = await getSession();
  if (!session || !isStaffAdmin(session.role)) redirect("/login");
  const tenant = await getCurrentTenant();
  const startYear = Number(formData.get("curso"));
  // La Secretaría de Dirección no puede cerrar cursos.
  if ((await getStaffRole(session.userId)) === "secretaria") redirect("/panel/horas?m=noperm");
  if (tenant && startYear) await lockCourse(tenant.id, startYear);
  revalidatePath("/panel/horas");
  redirect(`/panel/horas?curso=${startYear}&m=cerrado`);
}

export default async function HorasPage({
  searchParams,
}: {
  searchParams: Promise<{ curso?: string; m?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!isStaffAdmin(session.role)) redirect("/mi-turno");
  await requireAcademiaPanel();

  const tenant = await getCurrentTenant();
  const isSecretaria = (await getStaffRole(session.userId)) === "secretaria";
  const sp = await searchParams;
  const msg = sp.m ? MSG[sp.m] : null;

  const nowStart = courseYearStart(new Date());
  const startYear = sp.curso ? Number(sp.curso) : nowStart;
  const teachers = tenant ? await listTeachers(tenant.id, startYear) : [];

  // Totales
  const tot = teachers.reduce(
    (a, t) => {
      const target = t.profile?.annualTargetMin ?? 0;
      const red = t.profile?.reductionMin ?? 0;
      const net = Math.max(target - red, 0);
      a.net += net;
      a.done += t.doneMin;
      a.rest += net - t.doneMin;
      a.pending += t.pending;
      return a;
    },
    { net: 0, done: 0, rest: 0, pending: 0 },
  );

  const years = [nowStart + 1, nowStart, nowStart - 1, nowStart - 2];

  return (
    <div className="min-h-screen bg-[#faf6ee]">
      <TopBar name={session.name} role={session.role} tenantName={tenant?.name} logoUrl={tenant?.logoUrl} />
      <main className="mx-auto max-w-[1200px] space-y-5 p-6">
        <div className="flex flex-wrap justify-end gap-2 print:hidden">
          <a
            href="/panel/roles"
            className="flex items-center gap-2 rounded-xl border border-[#e7dcc4] bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:-translate-y-0.5 hover:shadow"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icons/icon-acceso.png" alt="" className="h-6 w-6" />
            Roles del centro
          </a>
          <a
            href="/panel/correos"
            className="flex items-center gap-2 rounded-xl border border-[#e7dcc4] bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:-translate-y-0.5 hover:shadow"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icons/icon-acceso.png" alt="" className="h-6 w-6" />
            Escribir al profesorado
          </a>
          <a
            href="/panel/docencia"
            className="flex items-center gap-2 rounded-xl border border-[#e7dcc4] bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:-translate-y-0.5 hover:shadow"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icons/icon-plantilla.png" alt="" className="h-6 w-6" />
            Docencia (reparto)
          </a>
          <a
            href="/panel/accesos"
            className="flex items-center gap-2 rounded-xl border border-[#e7dcc4] bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:-translate-y-0.5 hover:shadow"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icons/icon-acceso.png" alt="" className="h-6 w-6" />
            Accesos del profesorado
          </a>
        </div>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Control de horas</h1>
            <p className="text-sm text-slate-500">
              Profesorado · curso {courseYearLabel(startYear)} (octubre–septiembre).
            </p>
          </div>
          <form method="get" className="flex items-end gap-2">
            <label className="text-sm">
              <span className="block text-slate-600">Curso</span>
              <select
                name="curso"
                defaultValue={String(startYear)}
                className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                {years.map((y) => (
                  <option key={y} value={y}>{courseYearLabel(y)}</option>
                ))}
              </select>
            </label>
            <button className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              Ver
            </button>
          </form>
        </div>

        {msg && (
          <p className={`rounded-lg p-3 text-sm ${msg.ok ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"}`}>
            {msg.text}
          </p>
        )}

        {teachers.length === 0 ? (
          <section className="rounded-xl border border-[#e7dcc4] bg-white p-8 text-center shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">Aún no hay profesorado</h2>
            <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
              Carga la plantilla de profesorado para empezar a llevar el control de horas.
            </p>
            <form action={loadDemoAction} className="mt-4">
              <button className="rounded-lg bg-cyan-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-cyan-800">
                Cargar profesorado de ejemplo ({ACENTOS_DEMO_ROSTER.length})
              </button>
            </form>
          </section>
        ) : (
          <section className="overflow-x-auto rounded-xl border border-[#e7dcc4] bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3">Profesor/a</th>
                  <th className="px-3 py-3 text-right">Objetivo</th>
                  <th className="px-3 py-3 text-right">Reducción</th>
                  <th className="px-3 py-3">Tipo</th>
                  <th className="px-3 py-3 text-right">A hacer</th>
                  <th className="px-3 py-3 text-right">Hechas</th>
                  <th className="px-3 py-3 text-right">Restante</th>
                  <th className="px-3 py-3 text-center">Pendientes</th>
                  <th className="px-3 py-3">Disponib.</th>
                </tr>
              </thead>
              <tbody>
                {teachers.map((t) => {
                  const target = t.profile?.annualTargetMin ?? 0;
                  const red = t.profile?.reductionMin ?? 0;
                  const net = Math.max(target - red, 0);
                  const rest = net - t.doneMin;
                  return (
                    <tr key={t.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-2 font-medium text-slate-800">
                        <a href={`/panel/horas/${t.id}`} className="hover:text-cyan-700 hover:underline">{t.name}</a>
                        {t.profile?.notes === "Sustituto/a" && (
                          <span className="ml-2 rounded bg-violet-100 px-1.5 py-0.5 text-[10px] font-medium text-violet-700">Sustituto/a</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">{h(target)}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{red ? h(red) : "—"}</td>
                      <td className="px-3 py-2 text-slate-500">{t.profile?.reductionType || "—"}</td>
                      <td className="px-3 py-2 text-right tabular-nums font-medium">{h(net)}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{h(t.doneMin)}</td>
                      <td className={`px-3 py-2 text-right tabular-nums font-semibold ${rest > 0 ? "text-amber-700" : "text-emerald-700"}`}>
                        {h(rest)}
                      </td>
                      <td className="px-3 py-2 text-center">
                        {t.pending > 0 ? (
                          <a href={`/panel/horas/${t.id}`} className="inline-block rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800 hover:bg-amber-200" title="Apuntes declarados sin confirmar">
                            {t.pending}
                          </a>
                        ) : (
                          <span className="text-xs text-slate-300">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-xs text-slate-500">{AVAIL[t.profile?.availability ?? "both"]}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-200 bg-slate-50 font-semibold text-slate-700">
                  <td className="px-4 py-3">Totales ({teachers.length})</td>
                  <td />
                  <td />
                  <td />
                  <td className="px-3 py-3 text-right tabular-nums">{h(tot.net)}</td>
                  <td className="px-3 py-3 text-right tabular-nums">{h(tot.done)}</td>
                  <td className="px-3 py-3 text-right tabular-nums">{h(tot.rest)}</td>
                  <td className="px-3 py-3 text-center tabular-nums">{tot.pending || ""}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </section>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-slate-400">
            Las horas las declara cada profesor desde su portal; subdirección las confirma. Cómputo del curso académico (oct–sept).
          </p>
          {teachers.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <form action={clearDemoAction}>
                <ConfirmButton
                  confirm="¿Vaciar todo el profesorado de prueba? Se borran sus fichas y apuntes (datos de prueba)."
                  className="rounded-lg border border-red-200 px-4 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                >
                  Vaciar profesorado de prueba
                </ConfirmButton>
              </form>
              {!isSecretaria && (
                <form action={lockCourseAction}>
                  <input type="hidden" name="curso" value={startYear} />
                  <ConfirmButton
                    confirm={`¿Cerrar el curso ${courseYearLabel(startYear)}? Las horas quedarán bloqueadas (no editables).`}
                    className="rounded-lg border border-slate-300 px-4 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Cerrar curso {courseYearLabel(startYear)}
                  </ConfirmButton>
                </form>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
