import { redirect } from "next/navigation";
import { getSession, isStaffAdmin } from "@/lib/session";
import { getCurrentTenant } from "@/lib/tenant";
import { getWeek, saveWeek } from "@/lib/week-cuadrantes";
import TopBar from "@/components/TopBar";
import EditableWeek from "@/components/EditableWeek";

async function saveWeekEditAction(formData: FormData) {
  "use server";
  const tenant = await getCurrentTenant();
  if (!tenant) redirect("/panel/semana");
  const start = String(formData.get("start") ?? "");
  if (!start) redirect("/panel/semana");
  const week = await getWeek(tenant!.id, start);
  if (!week) redirect("/panel/semana");
  let assignments: Record<string, string[]>;
  try {
    assignments = JSON.parse(String(formData.get("assignments") ?? "{}"));
  } catch {
    redirect(`/panel/semana/editar?d=${start}&err=1`);
  }
  await saveWeek(tenant!.id, start, { ...week, assignments });
  redirect(`/panel/semana?d=${start}&gen=ok`);
}

export default async function EditarSemanaPage({
  searchParams,
}: {
  searchParams: Promise<{ d?: string; err?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!isStaffAdmin(session.role)) redirect("/mi-turno");

  const sp = await searchParams;
  const tenant = await getCurrentTenant();
  const start = sp.d ?? "";
  const week = tenant && start ? await getWeek(tenant.id, start) : null;

  return (
    <div className="min-h-screen bg-slate-50">
      <TopBar name={session.name} role={session.role} tenantName={tenant?.name} logoUrl={tenant?.logoUrl} />
      <main className="mx-auto max-w-[1400px] space-y-4 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800">Editar semana</h2>
          <a href={`/panel/semana${start ? `?d=${start}` : ""}`} className="text-sm font-medium text-cyan-700 hover:underline">
            ← Volver
          </a>
        </div>

        {sp.err && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            No se pudieron guardar los cambios.
          </div>
        )}

        {week ? (
          <EditableWeek data={week} action={saveWeekEditAction} />
        ) : (
          <p className="rounded-lg bg-white p-4 text-sm text-slate-500 shadow-sm">
            No hay semana para editar. Genera una primero.
          </p>
        )}
      </main>
    </div>
  );
}
