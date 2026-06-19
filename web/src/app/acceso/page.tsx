import { redirect } from "next/navigation";
import { cookies, headers } from "next/headers";
import { getSession, homeForRole } from "@/lib/session";
import { getCurrentTenant, slugFromHost } from "@/lib/tenant";
import {
  verifyAccessCode,
  listActiveWorkers,
  workerHasPin,
  setWorkerPinAndLogin,
  loginWorkerWithPin,
} from "@/lib/worker-access";
import DevCredit from "@/components/DevCredit";
import { APP_VERSION } from "@/lib/version";

const WAC = "wacc"; // código validado
const WSEL = "wsel"; // trabajadora seleccionada

const ERRORS: Record<string, string> = {
  codigo: "El código no es correcto. Pídeselo a tu coordinadora.",
  nombre: "Selecciona tu nombre.",
  pin: "El PIN no es correcto.",
  pin4: "El PIN debe tener 4 cifras.",
  pin2: "Los dos PIN no coinciden.",
  sesion: "Vuelve a empezar, por favor.",
};

const cookieOpts = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 600,
};

type SP = { step?: string; error?: string };

export default async function AccesoPage({ searchParams }: { searchParams: Promise<SP> }) {
  const session = await getSession();
  if (session) redirect(homeForRole(session.role));

  const sp = await searchParams;
  const step = sp.step;
  const errorMsg = sp.error ? ERRORS[sp.error] ?? "Ha ocurrido un error." : null;
  const onSubdomain = !!slugFromHost((await headers()).get("host"));
  const homeHref = onSubdomain ? "https://planturnos.com/" : "/";

  // El acceso por código es por empresa: en el dominio raíz no hay empresa
  // concreta y no exponemos la lista de clientes. Quien entre aquí va al acceso
  // por correo (el enlace mágico lo lleva a su empresa) o a la web de su empresa.
  if (!onSubdomain) redirect("/login");

  // --- Acciones ---
  async function codeAction(formData: FormData) {
    "use server";
    const code = String(formData.get("code") ?? "");
    const t = await getCurrentTenant();
    if (!t || !(await verifyAccessCode(t.id, code))) redirect("/acceso?error=codigo");
    const store = await cookies();
    store.set(WAC, "1", cookieOpts);
    redirect("/acceso?step=nombre");
  }

  async function nameAction(formData: FormData) {
    "use server";
    const store = await cookies();
    if (store.get(WAC)?.value !== "1") redirect("/acceso?error=sesion");
    const workerId = String(formData.get("workerId") ?? "");
    if (!workerId) redirect("/acceso?step=nombre&error=nombre");
    store.set(WSEL, workerId, cookieOpts);
    redirect("/acceso?step=pin");
  }

  async function pinAction(formData: FormData) {
    "use server";
    const store = await cookies();
    if (store.get(WAC)?.value !== "1") redirect("/acceso?error=sesion");
    const workerId = store.get(WSEL)?.value;
    if (!workerId) redirect("/acceso?step=nombre&error=nombre");

    const mode = String(formData.get("mode") ?? "");
    const pin = String(formData.get("pin") ?? "").trim();
    if (!/^\d{4}$/.test(pin)) redirect("/acceso?step=pin&error=pin4");

    let ok = false;
    if (mode === "crear") {
      const pin2 = String(formData.get("pin2") ?? "").trim();
      if (pin !== pin2) redirect("/acceso?step=pin&error=pin2");
      ok = await setWorkerPinAndLogin(workerId, pin);
    } else {
      ok = await loginWorkerWithPin(workerId, pin);
    }
    if (!ok) redirect("/acceso?step=pin&error=pin");

    store.delete(WAC);
    store.delete(WSEL);
    redirect("/mi-turno");
  }

  // --- Vistas ---
  const tenant = await getCurrentTenant();
  const store = await cookies();
  let body: React.ReactNode;

  if (step === "nombre" && store.get(WAC)?.value === "1") {
    const workers = await listActiveWorkers(tenant?.id ?? "");
    workers.sort((a, b) => a.name.localeCompare(b.name, "es"));
    body = (
      <form action={nameAction} className="space-y-4">
        {errorMsg && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{errorMsg}</p>}
        <div>
          <label htmlFor="workerId" className="text-sm font-medium text-slate-700">Tu nombre</label>
          <select
            id="workerId"
            name="workerId"
            required
            defaultValue=""
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-cyan-500"
          >
            <option value="" disabled>Elige tu nombre…</option>
            {workers.map((w) => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
        </div>
        <button className="w-full rounded-lg bg-cyan-700 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-800">
          Continuar
        </button>
      </form>
    );
  } else if (step === "pin" && store.get(WAC)?.value === "1" && store.get(WSEL)?.value) {
    const workerId = store.get(WSEL)!.value;
    const workers = await listActiveWorkers(tenant?.id ?? "");
    const me = workers.find((w) => w.id === workerId);
    const hasPin = await workerHasPin(workerId);
    body = (
      <form action={pinAction} className="space-y-4">
        {errorMsg && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{errorMsg}</p>}
        <input type="hidden" name="mode" value={hasPin ? "entrar" : "crear"} />
        <p className="text-sm text-slate-600">
          Hola <strong>{me?.name ?? ""}</strong>.{" "}
          {hasPin ? "Introduce tu PIN de 4 cifras." : "Crea tu PIN de 4 cifras (lo usarás para entrar)."}
        </p>
        <input
          name="pin"
          inputMode="numeric"
          autoComplete="off"
          maxLength={4}
          required
          placeholder="• • • •"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-center text-2xl tracking-[0.6em] outline-none focus:border-cyan-500"
        />
        {!hasPin && (
          <input
            name="pin2"
            inputMode="numeric"
            autoComplete="off"
            maxLength={4}
            required
            placeholder="repite el PIN"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-center text-lg tracking-[0.5em] outline-none focus:border-cyan-500"
          />
        )}
        <button className="w-full rounded-lg bg-cyan-700 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-800">
          {hasPin ? "Entrar" : "Crear PIN y entrar"}
        </button>
        <a href="/acceso?step=nombre" className="block text-center text-xs text-slate-400 hover:underline">
          No soy {me?.name ?? "esa persona"} · cambiar
        </a>
      </form>
    );
  } else {
    body = (
      <form action={codeAction} className="space-y-4">
        {errorMsg && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{errorMsg}</p>}
        <div>
          <label htmlFor="code" className="text-sm font-medium text-slate-700">Código de la residencia</label>
          <input
            id="code"
            name="code"
            required
            autoComplete="off"
            placeholder="el código que te dan en el centro"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-cyan-500"
          />
        </div>
        <button className="w-full rounded-lg bg-cyan-700 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-800">
          Continuar
        </button>
        <p className="text-center text-xs text-slate-400">
          Te lo facilita tu coordinadora. La primera vez crearás tu PIN.
        </p>
      </form>
    );
  }

  const bg = tenant?.loginBgUrl;
  return (
    <main
      className="relative flex min-h-screen items-center justify-center bg-slate-50 p-6"
      style={bg ? { backgroundImage: `url(${bg})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
    >
      {bg && <div className="absolute inset-0 bg-slate-900/55 backdrop-blur-sm" />}
      <div className="relative z-10 w-full max-w-sm rounded-xl bg-white p-8 shadow-xl">
        <a href={homeHref} className="inline-block" title="Ir al inicio">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={tenant?.logoUrl || "/logo-symbol.png"} alt={tenant?.name ?? "PlanTurnos"} className="mb-5 h-10 w-auto" />
        </a>
        <h1 className="text-xl font-bold text-slate-800">Acceso trabajadoras</h1>
        <p className="mt-1 mb-6 text-sm text-slate-500">{tenant?.name ?? "PlanTurnos"}</p>
        {body}
        <p className="mt-6 text-center text-xs text-slate-400">
          ¿Eres administradora?{" "}
          <a href="/login" className="font-medium text-cyan-700 hover:underline">Entra por aquí</a>
        </p>
        <p className="mt-2 text-center text-xs text-slate-400">
          <a href={homeHref} className="hover:text-cyan-700 hover:underline">← Volver a PlanTurnos</a>
        </p>
        <DevCredit />
      </div>
      <p className={`absolute bottom-3 left-0 right-0 z-10 text-center text-xs ${bg ? "text-white/70" : "text-slate-400"}`}>
        © {new Date().getFullYear()} PlanTurnos · {APP_VERSION}
      </p>
    </main>
  );
}
