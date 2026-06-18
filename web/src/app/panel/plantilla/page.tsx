import { redirect } from "next/navigation";
import { and, asc, eq } from "drizzle-orm";
import { getSession, isStaffAdmin } from "@/lib/session";
import { getCurrentTenant } from "@/lib/tenant";
import { requireResidencePanel } from "@/lib/panel-guard";
import { db } from "@/db";
import { workers as workersT } from "@/db/schema";
import { getPhotoUrls } from "@/lib/photos";
import TopBar from "@/components/TopBar";

const ROLES = [
  { value: "gerocultora", label: "Gerocultora" },
  { value: "gerocultora_lv", label: "Gerocultora (solo L-V)" },
  { value: "supervisora", label: "Supervisora" },
] as const;
type RoleValue = (typeof ROLES)[number]["value"];
const ROLE_VALUES = ROLES.map((r) => r.value) as readonly string[];

const SHIFTS = [
  { value: "", label: "Cualquiera" },
  { value: "M", label: "Solo mañana" },
  { value: "T", label: "Solo tarde" },
  { value: "N", label: "Solo noche" },
] as const;

const MSG: Record<string, { ok: boolean; text: string }> = {
  added: { ok: true, text: "✓ Trabajadora añadida." },
  saved: { ok: true, text: "✓ Cambios guardados." },
  baja: { ok: true, text: "✓ Trabajadora dada de baja (no entra en los cuadrantes nuevos)." },
  reactivada: { ok: true, text: "✓ Trabajadora reactivada." },
  eliminada: { ok: true, text: "✓ Trabajadora eliminada definitivamente." },
  noname: { ok: false, text: "El nombre no puede estar vacío." },
};

function parseRole(v: FormDataEntryValue | null): RoleValue {
  const s = String(v ?? "");
  return (ROLE_VALUES.includes(s) ? s : "gerocultora") as RoleValue;
}
function parseShift(v: FormDataEntryValue | null): string | null {
  const s = String(v ?? "");
  return s === "M" || s === "T" || s === "N" ? s : null;
}

async function addWorkerAction(formData: FormData) {
  "use server";
  const tenant = await getCurrentTenant();
  if (!tenant) redirect("/panel/plantilla");
  const name = String(formData.get("name") ?? "").trim();
  if (!name) redirect("/panel/plantilla?m=noname");
  await db.insert(workersT).values({
    tenantId: tenant!.id,
    name,
    jobRole: parseRole(formData.get("role")),
    noNight: formData.get("noNight") === "on",
    onlyShift: parseShift(formData.get("onlyShift")),
  });
  redirect("/panel/plantilla?m=added");
}

async function updateWorkerAction(formData: FormData) {
  "use server";
  const tenant = await getCurrentTenant();
  if (!tenant) redirect("/panel/plantilla");
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!id) redirect("/panel/plantilla");
  if (!name) redirect("/panel/plantilla?m=noname");
  await db
    .update(workersT)
    .set({
      name,
      jobRole: parseRole(formData.get("role")),
      noNight: formData.get("noNight") === "on",
      onlyShift: parseShift(formData.get("onlyShift")),
    })
    .where(and(eq(workersT.id, id), eq(workersT.tenantId, tenant!.id)));
  redirect("/panel/plantilla?m=saved");
}

async function setActiveAction(formData: FormData) {
  "use server";
  const tenant = await getCurrentTenant();
  if (!tenant) redirect("/panel/plantilla");
  const id = String(formData.get("id") ?? "");
  const active = formData.get("active") === "1";
  if (id) {
    await db
      .update(workersT)
      .set({ active })
      .where(and(eq(workersT.id, id), eq(workersT.tenantId, tenant!.id)));
  }
  redirect(`/panel/plantilla?m=${active ? "reactivada" : "baja"}`);
}

async function deleteWorkerAction(formData: FormData) {
  "use server";
  const tenant = await getCurrentTenant();
  if (!tenant) redirect("/panel/plantilla");
  const id = String(formData.get("id") ?? "");
  if (id) {
    await db.delete(workersT).where(and(eq(workersT.id, id), eq(workersT.tenantId, tenant!.id)));
  }
  redirect("/panel/plantilla?m=eliminada");
}

const inputCls = "rounded-lg border border-slate-300 px-3 py-2 text-sm";

function WorkerForm({
  worker,
  photo,
}: {
  worker: { id: string; name: string; jobRole: string; noNight: boolean; onlyShift: string | null };
  photo?: string;
}) {
  return (
    <tr className="border-t border-slate-100">
      <td className="p-2">
        <div className="flex items-center gap-2">
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover" />
          ) : (
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-500">
              {worker.name.slice(0, 1).toUpperCase()}
            </span>
          )}
          <input name="name" defaultValue={worker.name} className={`${inputCls} w-40`} form={`w-${worker.id}`} />
        </div>
      </td>
      <td className="p-2">
        <select name="role" defaultValue={worker.jobRole} className={inputCls} form={`w-${worker.id}`}>
          {ROLES.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
      </td>
      <td className="p-2">
        <select name="onlyShift" defaultValue={worker.onlyShift ?? ""} className={inputCls} form={`w-${worker.id}`}>
          {SHIFTS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </td>
      <td className="p-2 text-center">
        <input type="checkbox" name="noNight" defaultChecked={worker.noNight} form={`w-${worker.id}`}
          className="h-4 w-4 rounded border-slate-300 text-cyan-700" />
      </td>
      <td className="p-2">
        <div className="flex gap-2">
          <a href={`/panel/plantilla/${worker.id}`}
            className="rounded-lg border border-cyan-300 bg-cyan-50 px-3 py-2 text-xs font-semibold text-cyan-700 hover:bg-cyan-100">
            Ficha
          </a>
          <form id={`w-${worker.id}`} action={updateWorkerAction}>
            <input type="hidden" name="id" value={worker.id} />
            <button className="rounded-lg bg-cyan-700 px-3 py-2 text-xs font-semibold text-white hover:bg-cyan-800">
              Guardar
            </button>
          </form>
          <form action={setActiveAction}>
            <input type="hidden" name="id" value={worker.id} />
            <input type="hidden" name="active" value="0" />
            <button className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-100">
              Dar de baja
            </button>
          </form>
        </div>
      </td>
    </tr>
  );
}

export default async function PlantillaPage({
  searchParams,
}: {
  searchParams: Promise<{ m?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!isStaffAdmin(session.role)) redirect("/mi-turno");
  await requireResidencePanel();

  const sp = await searchParams;
  const msg = sp.m ? MSG[sp.m] : null;
  const tenant = await getCurrentTenant();
  const all = tenant
    ? await db.select().from(workersT).where(eq(workersT.tenantId, tenant.id)).orderBy(asc(workersT.name))
    : [];
  const active = all.filter((w) => w.active);
  const inactive = all.filter((w) => !w.active);
  const photos = tenant ? await getPhotoUrls(tenant.id, active.map((w) => w.id)) : {};

  return (
    <div className="min-h-screen bg-[#faf6ee]">
      <TopBar name={session.name} role={session.role} tenantName={tenant?.name} logoUrl={tenant?.logoUrl} />
      <main className="mx-auto max-w-5xl space-y-6 p-6">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-800">{/* eslint-disable-next-line @next/next/no-img-element */}<img src="/icons/icon-plantilla.png" alt="" className="h-7 w-7" />Plantilla ({active.length})</h2>
          <a href="/panel" className="text-sm font-medium text-cyan-700 hover:underline">← Volver al panel</a>
        </div>

        {msg && (
          <div className={`rounded-lg border p-3 text-sm ${msg.ok ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-700"}`}>
            {msg.text}
          </div>
        )}

        {/* Añadir */}
        <section className="rounded-lg border border-cyan-200 bg-white p-4 shadow-sm">
          <h3 className="mb-3 font-semibold text-slate-800">Añadir trabajadora</h3>
          <form action={addWorkerAction} className="flex flex-wrap items-end gap-3">
            <label className="text-sm">Nombre
              <input name="name" required className={`${inputCls} mt-1 block w-48`} placeholder="Nombre y apellido" />
            </label>
            <label className="text-sm">Puesto
              <select name="role" className={`${inputCls} mt-1 block`}>
                {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </label>
            <label className="text-sm">Turno
              <select name="onlyShift" className={`${inputCls} mt-1 block`}>
                {SHIFTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </label>
            <label className="flex items-center gap-2 pb-2 text-sm">
              <input type="checkbox" name="noNight" className="h-4 w-4 rounded border-slate-300 text-cyan-700" />
              Sin noches
            </label>
            <button className="rounded-lg bg-cyan-700 px-5 py-2 text-sm font-semibold text-white hover:bg-cyan-800">
              Añadir
            </button>
          </form>
        </section>

        {/* Lista editable */}
        <section className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <th className="p-2">Nombre</th>
                <th className="p-2">Puesto</th>
                <th className="p-2">Turno</th>
                <th className="p-2 text-center">Sin noches</th>
                <th className="p-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {active.map((w) => (
                <WorkerForm key={w.id} worker={w} photo={photos[w.id]} />
              ))}
              {active.length === 0 && (
                <tr><td colSpan={5} className="p-4 text-center text-slate-400">No hay trabajadoras activas.</td></tr>
              )}
            </tbody>
          </table>
        </section>

        {/* Dadas de baja */}
        {inactive.length > 0 && (
          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="mb-3 font-semibold text-slate-600">Dadas de baja ({inactive.length})</h3>
            <ul className="space-y-2">
              {inactive.map((w) => (
                <li key={w.id} className="flex items-center justify-between border-b border-slate-100 pb-2 text-sm">
                  <span className="text-slate-500">{w.name}</span>
                  <div className="flex gap-2">
                    <form action={setActiveAction}>
                      <input type="hidden" name="id" value={w.id} />
                      <input type="hidden" name="active" value="1" />
                      <button className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100">
                        Reactivar
                      </button>
                    </form>
                    <form action={deleteWorkerAction}>
                      <input type="hidden" name="id" value={w.id} />
                      <button className="rounded-lg border border-red-300 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100">
                        Eliminar definitivamente
                      </button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        <p className="text-xs text-slate-400">
          Los cambios de nombre o puesto se reflejan al <strong>generar de nuevo</strong> el cuadrante. Las vacaciones
          se gestionan aparte.
        </p>
      </main>
    </div>
  );
}
