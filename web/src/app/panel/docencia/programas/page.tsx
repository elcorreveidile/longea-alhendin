import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSession, isStaffAdmin } from "@/lib/session";
import { getCurrentTenant } from "@/lib/tenant";
import { requireAcademiaPanel } from "@/lib/panel-guard";
import { courseYearStart, courseYearLabel } from "@/data/hour-concepts";
import { listPrograms, addProgram, deleteProgram, listTerms, addTerm, deleteTerm } from "@/db/docencia";
import ConfirmButton from "@/components/ConfirmButton";
import TopBar from "@/components/TopBar";

const KINDS = [
  { value: "intensivo", label: "Intensivo" },
  { value: "semestral", label: "Semestral (otoño/primavera)" },
  { value: "verano", label: "Verano" },
  { value: "colaboracion", label: "Colaboración" },
  { value: "examen", label: "Exámenes" },
  { value: "formacion", label: "Formación de profesores" },
  { value: "otro", label: "Otro" },
];
const KIND_LABEL: Record<string, string> = Object.fromEntries(KINDS.map((k) => [k.value, k.label]));
const input = "rounded-lg border border-slate-300 px-3 py-2 text-sm";

async function addProgramAction(formData: FormData) {
  "use server";
  const session = await getSession();
  if (!session || !isStaffAdmin(session.role)) redirect("/login");
  const tenant = await getCurrentTenant();
  const code = String(formData.get("code") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  if (tenant && code && name) {
    await addProgram({ tenantId: tenant.id, code, name, kind: String(formData.get("kind") ?? "otro") });
  }
  revalidatePath("/panel/docencia/programas");
  redirect("/panel/docencia/programas");
}

async function deleteProgramAction(formData: FormData) {
  "use server";
  const session = await getSession();
  if (!session || !isStaffAdmin(session.role)) redirect("/login");
  const tenant = await getCurrentTenant();
  const id = String(formData.get("id") ?? "");
  if (tenant && id) await deleteProgram(tenant.id, id);
  revalidatePath("/panel/docencia/programas");
  redirect("/panel/docencia/programas");
}

async function addTermAction(formData: FormData) {
  "use server";
  const session = await getSession();
  if (!session || !isStaffAdmin(session.role)) redirect("/login");
  const tenant = await getCurrentTenant();
  const programId = String(formData.get("programId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const courseYear = Number(formData.get("courseYear"));
  if (tenant && programId && name && courseYear) {
    await addTerm({
      tenantId: tenant.id, programId, name, courseYear,
      startDate: String(formData.get("startDate") ?? "") || null,
      endDate: String(formData.get("endDate") ?? "") || null,
    });
  }
  revalidatePath("/panel/docencia/programas");
  redirect("/panel/docencia/programas");
}

async function deleteTermAction(formData: FormData) {
  "use server";
  const session = await getSession();
  if (!session || !isStaffAdmin(session.role)) redirect("/login");
  const tenant = await getCurrentTenant();
  const id = String(formData.get("id") ?? "");
  if (tenant && id) await deleteTerm(tenant.id, id);
  revalidatePath("/panel/docencia/programas");
  redirect("/panel/docencia/programas");
}

export default async function ProgramasPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!isStaffAdmin(session.role)) redirect("/mi-turno");
  await requireAcademiaPanel();
  const tenant = await getCurrentTenant();

  const [programs, terms] = tenant ? await Promise.all([listPrograms(tenant.id), listTerms(tenant.id)]) : [[], []];
  const nowYear = courseYearStart(new Date());

  return (
    <div className="min-h-screen bg-[#faf6ee]">
      <TopBar name={session.name} role={session.role} tenantName={tenant?.name} logoUrl={tenant?.logoUrl} />
      <main className="mx-auto max-w-[1100px] space-y-6 p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900">Programas y ediciones</h1>
          <a href="/panel/docencia" className="text-sm font-medium text-cyan-700 hover:underline">← Docencia</a>
        </div>

        {/* Programas */}
        <section className="rounded-xl border border-[#e7dcc4] bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-slate-800">Programas</h2>
          <form action={addProgramAction} className="mt-3 flex flex-wrap items-end gap-3">
            <label className="text-sm">Código<input name="code" required placeholder="CEH" className={`${input} mt-1 block w-24`} /></label>
            <label className="text-sm">Nombre<input name="name" required placeholder="Curso de Estudios Hispánicos" className={`${input} mt-1 block w-72`} /></label>
            <label className="text-sm">Tipo
              <select name="kind" className={`${input} mt-1 block`}>{KINDS.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}</select>
            </label>
            <button className="rounded-lg bg-cyan-700 px-5 py-2 text-sm font-semibold text-white hover:bg-cyan-800">Añadir</button>
          </form>

          <ul className="mt-4 divide-y divide-slate-100">
            {programs.map((p) => (
              <li key={p.id} className="flex items-center justify-between py-2 text-sm">
                <span><strong className="text-slate-800">{p.code}</strong> · {p.name} <span className="ml-2 rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-500">{KIND_LABEL[p.kind] ?? p.kind}</span></span>
                <form action={deleteProgramAction}>
                  <input type="hidden" name="id" value={p.id} />
                  <ConfirmButton confirm={`¿Borrar el programa ${p.code}? Se borran también sus ediciones y grupos.`} className="rounded border border-red-200 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50">Borrar</ConfirmButton>
                </form>
              </li>
            ))}
            {programs.length === 0 && <li className="py-3 text-sm text-slate-400">Sin programas todavía.</li>}
          </ul>
        </section>

        {/* Ediciones */}
        <section className="rounded-xl border border-[#e7dcc4] bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-slate-800">Ediciones</h2>
          {programs.length === 0 ? (
            <p className="mt-2 text-sm text-slate-400">Crea antes un programa.</p>
          ) : (
            <form action={addTermAction} className="mt-3 flex flex-wrap items-end gap-3">
              <label className="text-sm">Programa
                <select name="programId" required className={`${input} mt-1 block`}>{programs.map((p) => <option key={p.id} value={p.id}>{p.code}</option>)}</select>
              </label>
              <label className="text-sm">Nombre<input name="name" required placeholder="CEH Otoño 2026" className={`${input} mt-1 block w-56`} /></label>
              <label className="text-sm">Curso (año inicio)<input name="courseYear" type="number" defaultValue={nowYear} required className={`${input} mt-1 block w-28`} /></label>
              <label className="text-sm">Desde<input name="startDate" type="date" className={`${input} mt-1 block`} /></label>
              <label className="text-sm">Hasta<input name="endDate" type="date" className={`${input} mt-1 block`} /></label>
              <button className="rounded-lg bg-cyan-700 px-5 py-2 text-sm font-semibold text-white hover:bg-cyan-800">Añadir</button>
            </form>
          )}

          <ul className="mt-4 divide-y divide-slate-100">
            {terms.map((t) => (
              <li key={t.id} className="flex items-center justify-between py-2 text-sm">
                <span><strong className="text-slate-800">{t.name}</strong> <span className="text-slate-400">· {t.programCode} · curso {courseYearLabel(t.courseYear)}{t.startDate ? ` · ${t.startDate}→${t.endDate ?? "?"}` : ""}</span></span>
                <form action={deleteTermAction}>
                  <input type="hidden" name="id" value={t.id} />
                  <ConfirmButton confirm={`¿Borrar la edición ${t.name}? Se borran también sus grupos.`} className="rounded border border-red-200 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50">Borrar</ConfirmButton>
                </form>
              </li>
            ))}
            {terms.length === 0 && <li className="py-3 text-sm text-slate-400">Sin ediciones todavía.</li>}
          </ul>
        </section>
      </main>
    </div>
  );
}
