import { redirect } from "next/navigation";
import { and, asc, eq } from "drizzle-orm";
import { getSession } from "@/lib/session";
import { getCurrentTenant } from "@/lib/tenant";
import { db } from "@/db";
import { workers as workersT, vacations as vacationsT } from "@/db/schema";
import { getLatestCuadrante, type CuadranteJSON } from "@/db/cuadrantes";
import { getPhotoUrl, setPhotoUrl, clearPhotoUrl } from "@/lib/photos";
import { put } from "@vercel/blob";
import TopBar from "@/components/TopBar";

const ROLE_LABEL: Record<string, string> = {
  gerocultora: "Gerocultora",
  gerocultora_lv: "Gerocultora (solo L-V)",
  supervisora: "Supervisora",
};
const SHIFT_LABEL: Record<string, string> = { M: "Solo mañana", T: "Solo tarde", N: "Solo noche" };
const MONTHS = [
  "", "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

function fmt(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTHS[m]} ${y}`;
}

const label = "block text-[10px] font-bold uppercase tracking-[0.15em] text-[#8a6d3b]";
const value = "font-mono text-sm text-[#3a2f1d] border-b border-dotted border-[#a08a5e] pb-1";

async function uploadMyPhotoAction(formData: FormData) {
  "use server";
  const session = await getSession();
  const tenant = await getCurrentTenant();
  if (!session?.workerId || !tenant) redirect("/mi-ficha");
  const file = formData.get("photo") as File | null;
  if (!file || file.size === 0 || !file.type.startsWith("image/") || file.size > 8_000_000) {
    redirect("/mi-ficha?m=badimg");
  }
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
  const blob = await put(`fichas/${tenant.id}/${session.workerId}.${ext}`, file, { access: "public", addRandomSuffix: true });
  await setPhotoUrl(tenant.id, session.workerId, blob.url);
  redirect("/mi-ficha?m=photo");
}

async function deleteMyPhotoAction() {
  "use server";
  const session = await getSession();
  const tenant = await getCurrentTenant();
  if (!session?.workerId || !tenant) redirect("/mi-ficha");
  await clearPhotoUrl(tenant.id, session.workerId);
  redirect("/mi-ficha?m=photodel");
}

const MSG: Record<string, { ok: boolean; text: string }> = {
  photo: { ok: true, text: "✓ Foto actualizada." },
  photodel: { ok: true, text: "✓ Foto eliminada." },
  badimg: { ok: false, text: "La imagen no es válida o supera 8 MB." },
};

export default async function MiFichaPage({
  searchParams,
}: {
  searchParams: Promise<{ m?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  const sp = await searchParams;
  const msg = sp.m ? MSG[sp.m] : null;

  const tenant = await getCurrentTenant();
  const id = session.workerId;
  const worker = id && tenant
    ? (await db.select().from(workersT).where(and(eq(workersT.id, id), eq(workersT.tenantId, tenant.id))).limit(1))[0]
    : null;

  if (!worker) {
    return (
      <div className="min-h-screen bg-[#e8ddc4]">
        <TopBar name={session.name} role={session.role} tenantName={tenant?.name} logoUrl={tenant?.logoUrl} />
        <main className="mx-auto max-w-md p-6">
          <a href="/mi-turno" className="font-mono text-sm text-[#7a4a3a] hover:underline">← Mi turno</a>
          <p className="mt-4 rounded-lg bg-[#f4ecd8] p-4 font-mono text-sm text-[#8a6d3b] shadow">
            Todavía no tienes una ficha enlazada. La crea la administradora.
          </p>
        </main>
      </div>
    );
  }

  const vacs = await db.select().from(vacationsT).where(eq(vacationsT.workerId, worker.id)).orderBy(asc(vacationsT.startDate));
  const photoUrl = await getPhotoUrl(tenant!.id, worker.id);

  const saved = await getLatestCuadrante(tenant!.id);
  const data = saved ? (saved.data as CuadranteJSON & { names?: Record<string, string> }) : null;
  const row = data ? data.assignments[worker.id] ?? data.assignments[worker.name] ?? null : null;
  const counts = { M: 0, T: 0, N: 0, D: 0, V: 0 } as Record<string, number>;
  if (row) for (const c of row) counts[c[0] as string] = (counts[c[0] as string] ?? 0) + 1;

  const initials = worker.name.split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="min-h-screen bg-[#e8ddc4]">
      <TopBar name={session.name} role={session.role} tenantName={tenant?.name} logoUrl={tenant?.logoUrl} />
      <main className="mx-auto max-w-2xl p-4 sm:p-6">
        <a href="/mi-turno" className="font-mono text-sm font-medium text-[#7a4a3a] hover:underline">← Mi turno</a>

        {msg && (
          <div className={`mt-3 rounded-lg border p-3 font-mono text-sm ${msg.ok ? "border-[#3f6f4f] bg-[#e3efe6] text-[#2f5f3f]" : "border-[#8b2e22] bg-[#f3e0dd] text-[#8b2e22]"}`}>
            {msg.text}
          </div>
        )}

        {/* TARJETA */}
        <div
          className="relative mt-3 border-[3px] border-double border-[#7a6a45] bg-[#f4ecd8] p-6 shadow-[0_10px_30px_rgba(80,60,20,0.25)]"
          style={{ backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 27px, rgba(122,106,69,0.10) 28px)" }}
        >
          <div className="pointer-events-none absolute right-5 top-14 -rotate-12 rounded-md border-2 border-[#8b2e22] px-3 py-1 font-mono text-xs font-bold uppercase tracking-widest text-[#8b2e22] opacity-70">
            Personal
          </div>

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

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-[1fr_auto]">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <span className={label}>Nombre y apellidos</span>
                <p className={value}>{worker.name}</p>
              </div>
              <div>
                <span className={label}>Puesto</span>
                <p className={value}>{ROLE_LABEL[worker.jobRole] ?? worker.jobRole}</p>
              </div>
              <div>
                <span className={label}>Turno asignado</span>
                <p className={value}>{worker.onlyShift ? SHIFT_LABEL[worker.onlyShift] : "Cualquiera"}</p>
              </div>
              <div>
                <span className={label}>Teléfono</span>
                <p className={value}>{worker.phone || "—"}</p>
              </div>
              <div>
                <span className={label}>Turno de noche</span>
                <p className={value}>{worker.noNight ? "No realiza" : "Sí"}</p>
              </div>
            </div>

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
              <form action={uploadMyPhotoAction} className="mt-2 flex flex-col items-center gap-1">
                <input
                  type="file"
                  name="photo"
                  accept="image/*"
                  required
                  className="w-28 font-mono text-[10px] text-[#3a2f1d] file:mr-1 file:cursor-pointer file:rounded file:border-0 file:bg-[#7a4a3a] file:px-2 file:py-1 file:font-mono file:text-[10px] file:text-[#f4ecd8]"
                />
                <button className="rounded bg-[#7a4a3a] px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-[#f4ecd8] hover:bg-[#693e30]">
                  Subir foto
                </button>
              </form>
              {photoUrl && (
                <form action={deleteMyPhotoAction}>
                  <button className="mt-1 font-mono text-[10px] text-[#8b2e22] underline">Quitar</button>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* VACACIONES */}
        <div className="mt-5 border-[3px] border-double border-[#7a6a45] bg-[#f4ecd8] p-6 shadow-[0_10px_30px_rgba(80,60,20,0.2)]">
          <h3 className="mb-3 border-b border-[#a08a5e] pb-2 font-serif text-lg font-bold uppercase tracking-wide text-[#3a2f1d]">
            Mis vacaciones
          </h3>
          {vacs.length === 0 ? (
            <p className="font-mono text-sm text-[#8a6d3b]">— Sin periodos registrados —</p>
          ) : (
            <ul className="divide-y divide-[#cdbd95]">
              {vacs.map((v) => (
                <li key={v.id} className="py-2 font-mono text-sm text-[#3a2f1d]">
                  {fmt(v.startDate)} &nbsp;→&nbsp; {fmt(v.endDate)}
                  {v.note ? <span className="text-[#8a6d3b]"> · {v.note}</span> : null}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* HOJA DE SERVICIO */}
        <div className="mt-5 border-[3px] border-double border-[#7a6a45] bg-[#f4ecd8] p-6 shadow-[0_10px_30px_rgba(80,60,20,0.2)]">
          <h3 className="mb-3 border-b border-[#a08a5e] pb-2 font-serif text-lg font-bold uppercase tracking-wide text-[#3a2f1d]">
            Hoja de servicio {data ? `· ${MONTHS[data.month]} ${data.year}` : ""}
          </h3>
          {row ? (
            <div className="flex flex-wrap gap-2 font-mono text-xs text-[#3a2f1d]">
              <span className="rounded bg-[#d8e9dc] px-2 py-1">Mañanas: <strong>{counts.M}</strong></span>
              <span className="rounded bg-[#f6e7c4] px-2 py-1">Tardes: <strong>{counts.T}</strong></span>
              <span className="rounded bg-[#dcdcf0] px-2 py-1">Noches: <strong>{counts.N}</strong></span>
              <span className="rounded bg-[#e7e0cf] px-2 py-1">Descansos: <strong>{counts.D}</strong></span>
              <span className="rounded bg-[#cfe6f2] px-2 py-1">Vacaciones: <strong>{counts.V}</strong></span>
            </div>
          ) : (
            <p className="font-mono text-sm text-[#8a6d3b]">No apareces en el último cuadrante.</p>
          )}
          <p className="mt-3 font-mono text-[11px] text-[#8a6d3b]">
            Para ver tus turnos día a día, entra en <a href="/mi-turno" className="underline">Mi turno</a>.
          </p>
        </div>
      </main>
    </div>
  );
}
