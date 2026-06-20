import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSession, isStaffAdmin } from "@/lib/session";
import { getCurrentTenant } from "@/lib/tenant";
import { requireAcademiaPanel } from "@/lib/panel-guard";
import { listSubjects, addSubject, deleteSubject } from "@/db/docencia";
import ConfirmButton from "@/components/ConfirmButton";
import TopBar from "@/components/TopBar";

const AREAS = ["Lengua", "Literatura", "Geografía", "Historia", "Historia del Arte", "Cultura", "Sociología, Política y Economía", "Ciencia y Tecnología", "Derecho", "Prácticas"];
const LANGS: Record<string, string> = { es: "Español", en: "Inglés", "es,en": "Español e inglés" };
const input = "rounded-lg border border-slate-300 px-3 py-2 text-sm";

async function addSubjectAction(formData: FormData) {
  "use server";
  const session = await getSession();
  if (!session || !isStaffAdmin(session.role)) redirect("/login");
  const tenant = await getCurrentTenant();
  const name = String(formData.get("name") ?? "").trim();
  if (tenant && name) {
    await addSubject({
      tenantId: tenant.id, name,
      area: String(formData.get("area") ?? "") || null,
      languages: String(formData.get("languages") ?? "es"),
      levelMin: String(formData.get("levelMin") ?? "") || null,
      levelMax: String(formData.get("levelMax") ?? "") || null,
      staffing: String(formData.get("staffing") ?? "abierta"),
    });
  }
  revalidatePath("/panel/docencia/asignaturas");
  redirect("/panel/docencia/asignaturas");
}

async function deleteSubjectAction(formData: FormData) {
  "use server";
  const session = await getSession();
  if (!session || !isStaffAdmin(session.role)) redirect("/login");
  const tenant = await getCurrentTenant();
  const id = String(formData.get("id") ?? "");
  if (tenant && id) await deleteSubject(tenant.id, id);
  revalidatePath("/panel/docencia/asignaturas");
  redirect("/panel/docencia/asignaturas");
}

export default async function AsignaturasPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!isStaffAdmin(session.role)) redirect("/mi-turno");
  await requireAcademiaPanel();
  const tenant = await getCurrentTenant();
  const subjects = tenant ? await listSubjects(tenant.id) : [];

  return (
    <div className="min-h-screen bg-[#faf6ee]">
      <TopBar name={session.name} role={session.role} tenantName={tenant?.name} logoUrl={tenant?.logoUrl} />
      <main className="mx-auto max-w-[1100px] space-y-6 p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900">Asignaturas</h1>
          <a href="/panel/docencia" className="text-sm font-medium text-cyan-700 hover:underline">← Docencia</a>
        </div>

        <section className="rounded-xl border border-[#e7dcc4] bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-slate-800">Añadir asignatura</h2>
          <form action={addSubjectAction} className="mt-3 flex flex-wrap items-end gap-3">
            <label className="text-sm">Nombre<input name="name" required placeholder="Historia de España" className={`${input} mt-1 block w-64`} /></label>
            <label className="text-sm">Área
              <select name="area" className={`${input} mt-1 block`}><option value="">—</option>{AREAS.map((a) => <option key={a} value={a}>{a}</option>)}</select>
            </label>
            <label className="text-sm">Idioma
              <select name="languages" className={`${input} mt-1 block`}><option value="es">Español</option><option value="en">Inglés</option><option value="es,en">Español e inglés</option></select>
            </label>
            <label className="text-sm">Nivel mín.<input name="levelMin" placeholder="B1" className={`${input} mt-1 block w-20`} /></label>
            <label className="text-sm">Nivel máx.<input name="levelMax" placeholder="C2" className={`${input} mt-1 block w-20`} /></label>
            <label className="text-sm">Dotación
              <select name="staffing" className={`${input} mt-1 block`}><option value="abierta">Abierta</option><option value="fija">Fija (titulares)</option></select>
            </label>
            <button className="rounded-lg bg-cyan-700 px-5 py-2 text-sm font-semibold text-white hover:bg-cyan-800">Añadir</button>
          </form>
        </section>

        <section className="overflow-x-auto rounded-xl border border-[#e7dcc4] bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">Asignatura</th><th className="px-3 py-3">Área</th><th className="px-3 py-3">Idioma</th><th className="px-3 py-3">Nivel</th><th className="px-3 py-3">Dotación</th><th className="px-3 py-3" />
              </tr>
            </thead>
            <tbody>
              {subjects.map((s) => (
                <tr key={s.id} className="border-b border-slate-100">
                  <td className="px-4 py-2 font-medium text-slate-800">{s.name}</td>
                  <td className="px-3 py-2 text-slate-500">{s.area ?? "—"}</td>
                  <td className="px-3 py-2 text-slate-500">{LANGS[s.languages] ?? s.languages}</td>
                  <td className="px-3 py-2 text-slate-500">{s.levelMin || s.levelMax ? `${s.levelMin ?? ""}${s.levelMax ? `–${s.levelMax}` : ""}` : "—"}</td>
                  <td className="px-3 py-2"><span className={`rounded px-2 py-0.5 text-xs ${s.staffing === "fija" ? "bg-violet-100 text-violet-700" : "bg-slate-100 text-slate-500"}`}>{s.staffing}</span></td>
                  <td className="px-3 py-2 text-right">
                    <form action={deleteSubjectAction}>
                      <input type="hidden" name="id" value={s.id} />
                      <ConfirmButton confirm={`¿Borrar la asignatura ${s.name}?`} className="rounded border border-red-200 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50">Borrar</ConfirmButton>
                    </form>
                  </td>
                </tr>
              ))}
              {subjects.length === 0 && <tr><td colSpan={6} className="px-4 py-6 text-center text-sm text-slate-400">Sin asignaturas todavía.</td></tr>}
            </tbody>
          </table>
        </section>
      </main>
    </div>
  );
}
