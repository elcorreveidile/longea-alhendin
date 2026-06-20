import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getSession, isStaffAdmin } from "@/lib/session";
import { getCurrentTenant } from "@/lib/tenant";
import { requireAcademiaPanel } from "@/lib/panel-guard";
import { STAFF_ROLES, STAFF_ROLE_LABEL, listCenterAdmins, setStaffRole, getStaffRole } from "@/lib/staff-roles";
import ConfirmButton from "@/components/ConfirmButton";
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

/** Crear/habilitar una cuenta del centro. SOLO el superadministrador. */
async function createAdminAction(formData: FormData) {
  "use server";
  const session = await getSession();
  if (!session || session.role !== "superadmin") redirect("/login");
  const tenant = await getCurrentTenant();
  if (!tenant) redirect("/panel/roles");
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const name = String(formData.get("name") ?? "").trim() || null;
  const staffRole = STAFF_ROLES.some((r) => r.value === formData.get("staffRole")) ? String(formData.get("staffRole")) : null;
  if (!email.includes("@")) redirect("/panel/roles?m=mail");

  const existing = (await db.select({ id: users.id, role: users.role }).from(users).where(eq(users.email, email)).limit(1))[0];
  if (existing) {
    if (existing.role === "superadmin") redirect("/panel/roles?m=super");
    await db.update(users).set({ role: "admin", tenantId: tenant.id, staffRole, ...(name ? { name } : {}) }).where(eq(users.id, existing.id));
    revalidatePath("/panel/roles");
    redirect("/panel/roles?m=asignada");
  }
  await db.insert(users).values({ email, name, role: "admin", tenantId: tenant.id, staffRole });
  revalidatePath("/panel/roles");
  redirect("/panel/roles?m=creada");
}

/** Cambiar nombre y/o correo de una cuenta del centro. SOLO el superadministrador. */
async function renameAction(formData: FormData) {
  "use server";
  const session = await getSession();
  if (!session || session.role !== "superadmin") redirect("/login");
  const tenant = await getCurrentTenant();
  if (!tenant) redirect("/panel/roles");
  const userId = String(formData.get("userId") ?? "");
  const name = String(formData.get("name") ?? "").trim() || null;
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!userId) redirect("/panel/roles");
  if (!email.includes("@")) redirect("/panel/roles?m=mail");
  // El correo es el identificador de acceso: no puede coincidir con otra cuenta.
  const clash = (await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1))[0];
  if (clash && clash.id !== userId) redirect("/panel/roles?m=correoexiste");
  await db.update(users).set({ name, email }).where(and(eq(users.id, userId), eq(users.tenantId, tenant.id)));
  revalidatePath("/panel/roles");
  redirect("/panel/roles?m=actualizada");
}

/** Suprimir una cuenta del centro. SOLO el superadministrador. No borra superadmins ni la propia. */
async function deleteAdminAction(formData: FormData) {
  "use server";
  const session = await getSession();
  if (!session || session.role !== "superadmin") redirect("/login");
  const tenant = await getCurrentTenant();
  if (!tenant) redirect("/panel/roles");
  const userId = String(formData.get("userId") ?? "");
  if (!userId || userId === session.userId) redirect("/panel/roles");
  const target = (await db.select({ role: users.role }).from(users).where(eq(users.id, userId)).limit(1))[0];
  if (!target || target.role === "superadmin") redirect("/panel/roles");
  await db.delete(users).where(and(eq(users.id, userId), eq(users.tenantId, tenant.id), eq(users.role, "admin")));
  revalidatePath("/panel/roles");
  redirect("/panel/roles?m=suprimida");
}

const MSG: Record<string, { ok: boolean; text: string }> = {
  creada: { ok: true, text: "✓ Cuenta creada. Entrará con el enlace mágico que reciba al iniciar sesión con su correo." },
  asignada: { ok: true, text: "✓ Esa cuenta ya existía y ahora pertenece a este centro con el rol indicado." },
  renombrada: { ok: true, text: "✓ Nombre actualizado." },
  actualizada: { ok: true, text: "✓ Cuenta actualizada (nombre y correo)." },
  correoexiste: { ok: false, text: "Ese correo ya pertenece a otra cuenta. Usa uno distinto." },
  suprimida: { ok: true, text: "✓ Cuenta suprimida del centro." },
  mail: { ok: false, text: "Introduce un correo válido." },
  super: { ok: false, text: "Ese correo es de un superadministrador; no se puede asignar como cuenta del centro." },
};

export default async function RolesPage({ searchParams }: { searchParams: Promise<{ m?: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!isStaffAdmin(session.role)) redirect("/mi-turno");
  await requireAcademiaPanel();
  const tenant = await getCurrentTenant();
  const admins = tenant ? await listCenterAdmins(tenant.id) : [];
  const canManage = await canManageRoles(session.userId, session.role);
  const isSuper = session.role === "superadmin";
  const sp = await searchParams;
  const msg = sp.m ? MSG[sp.m] : null;

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

        {msg && (
          <p className={`rounded-lg p-3 text-sm ${msg.ok ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800"}`}>{msg.text}</p>
        )}

        {!canManage && (
          <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
            Solo Dirección o Subdirección pueden cambiar los roles. Puedes consultarlos.
          </p>
        )}

        {isSuper && (
          <section className="rounded-xl border border-cyan-200 bg-cyan-50/50 p-4">
            <h2 className="text-sm font-semibold text-slate-800">Añadir cuenta al centro</h2>
            <p className="mb-3 text-xs text-slate-500">Solo el superadministrador crea cuentas. Entrará con enlace mágico al iniciar sesión con su correo.</p>
            <form action={createAdminAction} className="flex flex-wrap items-end gap-2">
              <label className="flex flex-col text-xs text-slate-600">Correo
                <input name="email" type="email" required placeholder="informa@blablaele.com" className="mt-1 w-64 rounded-lg border border-slate-300 px-2 py-1.5 text-sm" />
              </label>
              <label className="flex flex-col text-xs text-slate-600">Nombre (opcional)
                <input name="name" type="text" className="mt-1 w-44 rounded-lg border border-slate-300 px-2 py-1.5 text-sm" />
              </label>
              <label className="flex flex-col text-xs text-slate-600">Rol
                <select name="staffRole" defaultValue="" className="mt-1 rounded-lg border border-slate-300 px-2 py-1.5 text-sm">
                  <option value="">Sin rol</option>
                  {STAFF_ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </label>
              <button className="rounded-lg bg-cyan-700 px-3 py-2 text-xs font-semibold text-white hover:bg-cyan-800">Crear cuenta</button>
            </form>
          </section>
        )}

        <section className="overflow-x-auto rounded-xl border border-[#e7dcc4] bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">Cuenta</th><th className="px-3 py-3">Rol actual</th><th className="px-3 py-3">Asignar</th>
                {isSuper && <th className="px-3 py-3">Cuenta (superadmin)</th>}
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
                  {isSuper && (
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <form action={renameAction} className="flex flex-wrap items-center gap-1">
                          <input type="hidden" name="userId" value={a.id} />
                          <input name="name" defaultValue={a.name ?? ""} placeholder="Nombre" className="w-28 rounded-lg border border-slate-300 px-2 py-1.5 text-sm" />
                          <input name="email" type="email" defaultValue={a.email ?? ""} placeholder="Correo" className="w-44 rounded-lg border border-slate-300 px-2 py-1.5 text-sm" />
                          <button className="rounded-lg border border-slate-300 px-2 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50">Guardar</button>
                        </form>
                        {a.id !== session.userId && (
                          <form action={deleteAdminAction}>
                            <input type="hidden" name="userId" value={a.id} />
                            <ConfirmButton
                              confirm={`¿Suprimir la cuenta de ${a.name || a.email}? Perderá el acceso al centro.`}
                              className="rounded-lg border border-rose-200 px-2 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50"
                            >
                              Suprimir
                            </ConfirmButton>
                          </form>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {admins.length === 0 && <tr><td colSpan={isSuper ? 4 : 3} className="px-4 py-6 text-center text-sm text-slate-400">No hay cuentas de administración en este centro todavía.</td></tr>}
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
