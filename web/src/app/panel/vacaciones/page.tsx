import { redirect } from "next/navigation";
import { asc, eq, inArray } from "drizzle-orm";
import { getSession, isStaffAdmin } from "@/lib/session";
import { getCurrentTenant } from "@/lib/tenant";
import { db } from "@/db";
import { workers as workersT, vacations as vacationsT } from "@/db/schema";
import TopBar from "@/components/TopBar";

const MONTHS = [
  "", "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];
const WD = ["L", "M", "X", "J", "V", "S", "D"];

export default async function VacacionesPage({
  searchParams,
}: {
  searchParams: Promise<{ y?: string; m?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!isStaffAdmin(session.role)) redirect("/mi-turno");

  const sp = await searchParams;
  const now = new Date();
  const year = Number(sp.y) || now.getFullYear();
  const month = Number(sp.m) || now.getMonth() + 1;
  const tenant = await getCurrentTenant();

  const wk = tenant
    ? await db.select().from(workersT).where(eq(workersT.tenantId, tenant.id)).orderBy(asc(workersT.name))
    : [];
  const ids = wk.map((w) => w.id);
  const vacs = ids.length
    ? await db.select().from(vacationsT).where(inArray(vacationsT.workerId, ids))
    : [];

  // Días del mes y, por trabajadora, qué días está de vacaciones.
  const days = new Date(year, month, 0).getDate();
  const firstWd = (new Date(year, month - 1, 1).getDay() + 6) % 7; // 0=lunes
  const monthStart = `${year}-${String(month).padStart(2, "0")}-01`;
  const monthEnd = `${year}-${String(month).padStart(2, "0")}-${String(days).padStart(2, "0")}`;

  const byWorker = new Map<string, Set<number>>();
  for (const v of vacs) {
    if (v.endDate < monthStart || v.startDate > monthEnd) continue;
    const set = byWorker.get(v.workerId) ?? new Set<number>();
    for (let d = 1; d <= days; d++) {
      const iso = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      if (iso >= v.startDate && iso <= v.endDate) set.add(d);
    }
    byWorker.set(v.workerId, set);
  }

  const rows = wk.filter((w) => (byWorker.get(w.id)?.size ?? 0) > 0);
  const perDay = Array.from({ length: days }, (_, i) =>
    rows.reduce((acc, w) => acc + (byWorker.get(w.id)?.has(i + 1) ? 1 : 0), 0),
  );

  const prev = month === 1 ? { y: year - 1, m: 12 } : { y: year, m: month - 1 };
  const next = month === 12 ? { y: year + 1, m: 1 } : { y: year, m: month + 1 };
  const wdLetter = (d: number) => WD[(firstWd + d - 1) % 7];

  return (
    <div className="min-h-screen bg-slate-50">
      <TopBar name={session.name} role={session.role} tenantName={tenant?.name} logoUrl={tenant?.logoUrl} />
      <main className="mx-auto max-w-[1400px] space-y-5 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800">Vacaciones del equipo</h2>
          <a href="/panel" className="text-sm font-medium text-cyan-700 hover:underline">← Volver al panel</a>
        </div>

        <div className="flex items-center gap-3">
          <a href={`/panel/vacaciones?y=${prev.y}&m=${prev.m}`} className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm hover:bg-slate-50">← {MONTHS[prev.m]}</a>
          <span className="font-semibold capitalize text-slate-700">{MONTHS[month]} {year}</span>
          <a href={`/panel/vacaciones?y=${next.y}&m=${next.m}`} className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm hover:bg-slate-50">{MONTHS[next.m]} →</a>
        </div>

        {rows.length === 0 ? (
          <p className="rounded-lg bg-white p-4 text-sm text-slate-500 shadow-sm">
            Nadie tiene vacaciones en {MONTHS[month]} de {year}.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
            <table className="border-collapse text-[11px]">
              <thead>
                <tr className="bg-cyan-700 text-white">
                  <th className="sticky left-0 z-10 bg-cyan-700 px-3 py-2 text-left font-semibold">
                    {MONTHS[month]} {year}
                  </th>
                  {Array.from({ length: days }, (_, i) => {
                    const wd = wdLetter(i + 1);
                    const weekend = wd === "S" || wd === "D";
                    return (
                      <th key={i} className={`px-1 py-1 text-center font-medium ${weekend ? "bg-cyan-800" : ""}`}>
                        <div className="opacity-80">{wd}</div>
                        {i + 1}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {rows.map((w) => {
                  const set = byWorker.get(w.id)!;
                  return (
                    <tr key={w.id} className="border-t border-slate-100">
                      <td className="sticky left-0 z-10 whitespace-nowrap bg-white px-3 py-1 font-medium text-slate-700">
                        <a href={`/panel/plantilla/${w.id}`} className="hover:underline">{w.name}</a>
                      </td>
                      {Array.from({ length: days }, (_, i) => (
                        <td key={i} className="p-0.5 text-center">
                          {set.has(i + 1) ? (
                            <span className="inline-block h-5 w-6 rounded bg-sky-400" title="Vacaciones" />
                          ) : (
                            <span className="inline-block h-5 w-6" />
                          )}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-300 bg-slate-50 text-[10px] font-semibold text-slate-600">
                  <td className="sticky left-0 z-10 bg-slate-50 px-3 py-1">Personas de vacaciones</td>
                  {perDay.map((n, i) => (
                    <td key={i} className={`px-1 py-1 text-center ${n >= 3 ? "bg-amber-200 text-amber-900" : ""}`}>
                      {n || ""}
                    </td>
                  ))}
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        <p className="text-xs text-slate-400">
          En azul, los días de vacaciones de cada persona. La fila inferior cuenta cuántas coinciden cada día
          (en ámbar si hay 3 o más, para detectar solapes).
        </p>
      </main>
    </div>
  );
}
