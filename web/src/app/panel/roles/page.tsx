import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSession, isStaffAdmin } from "@/lib/session";
import { getCurrentTenant } from "@/lib/tenant";
import { requireAcademiaPanel } from "@/lib/panel-guard";
import { STAFF_ROLES, STAFF_ROLE_LABEL, listCenterAdmins, setStaffRole, getStaffRole } from "@/lib/staff-roles";
import TopBar from "@/components/TopBar";

/** Solo dirección/subdirección (o el superadmin) gestionan los roles del centro. */
async function canManageRoles(userId: string, role: string): Promise<boolean> {
  if (role === "superadmin") return true;
  const sr = await getStaffRole(userId);
  return sr === "direccion" || sr === "subdireccion";
}

async function setRoleAction(formData: FormData) {
  "use server";
  const session = await getSession();
  if (!session || !isStaffAdmin(session.role)) redirect("/login");
  const tenant = await getCurrentTenant();
  if (!tenant || !(await canManageRoles(session.userId, session.role))) redirect("/panel/roles");
  const userId = String(formData.get("userId") ?? "");
  const staffRole = String(formData.get("staffRole") ?? "") || null;
  if (userId) await setStaffRole(tenant.id, userId, staffRole);
  revalidatePath("/panel/roles");
  redirect("/panel/roles");
}

export default async function RolesPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!isStaffAdmin(session.role)) redirect("/mi-turno");
  await requireAcademiaPanel();
  const tenant = await getCurrentTenant();
  const admins = tenant ? await listCenterAdmins(tenant.id) : [];
  const canManage = await canManageRoles(session.userId, session.role);

  return (
    <div className="min-h-screen bg-[#faf6ee]">
      <TopBar name={session.name} role={session.role} tenantName={tenant?.name} logoUrl={tenant?.logoUrl} />
      <main className="mx-auto max-w-3xl space-y-5 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Roles del centro</h1>
            <p className="text-sm text-slate-500">Asigna a cada cuenta su función: Dirección, Subdirección o Secretaría.</p>
          </div>
          <a href="/panel/horas" className="text-sm font-medium text-cyan-700 hover:underline">← Control de horas</a>
        </div>

        {!canManage && (
          <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
            Solo Dirección o Subdirección pueden cambiar los roles. Puedes consultarlos.
          </p>
        )}

        <section className="overflow-x-auto rounded-xl border border-[#e7dcc4] bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">Cuenta</th><th className="px-3 py-3">Rol actual</th><th className="px-3 py-3">Asignar</th>
              </tr>
            </thead>
            <tbody>
              {admins.map((a) => (
                <tr key={a.id} className="border-b border-slate-100">
                  <td className="px-4 py-2">
                    <div className="font-medium text-slate-800">{a.name || "—"}</div>
                    <div className="text-xs text-slate-400">{a.email}</div>
                  </td>
                  <td className="px-3 py-2">
                    {a.staffRole
                      ? <span className="rounded bg-cyan-100 px-2 py-0.5 text-xs font-medium text-cyan-800">{STAFF_ROLE_LABEL[a.staffRole] ?? a.staffRole}</span>
                      : <span className="text-xs text-slate-400">Sin rol</span>}
                  </td>
                  <td className="px-3 py-2">
                    {canManage ? (
                      <form action={setRoleAction} className="flex items-center gap-2">
                        <input type="hidden" name="userId" value={a.id} />
                        <select name="staffRole" defaultValue={a.staffRole ?? ""} className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm">
                          <option value="">Sin rol</option>
                          {STAFF_ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                        </select>
                        <button className="rounded-lg bg-cyan-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-cyan-800">Guardar</button>
                      </form>
                    ) : <span className="text-xs text-slate-300">—</span>}
                  </td>
                </tr>
              ))}
              {admins.length === 0 && <tr><td colSpan={3} className="px-4 py-6 text-center text-sm text-slate-400">No hay cuentas de administración en este centro todavía.</td></tr>}
            </tbody>
          </table>
        </section>

        <p className="text-xs text-slate-400">
          Las cuentas de administración se crean desde el área de superadministración. Aquí solo se les asigna su función.
          La <strong>Secretaría de Dirección</strong> no puede cerrar cursos. El reparto y los correos usarán estos roles.
        </p>
      </main>
    </div>
  );
}
