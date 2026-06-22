import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSession, isStaffAdmin } from "@/lib/session";
import { getCurrentTenant } from "@/lib/tenant";
import { getTenantKind } from "@/lib/tenant-kind";
import { getTeacherProfile, listHourEntries, addHourEntry, voidOwnDeclared } from "@/db/teachers";
import { listGroupsForTeacher, listAbsences, addAbsence, deleteAbsence } from "@/db/docencia";
import { listMessagesForRecipient } from "@/db/staff-messages";
import { HOUR_CONCEPTS, conceptLabel, courseYearStart, courseYearLabel } from "@/data/hour-concepts";
import ConfirmButton from "@/components/ConfirmButton";
import DownloadJustificante from "@/components/DownloadJustificante";
import { DocenciaSecciones, SeccionAcademica, ABSENCE_KINDS, ABSENCE_LABEL, ABSENCE_STATUS, ABSENCE_BAND } from "@/components/FichaAcademica";
import WeeklyTimetable from "@/components/WeeklyTimetable";
import HoursPicker from "@/components/HoursPicker";
import TopBar from "@/components/TopBar";
import VersionFooter from "@/components/VersionFooter";

const STATUS: Record<string, { label: string; cls: string }> = {
  declared: { label: "Declarada", cls: "bg-amber-100 text-amber-800" },
  confirmed: { label: "Confirmada", cls: "bg-emerald-100 text-emerald-800" },
  locked: { label: "Cerrada", cls: "bg-slate-200 text-slate-600" },
  voided: { label: "Anulada", cls: "bg-red-50 text-red-400 line-through" },
};

function h(min: number): string {
  return (min / 60).toLocaleString("es-ES", { maximumFractionDigits: 2 });
}
function hoursToMin(v: string): number {
  return Math.round(parseFloat(v.replace(",", ".")) * 60);
}
function fmtDate(d: string): string {
  return new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(d));
}

async function declareAction(formData: FormData) {
  "use server";
  const session = await getSession();
  if (!session?.workerId) redirect("/login");
  const tenant = await getCurrentTenant();
  const workDate = String(formData.get("workDate") ?? "");
  const minutes = hoursToMin(String(formData.get("hours") ?? "0"));
  const concept = String(formData.get("concept") ?? "clase");
  const note = String(formData.get("note") ?? "").trim();
  if (tenant && workDate && minutes > 0) {
    await addHourEntry({
      tenantId: tenant.id,
      workerId: session.workerId,
      workDate,
      minutes,
      concept,
      note: note || null,
      createdByUserId: session.userId,
    });
  }
  revalidatePath("/mis-horas");
  redirect("/mis-horas");
}

async function addMyAbsenceAction(formData: FormData) {
  "use server";
  const session = await getSession();
  if (!session?.workerId) redirect("/login");
  const tenant = await getCurrentTenant();
  const start = String(formData.get("start") ?? "");
  const end = String(formData.get("end") ?? "");
  if (tenant && /^\d{4}-\d{2}-\d{2}$/.test(start) && /^\d{4}-\d{2}-\d{2}$/.test(end) && end >= start) {
    await addAbsence({
      tenantId: tenant.id, workerId: session.workerId, kind: String(formData.get("kind") ?? "vacaciones"),
      startDate: start, endDate: end, note: String(formData.get("note") ?? "").trim() || null,
      createdByUserId: session.userId, status: "solicitada",
    });
  }
  revalidatePath("/mis-horas");
  redirect("/mis-horas");
}

async function deleteMyAbsenceAction(formData: FormData) {
  "use server";
  const session = await getSession();
  if (!session?.workerId) redirect("/login");
  const tenant = await getCurrentTenant();
  const id = String(formData.get("id") ?? "");
  // El profesor solo puede retirar una solicitud SUYA aún pendiente.
  if (tenant && id) await deleteAbsence(tenant.id, id, { workerId: session.workerId, onlyPending: true });
  revalidatePath("/mis-horas");
  redirect("/mis-horas");
}

async function voidMineAction(formData: FormData) {
  "use server";
  const session = await getSession();
  if (!session?.workerId) redirect("/login");
  const id = String(formData.get("id") ?? "");
  if (id) await voidOwnDeclared(id, session.workerId);
  revalidatePath("/mis-horas");
  redirect("/mis-horas");
}

export default async function MisHorasPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const tenant = await getCurrentTenant();
  // Solo para academias; en residencia el portal del trabajador es "Mi turno".
  if (!tenant || (await getTenantKind(tenant.id)) !== "academia") redirect("/mi-turno");

  const workerId = session.workerId;
  const profile = workerId ? await getTeacherProfile(workerId) : null;
  const startYear = courseYearStart(new Date());
  const entries = workerId ? await listHourEntries(tenant.id, workerId, startYear) : [];

  const target = profile?.annualTargetMin ?? 0;
  const reduction = profile?.reductionMin ?? 0;
  const net = Math.max(target - reduction, 0);
  const valid = entries.filter((e) => e.status !== "voided");
  const done = valid.reduce((a, e) => a + e.minutes, 0);
  const rest = net - done;
  const today = new Date().toISOString().slice(0, 10);

  const byConcept = HOUR_CONCEPTS.map((c) => ({
    label: c.label,
    min: valid.filter((e) => e.concept === c.value).reduce((a, e) => a + e.minutes, 0),
  })).filter((c) => c.min > 0);

  const groups = workerId ? await listGroupsForTeacher(tenant.id, workerId) : [];
  const absences = workerId ? await listAbsences(tenant.id, workerId) : [];
  const messages = session.email ? await listMessagesForRecipient(tenant.id, session.email) : [];
  const pct = net > 0 ? Math.min(100, Math.round((done / net) * 100)) : 0;
  const fmtDateTime = (d: Date) =>
    new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(d);

  const justi = {
    empresa: tenant.name,
    teacher: session.name ?? "",
    courseLabel: courseYearLabel(startYear),
    targetH: h(target),
    reductionH: h(reduction),
    netH: h(net),
    doneH: h(done),
    restH: h(rest),
    byConcept: byConcept.map((c) => ({ label: c.label, hours: h(c.min) })),
    rows: valid.map((e) => ({
      date: fmtDate(e.workDate),
      hours: h(e.minutes),
      concept: conceptLabel(e.concept),
      status: STATUS[e.status].label,
    })),
  };

  return (
    <div className="min-h-screen bg-[#faf6ee]">
      <TopBar name={session.name} role={session.role} tenantName={tenant.name} logoUrl={tenant.logoUrl} />
      <main className="mx-auto max-w-3xl space-y-5 p-4 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Mis horas</h1>
            <p className="text-sm text-slate-500">Curso {courseYearLabel(startYear)} (octubre–septiembre).</p>
          </div>
          {workerId && <DownloadJustificante data={justi} />}
        </div>

        {!workerId ? (
          <section className="space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
            <p>Tu cuenta todavía no está vinculada a una ficha de profesor.</p>
            {isStaffAdmin(session.role) ? (
              <p>
                Vincúlala en{" "}
                <a href="/panel/accesos" className="font-semibold text-cyan-700 underline">Accesos del profesorado</a>: asigna el
                correo del profesor a su ficha y entra con ese correo.
              </p>
            ) : (
              <p>Avisa a administración para que la vinculen.</p>
            )}
          </section>
        ) : (
          <>
            <section className="grid gap-3 sm:grid-cols-3">
              {[
                { l: "A hacer (curso)", v: h(net), c: "text-slate-900" },
                { l: "Hechas", v: h(done), c: "text-cyan-700" },
                { l: "Restante", v: h(rest), c: rest > 0 ? "text-amber-700" : "text-emerald-700" },
              ].map((b) => (
                <div key={b.l} className="rounded-xl border border-[#e7dcc4] bg-white p-4 text-center shadow-sm">
                  <p className={`text-3xl font-extrabold ${b.c}`}>{b.v}</p>
                  <p className="mt-1 text-xs text-slate-500">{b.l}</p>
                </div>
              ))}
            </section>

            <section className="rounded-xl border border-[#e7dcc4] bg-white p-4 shadow-sm">
              <div className="mb-1 flex items-baseline justify-between text-sm">
                <span className="font-medium text-slate-700">Progreso del objetivo</span>
                <span className="font-bold text-cyan-700">{pct}%</span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full ${rest > 0 ? "bg-cyan-600" : "bg-emerald-600"}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-slate-400">
                {h(done)} h de {h(net)} h{rest > 0 ? ` · te faltan ${h(rest)} h` : " · objetivo cumplido 🎉"}
              </p>
            </section>

            {/* Mi horario semanal (real u orientativo) */}
            <SeccionAcademica title="Mi horario semanal">
              <WeeklyTimetable groups={groups} />
            </SeccionAcademica>

            {/* Mi docencia (clases, tutorías, pruebas de nivel, vigilancias) */}
            <DocenciaSecciones groups={groups} />

            {/* Comunicaciones recibidas de la dirección del centro */}
            <SeccionAcademica title="Comunicaciones recibidas">
              {messages.length === 0 ? (
                <p className="font-serif text-sm text-slate-500">No tienes comunicaciones de la dirección este curso.</p>
              ) : (
                <div className="space-y-2">
                  {messages.map((m) => (
                    <details key={m.id} className="rounded-lg border border-slate-200 p-3">
                      <summary className="cursor-pointer text-sm">
                        <span className="font-medium text-slate-800">{m.subject}</span>
                        <span className="ml-2 text-xs text-slate-400">{fmtDateTime(new Date(m.createdAt))} · {m.senderName}</span>
                      </summary>
                      <p className="mt-2 whitespace-pre-wrap rounded bg-slate-50 p-2 text-sm text-slate-700">{m.body}</p>
                    </details>
                  ))}
                </div>
              )}
            </SeccionAcademica>

            {/* Mis ausencias y permisos (solicitud → subdirección aprueba) */}
            <SeccionAcademica title="Mis ausencias y permisos">
              {absences.length === 0 ? (
                <p className="font-serif text-sm text-slate-500">No has avisado de ninguna ausencia este curso.</p>
              ) : (
                <ul className="mb-3 space-y-1.5">
                  {absences.map((a) => {
                    const st = ABSENCE_STATUS[a.status] ?? ABSENCE_STATUS.aprobada;
                    return (
                      <li key={a.id}>
                        <div className={`flex flex-wrap items-center justify-between gap-2 rounded-xl px-3 py-2.5 ${ABSENCE_BAND[a.kind] ?? "bg-slate-100 text-slate-700"}`}>
                          <div className="min-w-0">
                            <span className="text-sm font-semibold">{ABSENCE_LABEL[a.kind] ?? a.kind}</span>
                            <span className="ml-2 text-sm opacity-80">{fmtDate(a.startDate)} → {fmtDate(a.endDate)}</span>
                            {a.note ? <span className="text-sm opacity-60"> · {a.note}</span> : null}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`rounded px-2 py-0.5 text-xs font-medium ${st.cls}`}>{st.label}</span>
                            {a.status === "solicitada" && (
                              <form action={deleteMyAbsenceAction}>
                                <input type="hidden" name="id" value={a.id} />
                                <ConfirmButton confirm="¿Retirar esta solicitud de ausencia?" className="rounded border border-slate-300/60 bg-white/60 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-white">Retirar</ConfirmButton>
                              </form>
                            )}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
              <form action={addMyAbsenceAction} className="flex flex-wrap items-end gap-3">
                <label className="text-sm">Tipo
                  <select name="kind" className="mt-1 block rounded-lg border border-slate-300 px-3 py-2 text-sm">
                    {ABSENCE_KINDS.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}
                  </select>
                </label>
                <label className="text-sm">Desde<input type="date" name="start" required className="mt-1 block rounded-lg border border-slate-300 px-3 py-2 text-sm" /></label>
                <label className="text-sm">Hasta<input type="date" name="end" required className="mt-1 block rounded-lg border border-slate-300 px-3 py-2 text-sm" /></label>
                <label className="text-sm">Nota<input name="note" placeholder="opcional" className="mt-1 block rounded-lg border border-slate-300 px-3 py-2 text-sm" /></label>
                <button className="rounded-lg bg-cyan-700 px-5 py-2 text-sm font-semibold text-white hover:bg-cyan-800">Avisar (solicitar)</button>
              </form>
              <p className="mt-2 text-xs text-slate-400">Avisas de la ausencia y subdirección la aprueba o la rechaza. Puedes retirar una solicitud mientras esté pendiente.</p>
            </SeccionAcademica>

            <section className="rounded-xl border border-[#e7dcc4] bg-white p-5 shadow-sm">
              <h2 className="font-semibold text-slate-800">Declarar horas</h2>
              <p className="mt-1 text-xs text-slate-500">Lo que declares queda con sello de fecha y pendiente de confirmación por subdirección.</p>
              <form action={declareAction} className="mt-3 space-y-4">
                <div className="flex flex-wrap items-end gap-3">
                  <label className="text-sm">
                    <span className="block text-slate-600">Fecha</span>
                    <input type="date" name="workDate" defaultValue={today} required className="mt-1 block rounded-lg border border-slate-300 px-2 py-2 text-sm" />
                  </label>
                  <label className="text-sm">
                    <span className="block text-slate-600">Concepto</span>
                    <select name="concept" className="mt-1 block rounded-lg border border-slate-300 px-2 py-2 text-sm">
                      {HOUR_CONCEPTS.map((c) => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                  </label>
                  <label className="flex-1 text-sm">
                    <span className="block text-slate-600">Nota</span>
                    <input name="note" placeholder="opcional" className="mt-1 block w-full rounded-lg border border-slate-300 px-2 py-2 text-sm" />
                  </label>
                </div>
                <div className="text-sm">
                  <span className="block text-slate-600">Horas</span>
                  <div className="mt-1"><HoursPicker /></div>
                </div>
                <button className="rounded-lg bg-cyan-700 px-5 py-2 text-sm font-semibold text-white hover:bg-cyan-800">Declarar</button>
              </form>
            </section>

            <section className="overflow-x-auto rounded-xl border border-[#e7dcc4] bg-white shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-4 py-3">Fecha</th>
                    <th className="px-3 py-3 text-right">Horas</th>
                    <th className="px-3 py-3">Concepto</th>
                    <th className="px-3 py-3">Estado</th>
                    <th className="px-3 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((e) => {
                    const st = STATUS[e.status];
                    return (
                      <tr key={e.id} className="border-b border-slate-100">
                        <td className="px-4 py-2 text-slate-700">{fmtDate(e.workDate)}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{h(e.minutes)}</td>
                        <td className="px-3 py-2 text-slate-600">{conceptLabel(e.concept)}{e.note ? ` · ${e.note}` : ""}</td>
                        <td className="px-3 py-2"><span className={`rounded px-2 py-0.5 text-xs font-medium ${st.cls}`}>{st.label}</span></td>
                        <td className="px-3 py-2 text-right">
                          {e.status === "declared" && (
                            <form action={voidMineAction}>
                              <input type="hidden" name="id" value={e.id} />
                              <ConfirmButton confirm="¿Anular este apunte que has declarado?" className="rounded border border-red-200 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50">Anular</ConfirmButton>
                            </form>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {entries.length === 0 && (
                    <tr><td colSpan={5} className="px-4 py-6 text-center text-sm text-slate-500">Aún no has declarado horas este curso.</td></tr>
                  )}
                </tbody>
              </table>
            </section>
          </>
        )}
      </main>
      <VersionFooter />
    </div>
  );
}
