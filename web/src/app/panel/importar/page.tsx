import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, eq, gte, lte } from "drizzle-orm";
import { getSession } from "@/lib/session";
import { getCurrentTenant } from "@/lib/tenant";
import { requireResidencePanel } from "@/lib/panel-guard";
import { db } from "@/db";
import { workers as workersT, vacations as vacationsT } from "@/db/schema";
import { saveCuadrante } from "@/db/cuadrantes";
import TopBar from "@/components/TopBar";

const MONTHS = ["", "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const LETTERS = ["L", "M", "X", "J", "V", "S", "D"];

const MSG: Record<string, { ok: boolean; text: string }> = {
  vacio: { ok: false, text: "Pega la cuadrícula del mes (una fila por trabajadora)." },
  nadie: { ok: false, text: "No se reconoció a ninguna trabajadora. Revisa que la primera columna sea el nombre." },
};

// Semilla de continuidad: últimos 6 días (25–30) de junio 2026, transcritos del
// modelo de Alhendín y verificados con la administradora. Solo se usa la cola
// para que julio arranque bien (noche -> descanso, racha de días seguidos).
const JUNIO_2026_TAIL: Record<string, string[]> = {
  "Mónica": ["T", "N", "N", "D", "D", "M"],
  "Bárbara": ["N", "D", "T", "T", "T", "N"],
  "Rocío": ["V", "V", "V", "V", "V", "V"],
  "Pamela": ["T", "D", "D", "M", "M", "T"],
  "Irene León": ["M", "T", "T", "D", "D", "M"],
  "Desiree": ["D", "M", "M", "M", "T", "D"],
  "Cloe": ["D", "M", "M", "M", "T", "D"],
  "Laura Padilla": ["D", "M", "M", "T", "T", "D"],
  "Montse": ["T", "D", "D", "M", "M", "T"],
  "Mar": ["M", "T", "D", "D", "M", "M"],
  "Diana": ["N", "D", "D", "M", "M", "T"],
  "Melody": ["T", "T", "T", "D", "T", "T"],
  "Mª José": ["V", "V", "V", "V", "V", "V"],
  "Sandra": ["D", "M", "M", "T", "D", "D"],
  "Ana Montoro": ["T", "T", "D", "M", "M", "T"],
  "Isabel": ["T", "D", "M", "T", "D", "T"],
  "Noemí": ["T", "T", "D", "T", "T", "T"],
  "Ainhoa": ["D", "D", "M", "T", "N", "N"],
  "Conce": ["T", "T", "N", "D", "D", "M"],
  "Ana Isabel": ["M", "N", "D", "M", "M", "M"],
  "Sara": ["D", "M", "M", "M", "T", "D"],
  "Azblais": ["M", "M", "T", "N", "N", "D"],
  "Diego": ["M", "T", "T", "D", "D", "M"],
  "Isabel María": ["D", "M", "M", "T", "T", "D"],
  "Yolanda": ["T", "D", "D", "D", "M", "T"],
  "Laura": ["V", "V", "V", "V", "V", "V"],
  "Ana Muñoz": ["D", "D", "M", "M", "M", "M"],
  "Toñi": ["M", "M", "T", "T", "D", "D"],
  "M.Mar": ["M", "M", "D", "D", "M", "M"],
  "Wisan": ["M", "T", "T", "D", "D", "M"],
  "Nuria": ["M", "T", "T", "N", "D", "D"],
  "Susana": ["D", "D", "T", "T", "D", "D"],
};

// Cola (últimos 6 días: 26–31) de JULIO 2026, dictada por la administradora.
// Los M1–M4 indican planta; para la continuidad el motor solo usa M/T/N/D/V.
// `alt`: nombres alternativos por si la plantilla los tiene escritos distinto.
const JULIO_2026_TAIL: { name: string; alt?: string[]; tail: string[] }[] = [
  { name: "Mónica", tail: ["N", "D", "D", "M4", "M1", "T"] },
  { name: "Ángela", tail: ["T", "T", "D", "M3", "M2", "T"] },
  { name: "Rocío", tail: ["D", "D", "M", "M2", "T", "T"] },
  { name: "Pamela", tail: ["N", "D", "D", "M", "M", "D"] },
  { name: "Irene León", tail: ["T", "D", "D", "M1", "M3", "T"] },
  { name: "Desiree", tail: ["D", "M3", "M1", "T", "T", "D"] },
  { name: "Cloe", alt: ["Chloe"], tail: ["D", "M2", "M4", "T", "T", "D"] },
  { name: "Laura Padilla", tail: ["T", "T", "D", "D", "M1", "M"] },
  { name: "Lorena", tail: ["T", "T", "D", "D", "T", "T"] },
  { name: "Mar", tail: ["V", "V", "V", "V", "V", "T"] },
  { name: "Araceli", tail: ["M4", "M3", "T", "T", "D", "D"] },
  { name: "Dulce", tail: ["M3", "T", "D", "D", "T", "T"] },
  { name: "Mª José", alt: ["María José", "Maria Jose"], tail: ["T", "T", "T", "D", "D", "M1"] },
  { name: "Sandra", tail: ["D", "D", "M2", "T", "T", "T"] },
  { name: "Ana Montoro", tail: ["D", "D", "M3", "T", "T", "V"] },
  { name: "Isabel", tail: ["V", "V", "V", "V", "V", "M2"] },
  { name: "Noemí", tail: ["D", "D", "M2", "M1", "M2", "N"] },
  { name: "Ainhoa", tail: ["M3", "T", "N", "N", "D", "D"] },
  { name: "Conce", tail: ["T", "T", "T", "D", "D", "M3"] },
  { name: "Ana Isabel", tail: ["M2", "M1", "T", "T", "D", "D"] },
  { name: "Sara", tail: ["T", "N", "D", "D", "M", "M3"] },
  { name: "Azelais", alt: ["Azblais"], tail: ["M", "T", "T", "D", "D", "D"] },
  { name: "Diego", tail: ["M1", "M", "T", "T", "D", "D"] },
  { name: "Isabel María", tail: ["M2", "M2", "T", "T", "N", "D"] },
  { name: "Yolanda", tail: ["T", "N", "N", "D", "D", "M2"] },
  { name: "Laura", tail: ["M4", "T", "T", "D", "D", "M1"] },
  // Diana se OMITE a propósito de la semilla: en julio trabajaba de gerocultora
  // pero su rol de SUPERVISORA empieza en agosto. Sin cola, el motor le arranca
  // el patrón 2-2-2 limpio en agosto (en julio: D M M M M D, no aplica).
  { name: "Toñi", tail: ["V", "V", "V", "V", "V", "M"] },
  { name: "M.Mar", alt: ["M. Mar"], tail: ["D", "M4", "M1", "M2", "M3", "M4"] },
  { name: "Wissan", alt: ["Wisan"], tail: ["M1", "M1", "T", "N", "N", "D"] },
  { name: "Nuria", tail: ["D", "D", "M3", "M3", "T", "N"] },
  { name: "Marta", tail: ["T", "D", "D", "M4", "M4", "T"] },
];

/** Normaliza un nombre para casarlo (sin acentos, mayúsculas, espacios simples). */
function norm(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase().replace(/\s+/g, " ").trim();
}

/** Convierte una celda del Excel al código del cuadrante (M/T/N/D/V). */
function mapCell(raw: string): string {
  const c = (raw ?? "").trim().toUpperCase();
  if (!c) return "D";
  if (c.startsWith("V")) return "V";
  if (c.startsWith("N")) return "N";
  if (c.startsWith("T")) return "T";
  if (c.startsWith("M")) return "M";
  return "D"; // D, DH, H, HD, vacío… cuentan como descanso
}

/**
 * Carga la semilla de continuidad de junio 2026: guarda un cuadrante de junio
 * con los días 1–24 como descanso (placeholder, no se usan) y los días 25–30
 * tomados de JUNIO_2026_TAIL. El motor solo lee los últimos 6 días para
 * arrastrar la racha y la regla noche→descanso, así que con la cola basta.
 */
async function loadJunioAction() {
  "use server";
  const session = await getSession();
  if (!session || session.role !== "superadmin") redirect("/login");
  const tenant = await getCurrentTenant();
  if (!tenant) redirect("/panel/importar?m=vacio");

  const year = 2026;
  const month = 6;
  const days = 30;
  const weekdays = Array.from({ length: days }, (_, i) => LETTERS[(new Date(year, month - 1, i + 1).getDay() + 6) % 7]);

  const ws = await db.select().from(workersT).where(and(eq(workersT.tenantId, tenant.id), eq(workersT.active, true)));
  const byName = new Map(ws.map((w) => [norm(w.name), w]));

  const assignments: Record<string, string[]> = {};
  const names: Record<string, string> = {};
  const unmatched: string[] = [];
  let matched = 0;

  for (const [name, tail] of Object.entries(JUNIO_2026_TAIL)) {
    const w = byName.get(norm(name));
    if (!w) {
      unmatched.push(name);
      continue;
    }
    // 24 días de descanso (placeholder) + los 6 días reales de la cola (25–30)
    assignments[w.id] = [...Array(days - tail.length).fill("D"), ...tail.map(mapCell)];
    names[w.id] = w.name;
    matched++;
  }

  if (matched === 0) redirect("/panel/importar?m=nadie");

  await saveCuadrante(tenant.id, year, month, {
    year, month, days, weekdays, assignments,
    // @ts-expect-error: names es un extra que usa la vista del cuadrante
    names,
  });
  revalidatePath("/panel");
  redirect(`/panel/importar?ok=${matched}&u=${encodeURIComponent(unmatched.slice(0, 8).join(", "))}&j=1`);
}

/** Carga la cola de julio 2026 (días 1–25 como descanso placeholder + los 6
 *  días reales 26–31 dictados). El motor solo lee los últimos 6 días, así que
 *  con la cola agosto arranca con continuidad y la regla de 6 días seguidos. */
async function loadJulioAction() {
  "use server";
  const session = await getSession();
  if (!session || session.role !== "superadmin") redirect("/login");
  const tenant = await getCurrentTenant();
  if (!tenant) redirect("/panel/importar?m=vacio");

  const year = 2026;
  const month = 7;
  const days = 31;
  const weekdays = Array.from({ length: days }, (_, i) => LETTERS[(new Date(year, month - 1, i + 1).getDay() + 6) % 7]);

  const ws = await db.select().from(workersT).where(and(eq(workersT.tenantId, tenant.id), eq(workersT.active, true)));
  const byName = new Map(ws.map((w) => [norm(w.name), w]));

  const assignments: Record<string, string[]> = {};
  const names: Record<string, string> = {};
  const unmatched: string[] = [];
  let matched = 0;

  for (const row of JULIO_2026_TAIL) {
    const w = byName.get(norm(row.name)) ?? row.alt?.map((a) => byName.get(norm(a))).find(Boolean);
    if (!w) {
      unmatched.push(row.name);
      continue;
    }
    assignments[w.id] = [...Array(days - row.tail.length).fill("D"), ...row.tail.map(mapCell)];
    names[w.id] = w.name;
    matched++;
  }

  if (matched === 0) redirect("/panel/importar?m=nadie");

  await saveCuadrante(tenant.id, year, month, {
    year, month, days, weekdays, assignments,
    // @ts-expect-error: names es un extra que usa la vista del cuadrante
    names,
  });
  revalidatePath("/panel");
  redirect(`/panel/importar?ok=${matched}&u=${encodeURIComponent(unmatched.slice(0, 8).join(", "))}&jul=1`);
}

// Vacaciones de agosto 2026 (Alhendín), facilitadas por la administradora.
// El día 31 se trabaja (los rangos llegan al 30).
const AGOSTO_2026_VAC: { name: string; alt?: string; start: string; end: string }[] = [
  { name: "Azelais", alt: "Azblais", start: "2026-08-01", end: "2026-08-15" },
  { name: "Ana Montoro", start: "2026-08-01", end: "2026-08-15" },
  { name: "Mónica", start: "2026-08-16", end: "2026-08-30" },
  { name: "Cloe", alt: "Chloe", start: "2026-08-16", end: "2026-08-30" },
];

/** Carga (idempotente) las vacaciones de agosto 2026. Casa nombres por
 *  normalización; reemplaza las vacaciones que ya solapen agosto para esa
 *  trabajadora, así pulsarlo dos veces no duplica. */
async function loadAgostoVacacionesAction() {
  "use server";
  const session = await getSession();
  if (!session || session.role !== "superadmin") redirect("/login");
  const tenant = await getCurrentTenant();
  if (!tenant) redirect("/panel/importar?m=vacio");

  const ws = await db.select().from(workersT).where(and(eq(workersT.tenantId, tenant.id), eq(workersT.active, true)));
  const byName = new Map(ws.map((w) => [norm(w.name), w]));

  const unmatched: string[] = [];
  let n = 0;
  for (const v of AGOSTO_2026_VAC) {
    const w = byName.get(norm(v.name)) ?? (v.alt ? byName.get(norm(v.alt)) : undefined);
    if (!w) { unmatched.push(v.name); continue; }
    await db.delete(vacationsT).where(and(
      eq(vacationsT.workerId, w.id),
      lte(vacationsT.startDate, "2026-08-31"),
      gte(vacationsT.endDate, "2026-08-01"),
    ));
    await db.insert(vacationsT).values({ workerId: w.id, startDate: v.start, endDate: v.end, note: "Agosto 2026" });
    n++;
  }
  revalidatePath("/panel/vacaciones");
  revalidatePath("/panel");
  redirect(`/panel/importar?vac=${n}&vu=${encodeURIComponent(unmatched.join(", "))}`);
}

async function importAction(formData: FormData) {
  "use server";
  const session = await getSession();
  if (!session || session.role !== "superadmin") redirect("/login");
  const tenant = await getCurrentTenant();
  const year = Number(formData.get("year"));
  const month = Number(formData.get("month"));
  const text = String(formData.get("grid") ?? "").trim();
  if (!tenant || !text || !year || !month) redirect("/panel/importar?m=vacio");

  const ws = await db.select().from(workersT).where(and(eq(workersT.tenantId, tenant.id), eq(workersT.active, true)));
  const byName = new Map(ws.map((w) => [norm(w.name), w]));

  const days = new Date(year, month, 0).getDate();
  const weekdays = Array.from({ length: days }, (_, i) => LETTERS[(new Date(year, month - 1, i + 1).getDay() + 6) % 7]);

  const assignments: Record<string, string[]> = {};
  const names: Record<string, string> = {};
  const unmatched: string[] = [];

  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const cols = line.split("\t");
    if (cols.length < 2) continue; // se espera pegado desde hoja de cálculo (tabuladores)
    const w = byName.get(norm(cols[0]));
    if (!w) {
      if (cols[0].trim()) unmatched.push(cols[0].trim());
      continue;
    }
    const cells = cols.slice(1).map(mapCell);
    assignments[w.id] = Array.from({ length: days }, (_, i) => cells[i] ?? "D");
    names[w.id] = w.name;
  }

  if (Object.keys(assignments).length === 0) redirect("/panel/importar?m=nadie");

  await saveCuadrante(tenant.id, year, month, {
    year, month, days, weekdays, assignments,
    // @ts-expect-error: names es un extra que usa la vista del cuadrante
    names,
  });
  revalidatePath("/panel");
  redirect(`/panel/importar?ok=${Object.keys(assignments).length}&u=${encodeURIComponent(unmatched.slice(0, 8).join(", "))}`);
}

export default async function ImportarPage({
  searchParams,
}: {
  searchParams: Promise<{ m?: string; ok?: string; u?: string; j?: string; jul?: string; vac?: string; vu?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "superadmin") redirect("/panel");
  await requireResidencePanel();

  const tenant = await getCurrentTenant();
  const sp = await searchParams;
  const err = sp.m ? MSG[sp.m] : null;
  const okN = sp.ok ? Number(sp.ok) : null;
  const now = new Date();

  return (
    <div className="min-h-screen bg-[#faf6ee]">
      <TopBar name={session.name} role={session.role} tenantName={tenant?.name} logoUrl={tenant?.logoUrl} />
      <main className="mx-auto max-w-3xl space-y-5 p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900">Importar un mes (pegar)</h1>
          <a href="/panel" className="text-sm font-medium text-cyan-700 hover:underline">← Volver al panel</a>
        </div>

        <p className="text-sm text-slate-600">
          Copia el mes desde tu hoja de cálculo (una fila por trabajadora: <strong>nombre</strong> en la primera columna y
          luego los días) y pégalo aquí. Sirve para tener el mes anterior en la app y que el siguiente arranque con
          continuidad.
        </p>
        <p className="rounded-lg bg-white p-3 text-xs text-slate-500 shadow-sm">
          Conversión: <strong>M / M1 / M2…</strong> → mañana · <strong>T</strong> → tarde · <strong>N</strong> → noche ·
          <strong> D / DH</strong> → descanso · <strong>V</strong> → vacaciones. Casa los nombres aunque tengan tildes o
          mayúsculas distintas.
        </p>

        {err && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{err.text}</p>}
        {okN != null && (
          <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
            ✓ {sp.jul ? "Julio 2026 cargado" : sp.j ? "Junio 2026 cargado" : "Importadas"} {okN} trabajadoras.
            {sp.u ? ` No se reconocieron: ${decodeURIComponent(sp.u)}.` : ""} Ya puedes regenerar el mes siguiente con
            continuidad.
          </p>
        )}

        {sp.vac != null && (
          <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
            ✓ Cargadas {sp.vac} vacaciones de agosto 2026.
            {sp.vu ? ` No se reconocieron: ${decodeURIComponent(sp.vu)}.` : ""}
          </p>
        )}

        <div className="rounded-xl border border-[#e7dcc4] bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">Semilla de julio 2026 (cola)</h2>
          <p className="mt-1 text-xs text-slate-500">
            Carga los últimos 6 días (26–31) de julio 2026, dictados por la administradora, para que <strong>agosto</strong>{" "}
            arranque con continuidad y la regla de 6 días seguidos. Los días 1–25 quedan como descanso (placeholder): esta
            semilla sirve para enlazar con agosto, no para mostrar julio completo.
          </p>
          <form action={loadJulioAction} className="mt-3">
            <button className="rounded-lg bg-emerald-700 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-800">
              Cargar julio 2026 (semilla)
            </button>
          </form>
        </div>

        <div className="rounded-xl border border-[#e7dcc4] bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">Vacaciones de agosto 2026</h2>
          <p className="mt-1 text-xs text-slate-500">
            Carga de un clic: Azelais y Ana Montoro (1–15 ago), Mónica y Cloe (16–30 ago). El día 31 se trabaja.
            Es idempotente (pulsarlo dos veces no duplica).
          </p>
          <form action={loadAgostoVacacionesAction} className="mt-3">
            <button className="rounded-lg bg-emerald-700 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-800">
              Cargar vacaciones de agosto 2026
            </button>
          </form>
        </div>

        <div className="rounded-xl border border-[#e7dcc4] bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">Semilla de junio 2026</h2>
          <p className="mt-1 text-xs text-slate-500">
            Carga la última semana de junio 2026 (transcrita del modelo de Alhendín y verificada) para que julio arranque
            con continuidad: noche → descanso, racha de días seguidos y descanso entre jornadas. No hace falta pegar nada.
          </p>
          <form action={loadJunioAction} className="mt-3">
            <button className="rounded-lg bg-emerald-700 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-800">
              Cargar junio 2026 (semilla)
            </button>
          </form>
        </div>

        <form action={importAction} className="space-y-3 rounded-xl border border-[#e7dcc4] bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-end gap-3">
            <label className="text-sm">
              <span className="block text-slate-600">Mes</span>
              <select name="month" defaultValue={6} className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm">
                {MONTHS.slice(1).map((m, i) => (
                  <option key={i + 1} value={i + 1}>{m}</option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              <span className="block text-slate-600">Año</span>
              <input name="year" type="number" defaultValue={now.getFullYear()} className="mt-1 w-24 rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            </label>
          </div>
          <textarea
            name="grid"
            rows={12}
            placeholder={"Mónica\tD\tD\tM\tM\tN\tN\tD\t…\nBárbara\tDH\tT\tT\tN\tD\t…"}
            className="w-full rounded-lg border border-slate-300 p-3 font-mono text-xs"
          />
          <button className="rounded-lg bg-cyan-700 px-5 py-2 text-sm font-semibold text-white hover:bg-cyan-800">
            Importar mes
          </button>
        </form>
      </main>
    </div>
  );
}
