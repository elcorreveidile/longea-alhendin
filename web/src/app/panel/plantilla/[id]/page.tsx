import { redirect } from "next/navigation";
import { and, asc, eq } from "drizzle-orm";
import { getSession, isStaffAdmin } from "@/lib/session";
import { getCurrentTenant } from "@/lib/tenant";
import { requireResidencePanel } from "@/lib/panel-guard";
import { db } from "@/db";
import { workers as workersT, vacations as vacationsT, users as usersT } from "@/db/schema";
import { getLatestCuadrante, type CuadranteJSON } from "@/db/cuadrantes";
import { getPhotoUrl, setPhotoUrl, clearPhotoUrl } from "@/lib/photos";
import { getFixedFloors, setFixedFloor } from "@/lib/floors";
import { put } from "@vercel/blob";
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
  photo: { ok: true, text: "✓ Fotografía actualizada." },
  photodel: { ok: true, text: "✓ Fotografía eliminada." },
  badimg: { ok: false, text: "La imagen no es válida o supera 8 MB." },
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
  const floorRaw = String(formData.get("fixedFloor") ?? "");
  const floor = floorRaw === "0" ? 0 : floorRaw === "1" ? 1 : floorRaw === "2" ? 2 : null;
  await setFixedFloor(tenant.id, id, floor);
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

async function uploadPhotoAction(formData: FormData) {
  "use server";
  const tenant = await getCurrentTenant();
  const id = String(formData.get("id") ?? "");
  if (!tenant || !id) redirect("/panel/plantilla");
  const file = formData.get("photo") as File | null;
  if (!file || file.size === 0 || !file.type.startsWith("image/") || file.size > 8_000_000) {
    redirect(`/panel/plantilla/${id}?m=badimg`);
  }
  const w = (await db.select().from(workersT).where(and(eq(workersT.id, id), eq(workersT.tenantId, tenant.id))).limit(1))[0];
  if (!w) redirect("/panel/plantilla");
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
  const blob = await put(`fichas/${tenant.id}/${id}.${ext}`, file, { access: "public", addRandomSuffix: true });
  await setPhotoUrl(tenant.id, id, blob.url);
  redirect(`/panel/plantilla/${id}?m=photo`);
}

async function deletePhotoAction(formData: FormData) {
  "use server";
  const tenant = await getCurrentTenant();
  const id = String(formData.get("id") ?? "");
  if (!tenant || !id) redirect("/panel/plantilla");
  await clearPhotoUrl(tenant.id, id);
  redirect(`/panel/plantilla/${id}?m=photodel`);
}

// --- Estilos "ficha de personal" vintage ---
const label = "block text-[10px] font-bold uppercase tracking-[0.15em] text-[#8a6d3b]";
const field =
  "mt-0.5 w-full border-0 border-b border-dotted border-[#a08a5e] bg-transparent px-1 py-1 font-mono text-sm text-[#3a2f1d] focus:border-[#8b2e22] focus:outline-none focus:ring-0";
const stamp =
  "rounded-lg bg-[#7a4a3a] px-4 py-2 font-mono text-xs font-bold uppercase tracking-widest text-[#f4ecd8] shadow hover:bg-[#693e30]";

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
  await requireResidencePanel();

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

  const saved = await getLatestCuadrante(tenant.id);
  const data = saved ? (saved.data as CuadranteJSON & { names?: Record<string, string> }) : null;
  const row = data ? data.assignments[id] ?? data.assignments[worker.name] ?? null : null;
  const counts = { M: 0, T: 0, N: 0, D: 0, V: 0 } as Record<string, number>;
  if (row) for (const c of row) counts[c[0] as string] = (counts[c[0] as string] ?? 0) + 1;

  const initials = worker.name.split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase();
  const photoUrl = await getPhotoUrl(tenant.id, id);
  const fixedFloor = (await getFixedFloors(tenant.id))[id];

  return (
    <div className="min-h-screen bg-[#e8ddc4]">
      <TopBar name={session.name} role={session.role} tenantName={tenant?.name} logoUrl={tenant?.logoUrl} />
      <main className="mx-auto max-w-3xl p-6">
        <div className="mb-3 flex items-center justify-between">
          <a href="/panel/plantilla" className="font-mono text-sm font-medium text-[#7a4a3a] hover:underline">← Plantilla</a>
          {msg && (
            <span className={`rounded px-3 py-1 font-mono text-xs ${msg.ok ? "bg-[#3f6f4f] text-[#f4ecd8]" : "bg-[#8b2e22] text-[#f4ecd8]"}`}>
              {msg.text}
            </span>
          )}
        </div>

        {/* TARJETA */}
        <div
          className="relative border-[3px] border-double border-[#7a6a45] bg-[#f4ecd8] p-7 shadow-[0_10px_30px_rgba(80,60,20,0.25)]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, transparent, transparent 27px, rgba(122,106,69,0.10) 28px)",
          }}
        >
          {/* sello rojo */}
          <div className="pointer-events-none absolute right-6 top-16 -rotate-12 rounded-md border-2 border-[#8b2e22] px-3 py-1 font-mono text-xs font-bold uppercase tracking-widest text-[#8b2e22] opacity-70">
            Personal
          </div>

          {/* cabecera */}
          <div className="mb-5 flex items-center gap-3 border-b-2 border-[#7a6a45] pb-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-symbol.png" alt="PlanTurnos" className="h-11 w-11 shrink-0" />
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-[#8a6d3b]">
                {tenant?.name ?? "Residencia"} — Departamento de Personal
              </p>
              <h2 className="font-serif text-2xl font-bold tracking-wide text-[#3a2f1d]">FICHA DE PERSONAL</h2>
            </div>
          </div>

          {/* datos + foto */}
          <form action={updateAction} className="grid grid-cols-1 gap-5 sm:grid-cols-[1fr_auto]">
            <input type="hidden" name="id" value={worker.id} />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="sm:col-span-2">
                <span className={label}>Nombre y apellidos</span>
                <input name="name" defaultValue={worker.name} className={field} />
              </label>
              <label>
                <span className={label}>Puesto</span>
                <select name="role" defaultValue={worker.jobRole} className={field}>
                  {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </label>
              <label>
                <span className={label}>Turno asignado</span>
                <select name="onlyShift" defaultValue={worker.onlyShift ?? ""} className={field}>
                  {SHIFTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </label>
              <label>
                <span className={label}>Teléfono</span>
                <input name="phone" defaultValue={worker.phone ?? ""} className={field} placeholder="612345678" />
              </label>
              <label>
                <span className={label}>Planta fija</span>
                <select name="fixedFloor" defaultValue={fixedFloor ?? ""} className={field}>
                  <option value="">Sin fijar (reparto automático)</option>
                  <option value="0">Planta 0 (azul)</option>
                  <option value="1">Planta 1 (verde)</option>
                  <option value="2">Planta 2 (rosa)</option>
                </select>
              </label>
              <label className="flex items-end gap-2 pb-1">
                <input type="checkbox" name="noNight" defaultChecked={worker.noNight}
                  className="h-4 w-4 rounded-none border-[#a08a5e] text-[#7a4a3a]" />
                <span className="font-mono text-sm text-[#3a2f1d]">No realiza turno de noche</span>
              </label>
            </div>

            {/* recuadro foto */}
            <div className="flex flex-col items-center">
              <div className="flex h-32 w-28 items-center justify-center overflow-hidden border-2 border-dashed border-[#a08a5e] bg-[#efe5c9] font-serif text-3xl font-bold text-[#bfae84]">
                {photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photoUrl} alt={worker.name} className="h-full w-full object-cover" />
                ) : (
                  initials || "FOTO"
                )}
              </div>
              <span className="mt-1 font-mono text-[9px] uppercase tracking-widest text-[#8a6d3b]">Fotografía</span>
            </div>

            <div className="sm:col-span-2">
              <button className={stamp}>Guardar datos</button>
              <span className="ml-3 font-mono text-[11px] text-[#8a6d3b]">
                Acceso: {access?.email || access?.phone || "sin asignar"} ·{" "}
                <a href="/panel/accesos" className="underline">gestionar</a>
              </span>
            </div>
          </form>

          {/* subir/quitar fotografía */}
          <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-dotted border-[#a08a5e] pt-3">
            <span className={label}>Fotografía</span>
            <form action={uploadPhotoAction} className="flex flex-wrap items-center gap-2">
              <input type="hidden" name="id" value={worker.id} />
              <input
                type="file"
                name="photo"
                accept="image/*"
                required
                className="max-w-[230px] font-mono text-xs text-[#3a2f1d] file:mr-2 file:cursor-pointer file:rounded file:border-0 file:bg-[#7a4a3a] file:px-3 file:py-1.5 file:font-mono file:text-[#f4ecd8]"
              />
              <button className={stamp}>Subir</button>
            </form>
            {photoUrl && (
              <form action={deletePhotoAction}>
                <input type="hidden" name="id" value={worker.id} />
                <button className="rounded border border-[#8b2e22] px-3 py-1.5 font-mono text-xs font-semibold text-[#8b2e22] hover:bg-[#8b2e22] hover:text-[#f4ecd8]">
                  Quitar foto
                </button>
              </form>
            )}
          </div>
        </div>

        {/* VACACIONES */}
        <div className="relative mt-6 border-[3px] border-double border-[#7a6a45] bg-[#f4ecd8] p-7 shadow-[0_10px_30px_rgba(80,60,20,0.2)]">
          <h3 className="mb-3 border-b border-[#a08a5e] pb-2 font-serif text-lg font-bold uppercase tracking-wide text-[#3a2f1d]">
            Registro de vacaciones
          </h3>
          {vacs.length === 0 ? (
            <p className="mb-3 font-mono text-sm text-[#8a6d3b]">— Sin periodos anotados —</p>
          ) : (
            <ul className="mb-3 divide-y divide-[#cdbd95]">
              {vacs.map((v) => (
                <li key={v.id} className="flex items-center justify-between py-2 font-mono text-sm text-[#3a2f1d]">
                  <span>
                    {fmt(v.startDate)} &nbsp;→&nbsp; {fmt(v.endDate)}
                    {v.note ? <span className="text-[#8a6d3b]"> · {v.note}</span> : null}
                  </span>
                  <form action={deleteVacationAction}>
                    <input type="hidden" name="id" value={worker.id} />
                    <input type="hidden" name="vacId" value={v.id} />
                    <button className="rounded border border-[#8b2e22] px-3 py-1 text-xs font-semibold text-[#8b2e22] hover:bg-[#8b2e22] hover:text-[#f4ecd8]">
                      Quitar
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
          <form action={addVacationAction} className="flex flex-wrap items-end gap-4">
            <input type="hidden" name="id" value={worker.id} />
            <label><span className={label}>Desde</span>
              <input type="date" name="start" required className={field} />
            </label>
            <label><span className={label}>Hasta</span>
              <input type="date" name="end" required className={field} />
            </label>
            <label><span className={label}>Concepto</span>
              <input name="note" className={field} placeholder="p. ej. verano" />
            </label>
            <button className={stamp}>Anotar vacaciones</button>
          </form>
          <p className="mt-3 font-mono text-[11px] text-[#8a6d3b]">
            Las vacaciones se respetan automáticamente al generar los cuadrantes de esas fechas.
          </p>
        </div>

        {/* TURNOS */}
        <div className="mt-6 border-[3px] border-double border-[#7a6a45] bg-[#f4ecd8] p-7 shadow-[0_10px_30px_rgba(80,60,20,0.2)]">
          <h3 className="mb-3 border-b border-[#a08a5e] pb-2 font-serif text-lg font-bold uppercase tracking-wide text-[#3a2f1d]">
            Hoja de servicio {data ? `· ${MONTHS[data.month]} ${data.year}` : ""}
          </h3>
          {row ? (
            <>
              <div className="mb-3 flex flex-wrap gap-2 font-mono text-xs text-[#3a2f1d]">
                <span className="rounded bg-[#d8e9dc] px-2 py-1">Mañanas: <strong>{counts.M}</strong></span>
                <span className="rounded bg-[#f6e7c4] px-2 py-1">Tardes: <strong>{counts.T}</strong></span>
                <span className="rounded bg-[#dcdcf0] px-2 py-1">Noches: <strong>{counts.N}</strong></span>
                <span className="rounded bg-[#e7e0cf] px-2 py-1">Descansos: <strong>{counts.D}</strong></span>
                <span className="rounded bg-[#cfe6f2] px-2 py-1">Vacaciones: <strong>{counts.V}</strong></span>
              </div>
              <div className="flex flex-wrap gap-1">
                {row.map((c, i) => (
                  <span key={i} className="inline-flex h-7 w-7 items-center justify-center rounded-none border border-[#a08a5e] bg-[#efe5c9] font-mono text-xs font-semibold text-[#3a2f1d]">
                    {c}
                  </span>
                ))}
              </div>
            </>
          ) : (
            <p className="font-mono text-sm text-[#8a6d3b]">No aparece en el último cuadrante generado.</p>
          )}
        </div>
      </main>
    </div>
  );
}
