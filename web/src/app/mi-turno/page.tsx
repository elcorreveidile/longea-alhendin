import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getCurrentTenant } from "@/lib/tenant";
import TopBar from "@/components/TopBar";
import { shiftDef } from "@/data/shifts";
import sample from "@/data/sample-cuadrante.json";
import { CuadranteData } from "@/components/Cuadrante";
import { getCuadrante, listCuadranteMonths } from "@/db/cuadrantes";
import DownloadMyMonthButton from "@/components/DownloadMyMonthButton";

const MONTH_NAMES = [
  "", "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];
const WEEK = ["L", "M", "X", "J", "V", "S", "D"];
const WIDX: Record<string, number> = { L: 0, M: 1, X: 2, J: 3, V: 4, S: 5, D: 6 };
const HOURS: Record<string, string> = { M: "07:00–14:30", T: "14:30–22:00", N: "22:00–07:00" };
const FULL: Record<string, string> = { M: "Mañana", T: "Tarde", N: "Noche", D: "Descanso", V: "Vacaciones" };
const DAYNAME: Record<string, string> = {
  L: "lunes", M: "martes", X: "miércoles", J: "jueves", V: "viernes", S: "sábado", D: "domingo",
};

function isWork(code: string) {
  return !!code && (code.startsWith("M") || code === "T" || code === "N");
}

export default async function MiTurnoPage({
  searchParams,
}: {
  searchParams: Promise<{ y?: string; m?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const sp = await searchParams;
  const tenant = await getCurrentTenant();
  const months = tenant ? await listCuadranteMonths(tenant.id) : [];
  const wantY = Number(sp.y);
  const wantM = Number(sp.m);
  const pick = months.find((x) => x.year === wantY && x.month === wantM) ?? months[0] ?? null;
  const saved = tenant && pick ? await getCuadrante(tenant.id, pick.year, pick.month) : null;
  const data = (saved ? saved.data : sample) as unknown as CuadranteData;
  const linked = !!(session.workerId && data.assignments[session.workerId]);
  const myId = linked ? session.workerId! : Object.keys(data.assignments)[3];
  const row = data.assignments[myId] ?? [];
  const { year, month, days, weekdays } = data;

  const now = new Date();
  const isCurrentMonth = now.getFullYear() === year && now.getMonth() + 1 === month;
  const todayIdx = isCurrentMonth && now.getDate() - 1 < days ? now.getDate() - 1 : null;

  // Próximos turnos de trabajo (M/T/N)
  const from = todayIdx != null ? todayIdx + 1 : 0;
  const upcoming: { day: number; wl: string; code: string }[] = [];
  for (let i = from; i < days && upcoming.length < 6; i++) {
    if (isWork(row[i])) upcoming.push({ day: i + 1, wl: weekdays[i], code: row[i] });
  }

  // Resumen del mes
  const count = (pred: (c: string) => boolean) => row.filter(pred).length;
  const resumen = [
    { label: "Mañanas", n: count((c) => c.startsWith("M")), cls: shiftDef("M").className },
    { label: "Tardes", n: count((c) => c === "T"), cls: shiftDef("T").className },
    { label: "Noches", n: count((c) => c === "N"), cls: shiftDef("N").className },
    { label: "Descansos", n: count((c) => c === "D"), cls: shiftDef("D").className },
    { label: "Vacaciones", n: count((c) => c === "V"), cls: shiftDef("V").className },
  ];

  // Celdas del calendario alineadas L–D
  const firstCol = WIDX[weekdays[0]] ?? 0;
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstCol; i++) cells.push(null);
  for (let d = 1; d <= days; d++) cells.push(d);

  const todayCode = todayIdx != null ? row[todayIdx] : null;
  const tomorrowCode = todayIdx != null && todayIdx + 1 < days ? row[todayIdx + 1] : null;

  return (
    <div className="min-h-screen bg-[#faf6ee]">
      <TopBar name={session.name} role={session.role} tenantName={tenant?.name} logoUrl={tenant?.logoUrl} />
      <main className="mx-auto max-w-md space-y-4 p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-800">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icons/icon-mi-turno.png" alt="" className="h-7 w-7" />
            Mi turno
          </h2>
          <a href="/mi-ficha" className="flex items-center gap-1.5 text-sm font-medium text-cyan-700 hover:underline">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icons/icon-ficha.png" alt="" className="h-6 w-6" /> Mi ficha
          </a>
        </div>
        <p className="-mt-2 text-sm text-slate-500">{MONTH_NAMES[month]} {year}</p>

        {(months.length > 1 || (saved && linked)) && (
          <div className="flex flex-wrap items-center gap-2">
            {months.length > 1 && (
              <div className="flex flex-1 flex-wrap gap-1.5">
                {months.map((mo) => {
                  const on = mo.year === year && mo.month === month;
                  return (
                    <a
                      key={`${mo.year}-${mo.month}`}
                      href={`/mi-turno?y=${mo.year}&m=${mo.month}`}
                      className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
                        on ? "border-cyan-600 bg-cyan-50 text-cyan-800" : "border-slate-300 bg-white text-slate-600"
                      }`}
                    >
                      {MONTH_NAMES[mo.month].slice(0, 3)} {String(mo.year).slice(2)}
                    </a>
                  );
                })}
              </div>
            )}
            {saved && linked && row.length > 0 && (
              <DownloadMyMonthButton name={session.name ?? ""} year={year} month={month} weekdays={weekdays} row={row} />
            )}
          </div>
        )}

        {!linked && (
          <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
            {session.workerId
              ? `Todavía no apareces en el cuadrante de ${MONTH_NAMES[month]}.`
              : "Aún no tienes ficha enlazada (lo configura la administradora). Mostramos un ejemplo."}
          </p>
        )}

        {/* Hoy / Mañana */}
        {todayCode != null ? (
          <section className="overflow-hidden rounded-2xl bg-white shadow-sm">
            <div className={`p-5 ${shiftDef(todayCode).className}`}>
              <p className="text-xs font-medium uppercase tracking-wide opacity-70">
                Hoy · {DAYNAME[weekdays[todayIdx!]]} {todayIdx! + 1}
              </p>
              <p className="mt-1 text-3xl font-bold">{FULL[todayCode] ?? shiftDef(todayCode).label}</p>
              {HOURS[todayCode] && <p className="text-sm font-medium opacity-80">{HOURS[todayCode]}</p>}
            </div>
            {tomorrowCode != null && (
              <div className="flex items-center justify-between px-5 py-3 text-sm">
                <span className="text-slate-500">Mañana</span>
                <span className="font-semibold text-slate-700">
                  {FULL[tomorrowCode] ?? shiftDef(tomorrowCode).label}
                  {HOURS[tomorrowCode] ? ` · ${HOURS[tomorrowCode]}` : ""}
                </span>
              </div>
            )}
          </section>
        ) : (
          <section className="rounded-2xl bg-white p-4 text-sm text-slate-500 shadow-sm">
            Aquí verás tu turno de hoy cuando empiece <strong>{MONTH_NAMES[month]}</strong>.
          </section>
        )}

        {/* Próximos turnos */}
        <section className="rounded-2xl bg-white p-4 shadow-sm">
          <h3 className="mb-2 text-sm font-semibold text-slate-700">Próximos turnos</h3>
          {upcoming.length === 0 ? (
            <p className="text-sm text-slate-400">No hay más turnos de trabajo este mes.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {upcoming.map((u) => (
                <li key={u.day} className="flex items-center gap-3 py-2">
                  <span className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold ${shiftDef(u.code).className}`}>
                    {u.code}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-700">
                      {DAYNAME[u.wl] ?? u.wl} {u.day}
                    </p>
                    <p className="text-xs text-slate-400">
                      {FULL[u.code] ?? shiftDef(u.code).label}{HOURS[u.code] ? ` · ${HOURS[u.code]}` : ""}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Resumen del mes */}
        <section className="rounded-2xl bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-slate-700">Resumen del mes</h3>
          <div className="grid grid-cols-5 gap-2 text-center">
            {resumen.map((r) => (
              <div key={r.label}>
                <div className={`rounded-lg py-2 text-lg font-bold ${r.cls}`}>{r.n}</div>
                <div className="mt-1 text-[10px] text-slate-500">{r.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Calendario del mes */}
        <section className="rounded-2xl bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-slate-700">{MONTH_NAMES[month]} {year}</h3>
          <div className="grid grid-cols-7 gap-1 text-center">
            {WEEK.map((w) => (
              <div key={w} className="text-[10px] font-semibold text-slate-400">{w}</div>
            ))}
            {cells.map((d, i) => {
              if (d === null) return <div key={`e${i}`} />;
              const code = row[d - 1] ?? "";
              const def = shiftDef(code);
              const isToday = todayIdx != null && d - 1 === todayIdx;
              return (
                <div
                  key={d}
                  title={FULL[code] ?? def.label}
                  className={`rounded-lg py-1.5 ${def.className} ${isToday ? "ring-2 ring-cyan-600 ring-offset-1" : ""}`}
                >
                  <div className="text-[9px] opacity-60">{d}</div>
                  <div className="text-xs font-bold">{code}</div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Leyenda */}
        <section className="flex flex-wrap gap-1.5">
          {(["M", "T", "N", "D", "V"] as const).map((c) => (
            <span key={c} className={`rounded px-2 py-1 text-[11px] font-medium ${shiftDef(c).className}`}>
              <strong>{c}</strong> {FULL[c]}{HOURS[c] ? ` (${HOURS[c]})` : ""}
            </span>
          ))}
        </section>
      </main>
    </div>
  );
}
