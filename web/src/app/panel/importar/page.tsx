import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { getSession, isStaffAdmin } from "@/lib/session";
import { getCurrentTenant } from "@/lib/tenant";
import { requireResidencePanel } from "@/lib/panel-guard";
import { db } from "@/db";
import { workers as workersT } from "@/db/schema";
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
  if (!session || !isStaffAdmin(session.role)) redirect("/login");
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

async function importAction(formData: FormData) {
  "use server";
  const session = await getSession();
  if (!session || !isStaffAdmin(session.role)) redirect("/login");
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
  searchParams: Promise<{ m?: string; ok?: string; u?: string; j?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!isStaffAdmin(session.role)) redirect("/mi-turno");
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
            ✓ {sp.j ? "Junio 2026 cargado" : "Importadas"} {okN} trabajadoras.
            {sp.u ? ` No se reconocieron: ${decodeURIComponent(sp.u)}.` : ""} Ya puedes regenerar el mes siguiente con
            continuidad.
          </p>
        )}

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
