import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getSession, isStaffAdmin } from "@/lib/session";
import { db } from "@/db";
import { workers as workersT, users as usersT } from "@/db/schema";
import { normalizePhone } from "@/lib/phone";
import TopBar from "@/components/TopBar";

const MSG: Record<string, { ok: boolean; text: string }> = {
  ok: { ok: true, text: "✓ Acceso guardado." },
  dup: { ok: false, text: "Ese correo o móvil ya está asignado a otra persona." },
  phone: { ok: false, text: "El móvil no es válido (usa formato español, p. ej. 612345678)." },
  email: { ok: false, text: "El correo no es válido." },
};

async function saveAccessAction(formData: FormData) {
  "use server";
  const workerId = String(formData.get("workerId") ?? "");
  const emailRaw = String(formData.get("email") ?? "").trim().toLowerCase();
  const phoneRaw = String(formData.get("phone") ?? "").trim();

  if (emailRaw && !emailRaw.includes("@")) redirect("/panel/accesos?m=email");
  const email = emailRaw || null;
  const phone = phoneRaw ? normalizePhone(phoneRaw) : null;
  if (phoneRaw && !phone) redirect("/panel/accesos?m=phone");

  const w = (await db.select().from(workersT).where(eq(workersT.id, workerId)).limit(1))[0];
  if (!w) redirect("/panel/accesos");

  const existing = (await db.select().from(usersT).where(eq(usersT.workerId, workerId)).limit(1))[0];

  let outcome = "ok";
  try {
    if (existing) {
      await db.update(usersT).set({ email, phone }).where(eq(usersT.id, existing.id));
    } else {
      await db.insert(usersT).values({ email, phone, name: w.name, role: "worker", workerId });
    }
  } catch {
    outcome = "dup"; // choca con el índice único de email/móvil
  }
  redirect(`/panel/accesos?m=${outcome}`);
}

export default async function AccesosPage({
  searchParams,
}: {
  searchParams: Promise<{ m?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!isStaffAdmin(session.role)) redirect("/mi-turno");

  const sp = await searchParams;
  const msg = sp.m ? MSG[sp.m] : null;

  const workers = await db.select().from(workersT).where(eq(workersT.active, true));
  const users = await db.select().from(usersT);
  const userByWorker = new Map(users.filter((u) => u.workerId).map((u) => [u.workerId!, u]));

  return (
    <div className="min-h-screen bg-slate-50">
      <TopBar name={session.name} role={session.role} />
      <main className="mx-auto max-w-3xl space-y-5 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800">Accesos de trabajadoras</h2>
          <a href="/panel" className="text-sm font-medium text-cyan-700 hover:underline">← Volver al panel</a>
        </div>

        <p className="text-sm text-slate-500">
          Da de alta el <strong>correo</strong> y/o el <strong>móvil</strong> de cada trabajadora.
          Con eso podrá entrar (enlace por correo o código por SMS) y ver su turno. Quien no
          tenga ni correo ni móvil aquí, <strong>no puede acceder</strong>.
        </p>

        {msg && (
          <div className={`rounded-lg border p-3 text-sm ${msg.ok ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-800"}`}>
            {msg.text}
          </div>
        )}

        <div className="space-y-2">
          {workers.map((w) => {
            const u = userByWorker.get(w.id);
            const hasAccess = !!(u && (u.email || u.phone));
            return (
              <form
                key={w.id}
                action={saveAccessAction}
                className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-white p-3 shadow-sm"
              >
                <input type="hidden" name="workerId" value={w.id} />
                <div className="flex min-w-[9rem] items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${hasAccess ? "bg-emerald-500" : "bg-slate-300"}`} />
                  <span className="font-medium text-slate-800">{w.name}</span>
                </div>
                <input
                  name="email"
                  type="email"
                  placeholder="correo (opcional)"
                  defaultValue={u?.email ?? ""}
                  className="min-w-[12rem] flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
                />
                <input
                  name="phone"
                  type="tel"
                  placeholder="móvil (opcional)"
                  defaultValue={u?.phone ?? w.phone ?? ""}
                  className="w-36 rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
                />
                <button className="rounded-lg bg-cyan-700 px-4 py-1.5 text-sm font-semibold text-white hover:bg-cyan-800">
                  Guardar
                </button>
              </form>
            );
          })}
        </div>
      </main>
    </div>
  );
}
