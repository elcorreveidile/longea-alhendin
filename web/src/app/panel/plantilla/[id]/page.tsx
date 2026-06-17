import { redirect } from "next/navigation";
import { and, asc, eq } from "drizzle-orm";
import { getSession, isStaffAdmin } from "@/lib/session";
import { getCurrentTenant } from "@/lib/tenant";
import { db } from "@/db";
import { workers as workersT, vacations as vacationsT, users as usersT } from "@/db/schema";
import { getLatestCuadrante, type CuadranteJSON } from "@/db/cuadrantes";
import TopBar from "@/components/TopBar";

const ROLES = [
  { value: "gerocultora", label: "Gerocultora" },
  { value: "gerocultora_lv", label: "Gerocultora (solo L-V)" },
  { value: "supervisora", label: "Supervisora" },
] as const;
const ROLE_VALUES = ROLES.map((r) => r.value) as readonly string[];
const ROLE_LABEL: Record<string, string> = Object.fromEntries(ROLES.map((r) => [r.value, r.label]));

const SHIFTS = [
  { value: "", label: "Cualquiera" },
  { value: "M", label: "Solo mañana" },
  { value: "T", label: "Solo tarde" },
  { value: "N", label: "Solo noche" },
] as const;

const MONTHS = [
  "", "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

const MSG: Record<string, { ok: boolean; text: string }> = {
  saved: { ok: true, text: "✓ Datos guardados." },
  vac: { ok: true, text: "✓ Vacaciones añadidas." },
  vacdel: { ok: true, text: "✓ Vacaciones eliminadas." },
  vacbad: { ok: false, text: "Fechas no válidas (la fin debe ser igual o posterior al inicio)." },
};

function fmt(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTHS[m]} ${y}`;
}

async function updateAction(formData: FormData) {
  "use server";
  const tenant = await getCurrentTenant();
  const id = String(formData.get("id") ?? "");
  if (!tenant || !id) redirect("/panel/plantilla");
  const name = String(formData.get("name") ?? "").trim();
  const roleRaw = String(formData.get("role") ?? "");
  const shiftRaw = String(formData.get("onlyShift") ?? "");
  await db
    .update(workersT)
    .set({
      name: name || "Sin nombre",
      jobRole: (ROLE_VALUES.includes(roleRaw) ? roleRaw : "gerocultora") as "gerocultora",
      noNight: formData.get("noNight") === "on",
      onlyShift: shiftRaw === "M" || shiftRaw === "T" || shiftRaw === "N" ? shiftRaw : null,
      phone: String(formData.get("phone") ?? "").trim() || null,
    })
    .where(and(eq(workersT.id, id), eq(workersT.tenantId, tenant.id)));
  redirect(`/panel/plantilla/${id}?m=saved`);
}

async function addVacationAction(formData: FormData) {
  "use server";
  const tenant = await getCurrentTenant();
  const id = String(formData.get("id") ?? "");
  if (!tenant || !id) redirect("/panel/plantilla");
  const start = String(formData.get("start") ?? "");
  const end = String(formData.get("end") ?? "");
  const note = String(formData.get("note") ?? "").trim() || null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start) || !/^\d{4}-\d{2}-\d{2}$/.test(end) || end < start) {
    redirect(`/panel/plantilla/${id}?m=vacbad`);
  }
  // Verifica que la trabajadora es del tenant antes de insertar.
  const w = (await db.select().from(workersT).where(and(eq(workersT.id, id), eq(workersT.tenantId, tenant.id))).limit(1))[0];
  if (!w) redirect("/panel/plantilla");
  await db.insert(vacationsT).values({ workerId: id, startDate: start, endDate: end, note });
  redirect(`/panel/plantilla/${id}?m=vac`);
}

async function deleteVacationAction(formData: FormData) {
  "use server";
  const tenant = await getCurrentTenant();
  const id = String(formData.get("id") ?? "");
  const vacId = String(formData.get("vacId") ?? "");
  if (!tenant || !id || !vacId) redirect("/panel/plantilla");
  await db.delete(vacationsT).where(eq(vacationsT.id, vacId));
  redirect(`/panel/plantilla/${id}?m=vacdel`);
}

export default async function FichaPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ m?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!isStaffAdmin(session.role)) redirect("/mi-turno");

  const { id } = await params;
  const sp = await searchParams;
  const msg = sp.m ? MSG[sp.m] : null;
  const tenant = await getCurrentTenant();
  if (!tenant) redirect("/panel");

  const worker = (
    await db.select().from(workersT).where(and(eq(workersT.id, id), eq(workersT.tenantId, tenant.id))).limit(1)
  )[0];
  if (!worker) redirect("/panel/plantilla");

  const vacs = await db
    .select()
    .from(vacationsT)
    .where(eq(vacationsT.workerId, id))
    .orderBy(asc(vacationsT.startDate));

  const access = (await db.select().from(usersT).where(eq(usersT.workerId, id)).limit(1))[0];

  // Turnos del último cuadrante.
  const saved = await getLatestCuadrante(tenant.id);
  const data = saved ? (saved.data as CuadranteJSON & { names?: Record<string, string> }) : null;
  const row = data ? data.assignments[id] ?? data.assignments[worker.name] ?? null : null;
  const counts = { M: 0, T: 0, N: 0, D: 0, V: 0 } as Record<string, number>;
  if (row) for (const c of row) counts[c[0] as string] = (counts[c[0] as string] ?? 0) + 1;

  const inputCls = "mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm";

  return (
    <div className="min-h-screen bg-slate-50">
      <TopBar name={session.name} role={session.role} tenantName={tenant?.name} logoUrl={tenant?.logoUrl} />
      <main className="mx-auto max-w-3xl space-y-5 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800">
            {worker.name} <span className="text-sm font-normal text-slate-400">· {ROLE_LABEL[worker.jobRole]}</span>
          </h2>
          <a href="/panel/plantilla" className="text-sm font-medium text-cyan-700 hover:underline">← Plantilla</a>
        </div>

        {msg && (
          <div className={`rounded-lg border p-3 text-sm ${msg.ok ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-700"}`}>
            {msg.text}
          </div>
        )}

        {/* Datos y preferencias */}
        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="mb-3 font-semibold text-slate-800">Datos y preferencias</h3>
          <form action={updateAction} className="flex flex-wrap items-end gap-3">
            <input type="hidden" name="id" value={worker.id} />
            <label className="flex flex-col text-sm">Nombre
              <input name="name" defaultValue={worker.name} className={`${inputCls} w-52`} />
            </label>
            <label className="flex flex-col text-sm">Puesto
              <select name="role" defaultValue={worker.jobRole} className={inputCls}>
                {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </label>
            <label className="flex flex-col text-sm">Turno fijo
              <select name="onlyShift" defaultValue={worker.onlyShift ?? ""} className={inputCls}>
                {SHIFTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </label>
            <label className="flex flex-col text-sm">Teléfono
              <input name="phone" defaultValue={worker.phone ?? ""} className={`${inputCls} w-36`} placeholder="612345678" />
            </label>
            <label className="flex items-center gap-2 pb-2 text-sm">
              <input type="checkbox" name="noNight" defaultChecked={worker.noNight} className="h-4 w-4 rounded border-slate-300 text-cyan-700" />
              Sin noches
            </label>
            <button className="rounded-lg bg-cyan-700 px-5 py-2 text-sm font-semibold text-white hover:bg-cyan-800">
              Guardar
            </button>
          </form>
          <p className="mt-3 text-xs text-slate-400">
            Acceso: {access?.email || access?.phone || "sin asignar"} ·{" "}
            <a href="/panel/accesos" className="text-cyan-700 hover:underline">Gestionar accesos</a>
          </p>
        </section>

        {/* Vacaciones */}
        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="mb-3 font-semibold text-slate-800">Vacaciones</h3>
          {vacs.length === 0 ? (
            <p className="mb-3 text-sm text-slate-400">No tiene periodos de vacaciones registrados.</p>
          ) : (
            <ul className="mb-3 space-y-2">
              {vacs.map((v) => (
                <li key={v.id} className="flex items-center justify-between border-b border-slate-100 pb-2 text-sm">
                  <span className="text-slate-700">
                    {fmt(v.startDate)} → {fmt(v.endDate)}
                    {v.note ? <span className="text-slate-400"> · {v.note}</span> : null}
                  </span>
                  <form action={deleteVacationAction}>
                    <input type="hidden" name="id" value={worker.id} />
                    <input type="hidden" name="vacId" value={v.id} />
                    <button className="rounded-lg border border-red-300 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-100">
                      Quitar
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
          <form action={addVacationAction} className="flex flex-wrap items-end gap-3">
            <input type="hidden" name="id" value={worker.id} />
            <label className="flex flex-col text-sm">Desde
              <input type="date" name="start" required className={inputCls} />
            </label>
            <label className="flex flex-col text-sm">Hasta
              <input type="date" name="end" required className={inputCls} />
            </label>
            <label className="flex flex-col text-sm">Nota (opcional)
              <input name="note" className={`${inputCls} w-40`} placeholder="p. ej. verano" />
            </label>
            <button className="rounded-lg bg-cyan-700 px-5 py-2 text-sm font-semibold text-white hover:bg-cyan-800">
              Añadir vacaciones
            </button>
          </form>
          <p className="mt-3 text-xs text-slate-400">
            Las vacaciones se respetan automáticamente al generar los cuadrantes (mes y semana) de esas fechas.
          </p>
        </section>

        {/* Turnos del último cuadrante */}
        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="mb-3 font-semibold text-slate-800">
            Turnos {data ? `· ${MONTHS[data.month]} ${data.year}` : ""}
          </h3>
          {row ? (
            <>
              <div className="mb-3 flex flex-wrap gap-3 text-sm">
                <span className="rounded bg-emerald-100 px-2 py-1">Mañanas: <strong>{counts.M}</strong></span>
                <span className="rounded bg-amber-100 px-2 py-1">Tardes: <strong>{counts.T}</strong></span>
                <span className="rounded bg-indigo-100 px-2 py-1">Noches: <strong>{counts.N}</strong></span>
                <span className="rounded bg-slate-100 px-2 py-1">Descansos: <strong>{counts.D}</strong></span>
                <span className="rounded bg-sky-100 px-2 py-1">Vacaciones: <strong>{counts.V}</strong></span>
              </div>
              <div className="flex flex-wrap gap-1">
                {row.map((c, i) => (
                  <span key={i} className="inline-flex h-7 w-7 items-center justify-center rounded border border-slate-200 text-xs font-semibold">
                    {c}
                  </span>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-slate-400">No aparece en el último cuadrante generado.</p>
          )}
        </section>
      </main>
    </div>
  );
}
