import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { getSession, isStaffAdmin } from "@/lib/session";
import { getCurrentTenant } from "@/lib/tenant";
import { requireAcademiaPanel } from "@/lib/panel-guard";
import { db } from "@/db";
import { workers } from "@/db/schema";
import {
  getTeacherProfile,
  listHourEntries,
  addHourEntry,
  confirmHourEntry,
  voidHourEntry,
  upsertTeacherProfile,
} from "@/db/teachers";
import { HOUR_CONCEPTS, conceptLabel, courseYearStart, courseYearLabel } from "@/data/hour-concepts";
import ConfirmButton from "@/components/ConfirmButton";
import TopBar from "@/components/TopBar";

const STATUS: Record<string, { label: string; cls: string }> = {
  declared: { label: "Declarada", cls: "bg-amber-100 text-amber-800" },
  confirmed: { label: "Confirmada", cls: "bg-emerald-100 text-emerald-800" },
  locked: { label: "Cerrada", cls: "bg-slate-200 text-slate-600" },
  voided: { label: "Anulada", cls: "bg-red-50 text-red-400 line-through" },
};
const AVAIL: Record<string, string> = { both: "Mañana y tarde", morning: "Solo mañana", afternoon: "Solo tarde" };

function h(min: number): string {
  return (min / 60).toLocaleString("es-ES", { maximumFractionDigits: 2 });
}
function hoursToMin(v: string): number {
  return Math.round(parseFloat(v.replace(",", ".")) * 60);
}
function fmtDate(d: string): string {
  return new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(d));
}

async function addEntryAction(formData: FormData) {
  "use server";
  const session = await getSession();
  if (!session || !isStaffAdmin(session.role)) redirect("/login");
  const tenant = await getCurrentTenant();
  const workerId = String(formData.get("workerId") ?? "");
  const workDate = String(formData.get("workDate") ?? "");
  const hours = String(formData.get("hours") ?? "");
  const concept = String(formData.get("concept") ?? "clase");
  const note = String(formData.get("note") ?? "").trim();
  const minutes = hoursToMin(hours);
  if (tenant && workerId && workDate && minutes > 0) {
    await addHourEntry({
      tenantId: tenant.id,
      workerId,
      workDate,
      minutes,
      concept,
      note: note || null,
      createdByUserId: session.userId,
    });
  }
  revalidatePath(`/panel/horas/${workerId}`);
  redirect(`/panel/horas/${workerId}`);
}

async function confirmAction(formData: FormData) {
  "use server";
  const session = await getSession();
  if (!session || !isStaffAdmin(session.role)) redirect("/login");
  const id = String(formData.get("id") ?? "");
  const workerId = String(formData.get("workerId") ?? "");
  if (id) await confirmHourEntry(id, session.userId);
  revalidatePath(`/panel/horas/${workerId}`);
  redirect(`/panel/horas/${workerId}`);
}

async function voidAction(formData: FormData) {
  "use server";
  const session = await getSession();
  if (!session || !isStaffAdmin(session.role)) redirect("/login");
  const id = String(formData.get("id") ?? "");
  const workerId = String(formData.get("workerId") ?? "");
  if (id) await voidHourEntry(id);
  revalidatePath(`/panel/horas/${workerId}`);
  redirect(`/panel/horas/${workerId}`);
}

async function saveProfileAction(formData: FormData) {
  "use server";
  const session = await getSession();
  if (!session || !isStaffAdmin(session.role)) redirect("/login");
  const tenant = await getCurrentTenant();
  const workerId = String(formData.get("workerId") ?? "");
  if (tenant && workerId) {
    await upsertTeacherProfile({
      workerId,
      tenantId: tenant.id,
      annualTargetMin: hoursToMin(String(formData.get("target") ?? "0")),
      reductionMin: hoursToMin(String(formData.get("reduction") ?? "0")),
      reductionType: String(formData.get("reductionType") ?? "").trim() || null,
      availability: String(formData.get("availability") ?? "both"),
    });
  }
  revalidatePath(`/panel/horas/${workerId}`);
  redirect(`/panel/horas/${workerId}`);
}

export default async function TeacherPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!isStaffAdmin(session.role)) redirect("/mi-turno");
  await requireAcademiaPanel();

  const { id } = await params;
  const tenant = await getCurrentTenant();
  const worker = tenant
    ? (await db.select().from(workers).where(and(eq(workers.id, id), eq(workers.tenantId, tenant.id))).limit(1))[0]
    : null;
  if (!tenant || !worker) redirect("/panel/horas");

  const profile = await getTeacherProfile(id);
  const startYear = courseYearStart(new Date());
  const entries = await listHourEntries(tenant.id, id, startYear);

  const target = profile?.annualTargetMin ?? 0;
  const reduction = profile?.reductionMin ?? 0;
  const net = Math.max(target - reduction, 0);
  const done = entries.filter((e) => e.status !== "voided").reduce((a, e) => a + e.minutes, 0);
  const rest = net - done;
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="min-h-screen bg-[#faf6ee]">
      <TopBar name={session.name} role={session.role} tenantName={tenant.name} logoUrl={tenant.logoUrl} />
      <main className="mx-auto max-w-4xl space-y-5 p-6">
        <a href="/panel/horas" className="text-sm font-medium text-cyan-700 hover:underline">← Control de horas</a>
        <h1 className="text-2xl font-bold text-slate-900">{worker.name}</h1>

        {/* Resumen */}
        <section className="grid gap-3 sm:grid-cols-4">
          {[
            { l: "A hacer (curso)", v: h(net), c: "text-slate-900" },
            { l: "Hechas", v: h(done), c: "text-cyan-700" },
            { l: "Restante", v: h(rest), c: rest > 0 ? "text-amber-700" : "text-emerald-700" },
            { l: "Reducción", v: reduction ? `${h(reduction)} h` : "—", c: "text-slate-500" },
          ].map((b) => (
            <div key={b.l} className="rounded-xl border border-[#e7dcc4] bg-white p-4 text-center shadow-sm">
              <p className={`text-2xl font-extrabold ${b.c}`}>{b.v}</p>
              <p className="mt-1 text-xs text-slate-500">{b.l}</p>
            </div>
          ))}
        </section>
        <p className="text-xs text-slate-400">Curso {courseYearLabel(startYear)} · disponibilidad: {AVAIL[profile?.availability ?? "both"]}{profile?.reductionType ? ` · reducción: ${profile.reductionType}` : ""}</p>

        {/* Añadir apunte */}
        <section className="rounded-xl border border-[#e7dcc4] bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-slate-800">Añadir horas</h2>
          <form action={addEntryAction} className="mt-3 grid gap-3 sm:grid-cols-5">
            <input type="hidden" name="workerId" value={worker.id} />
            <label className="text-sm">
              <span className="block text-slate-600">Fecha</span>
              <input type="date" name="workDate" defaultValue={today} required className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-2 text-sm" />
            </label>
            <label className="text-sm">
              <span className="block text-slate-600">Horas</span>
              <input type="number" name="hours" step="0.25" min="0" placeholder="2,5" required className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-2 text-sm" />
            </label>
            <label className="text-sm sm:col-span-1">
              <span className="block text-slate-600">Concepto</span>
              <select name="concept" className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-2 text-sm">
                {HOUR_CONCEPTS.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </label>
            <label className="text-sm sm:col-span-1">
              <span className="block text-slate-600">Nota <span className="text-slate-400">(opcional)</span></span>
              <input name="note" className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-2 text-sm" />
            </label>
            <div className="flex items-end">
              <button className="w-full rounded-lg bg-cyan-700 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-800">Añadir</button>
            </div>
          </form>
        </section>

        {/* Libro de horas */}
        <section className="overflow-x-auto rounded-xl border border-[#e7dcc4] bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">Fecha</th>
                <th className="px-3 py-3 text-right">Horas</th>
                <th className="px-3 py-3">Concepto</th>
                <th className="px-3 py-3">Nota</th>
                <th className="px-3 py-3">Estado</th>
                <th className="px-3 py-3 text-right">Acción</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => {
                const st = STATUS[e.status];
                return (
                  <tr key={e.id} className="border-b border-slate-100">
                    <td className="px-4 py-2 text-slate-700">{fmtDate(e.workDate)}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{h(e.minutes)}</td>
                    <td className="px-3 py-2 text-slate-600">{conceptLabel(e.concept)}</td>
                    <td className="px-3 py-2 text-slate-500">{e.note || "—"}</td>
                    <td className="px-3 py-2"><span className={`rounded px-2 py-0.5 text-xs font-medium ${st.cls}`}>{st.label}</span></td>
                    <td className="px-3 py-2 text-right">
                      <div className="flex justify-end gap-1">
                        {e.status === "declared" && (
                          <form action={confirmAction}>
                            <input type="hidden" name="id" value={e.id} />
                            <input type="hidden" name="workerId" value={worker.id} />
                            <button className="rounded border border-emerald-300 px-2 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-50">Confirmar</button>
                          </form>
                        )}
                        {e.status !== "voided" && e.status !== "locked" && (
                          <form action={voidAction}>
                            <input type="hidden" name="id" value={e.id} />
                            <input type="hidden" name="workerId" value={worker.id} />
                            <ConfirmButton confirm="¿Anular este apunte? Queda registrado como anulado." className="rounded border border-red-200 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50">Anular</ConfirmButton>
                          </form>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {entries.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-6 text-center text-sm text-slate-500">Sin apuntes este curso todavía.</td></tr>
              )}
            </tbody>
          </table>
        </section>

        {/* Editar perfil */}
        <details className="rounded-xl border border-[#e7dcc4] bg-white p-5 shadow-sm">
          <summary className="cursor-pointer font-semibold text-slate-800">Editar objetivo y reducción</summary>
          <form action={saveProfileAction} className="mt-3 grid gap-3 sm:grid-cols-4">
            <input type="hidden" name="workerId" value={worker.id} />
            <label className="text-sm">
              <span className="block text-slate-600">Objetivo (h)</span>
              <input name="target" type="number" step="0.25" defaultValue={target / 60} className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-2 text-sm" />
            </label>
            <label className="text-sm">
              <span className="block text-slate-600">Reducción (h)</span>
              <input name="reduction" type="number" step="0.25" defaultValue={reduction / 60} className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-2 text-sm" />
            </label>
            <label className="text-sm">
              <span className="block text-slate-600">Tipo de reducción</span>
              <input name="reductionType" defaultValue={profile?.reductionType ?? ""} className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-2 text-sm" />
            </label>
            <label className="text-sm">
              <span className="block text-slate-600">Disponibilidad</span>
              <select name="availability" defaultValue={profile?.availability ?? "both"} className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-2 text-sm">
                <option value="both">Mañana y tarde</option>
                <option value="morning">Solo mañana</option>
                <option value="afternoon">Solo tarde</option>
              </select>
            </label>
            <div className="sm:col-span-4">
              <button className="rounded-lg border border-cyan-700 px-5 py-2 text-sm font-semibold text-cyan-700 hover:bg-cyan-50">Guardar</button>
            </div>
          </form>
        </details>
      </main>
    </div>
  );
}
