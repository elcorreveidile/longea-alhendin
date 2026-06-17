import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getSession, isStaffAdmin } from "@/lib/session";
import { db } from "@/db";
import { workers as workersT, users as usersT } from "@/db/schema";
import { normalizePhone } from "@/lib/phone";
import { getAccessCode, setAccessCode } from "@/lib/worker-access";
import TopBar from "@/components/TopBar";

const MSG: Record<string, { ok: boolean; text: string }> = {
  ok: { ok: true, text: "✓ Acceso guardado." },
  dup: { ok: false, text: "Ese correo o móvil ya está asignado a otra persona." },
  phone: { ok: false, text: "El móvil no es válido (usa formato español, p. ej. 612345678)." },
  email: { ok: false, text: "El correo no es válido." },
  code: { ok: true, text: "✓ Código de acceso actualizado." },
  codeempty: { ok: false, text: "El código no puede estar vacío." },
  pin: { ok: true, text: "✓ PIN restablecido. La trabajadora creará uno nuevo al entrar." },
};

async function setCodeAction(formData: FormData) {
  "use server";
  const code = String(formData.get("code") ?? "").trim();
  if (!code) redirect("/panel/accesos?m=codeempty");
  await setAccessCode(code);
  redirect("/panel/accesos?m=code");
}

async function resetPinAction(formData: FormData) {
  "use server";
  const workerId = String(formData.get("workerId") ?? "");
  if (workerId) {
    await db.update(usersT).set({ pinHash: null }).where(eq(usersT.workerId, workerId));
  }
  redirect("/panel/accesos?m=pin");
}

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
  const code = await getAccessCode();

  return (
    <div className="min-h-screen bg-slate-50">
      <TopBar name={session.name} role={session.role} />
      <main className="mx-auto max-w-3xl space-y-5 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800">Accesos de trabajadoras</h2>
          <a href="/panel" className="text-sm font-medium text-cyan-700 hover:underline">← Volver al panel</a>
        </div>

        {msg && (
          <div className={`rounded-lg border p-3 text-sm ${msg.ok ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-800"}`}>
            {msg.text}
          </div>
        )}

        {/* Método principal: código de la residencia */}
        <section className="rounded-lg border border-cyan-200 bg-white p-4 shadow-sm">
          <h3 className="font-semibold text-slate-800">Código de acceso (recomendado)</h3>
          <p className="mt-1 mb-3 text-sm text-slate-500">
            Reparte este código a las trabajadoras. Entran en{" "}
            <strong>la web → &ldquo;Entra con tu código&rdquo;</strong>, eligen su nombre y crean su PIN
            la primera vez. No necesitas dar de alta correos ni móviles.
          </p>
          <form action={setCodeAction} className="flex flex-wrap items-end gap-3">
            <label className="text-sm">
              <span className="block text-slate-600">Código de la residencia</span>
              <input
                name="code"
                defaultValue={code ?? ""}
                placeholder="p. ej. ALHENDIN-2026"
                className="mt-1 w-60 rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </label>
            <button className="rounded-lg bg-cyan-700 px-5 py-2 text-sm font-semibold text-white hover:bg-cyan-800">
              Guardar código
            </button>
            {code && (
              <span className="text-xs text-slate-400">Código actual: <strong>{code}</strong></span>
            )}
          </form>
          {!code && (
            <p className="mt-2 text-xs text-amber-700">
              Aún no hay código: pon uno para que las trabajadoras puedan entrar.
            </p>
          )}
        </section>

        <h3 className="pt-1 text-sm font-semibold text-slate-700">
          Estado por trabajadora
          <span className="ml-2 font-normal text-slate-400">
            (PIN y, opcional, correo/móvil para acceso alternativo)
          </span>
        </h3>

        <div className="space-y-2">
          {workers.map((w) => {
            const u = userByWorker.get(w.id);
            const hasPin = !!u?.pinHash;
            return (
              <div key={w.id} className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
                <form action={saveAccessAction} className="flex flex-wrap items-center gap-2">
                  <input type="hidden" name="workerId" value={w.id} />
                  <div className="flex min-w-[9rem] items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${hasPin ? "bg-emerald-500" : "bg-slate-300"}`} />
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
                <div className="mt-2 flex items-center gap-3 text-xs">
                  <span className={hasPin ? "text-emerald-700" : "text-slate-400"}>
                    {hasPin ? "🔒 PIN creado" : "PIN sin crear"}
                  </span>
                  {hasPin && (
                    <form action={resetPinAction}>
                      <input type="hidden" name="workerId" value={w.id} />
                      <button className="text-rose-600 hover:underline">Restablecer PIN</button>
                    </form>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
