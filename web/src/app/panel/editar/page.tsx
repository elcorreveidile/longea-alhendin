import { redirect } from "next/navigation";
import { getSession, isStaffAdmin } from "@/lib/session";
import { getCurrentTenant } from "@/lib/tenant";
import { getLatestCuadrante, saveCuadrante } from "@/db/cuadrantes";
import TopBar from "@/components/TopBar";
import EditableCuadrante from "@/components/EditableCuadrante";
import { CuadranteData } from "@/components/Cuadrante";

async function saveEditAction(formData: FormData) {
  "use server";
  const tenant = await getCurrentTenant();
  if (!tenant) redirect("/panel");
  const row = await getLatestCuadrante(tenant.id);
  if (!row) redirect("/panel");
  let assignments: Record<string, string[]>;
  try {
    assignments = JSON.parse(String(formData.get("assignments") ?? "{}"));
  } catch {
    redirect("/panel/editar?err=1");
  }
  const data = { ...(row.data as object), assignments };
  await saveCuadrante(tenant.id, row.year, row.month, data as never);
  redirect("/panel/editar?ok=1");
}

export default async function EditarPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; err?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!isStaffAdmin(session.role)) redirect("/mi-turno");

  const sp = await searchParams;
  const tenant = await getCurrentTenant();
  const saved = tenant ? await getLatestCuadrante(tenant.id) : null;
  const data = saved ? (saved.data as unknown as CuadranteData) : null;

  return (
    <div className="min-h-screen bg-slate-50">
      <TopBar name={session.name} role={session.role} tenantName={tenant?.name} logoUrl={tenant?.logoUrl} />
      <main className="mx-auto max-w-[1400px] space-y-4 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800">Editar cuadrante</h2>
          <a href="/panel" className="text-sm font-medium text-cyan-700 hover:underline">← Volver al panel</a>
        </div>

        {sp.ok && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
            ✓ Cambios guardados.
          </div>
        )}
        {sp.err && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            No se pudieron guardar los cambios.
          </div>
        )}

        {data ? (
          <EditableCuadrante data={data} action={saveEditAction} />
        ) : (
          <p className="rounded-lg bg-white p-4 text-sm text-slate-500 shadow-sm">
            No hay cuadrante para editar. Genera uno primero desde el panel.
          </p>
        )}
      </main>
    </div>
  );
}
