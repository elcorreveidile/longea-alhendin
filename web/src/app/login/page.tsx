import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { requestMagicLink, requestSmsCode, loginByPhone } from "@/lib/auth";
import { getSession, isStaffAdmin } from "@/lib/session";
import { normalizePhone, maskPhone } from "@/lib/phone";

const PENDING_PHONE = "pending_phone";

const ERRORS: Record<string, string> = {
  "falta-token": "El enlace no es válido.",
  "enlace-invalido": "El enlace ha caducado o ya se ha usado. Pide uno nuevo.",
  "no-autorizado": "No estás autorizada para acceder.",
  "telefono-invalido": "El número de móvil no es válido.",
  "codigo": "El código no es correcto o ha caducado. Pídelo de nuevo.",
  "sin-telefono": "Vuelve a introducir tu móvil.",
};

type SP = {
  m?: string; step?: string; error?: string; enviado?: string;
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<SP> }) {
  const session = await getSession();
  if (session) redirect(isStaffAdmin(session.role) ? "/panel" : "/mi-turno");

  const sp = await searchParams;
  const method = sp.m === "sms" ? "sms" : "email";
  const errorMsg = sp.error ? ERRORS[sp.error] ?? "Ha ocurrido un error." : null;

  // --- Acciones de servidor ---
  async function emailAction(formData: FormData) {
    "use server";
    const email = String(formData.get("email") ?? "");
    if (email.includes("@")) await requestMagicLink(email);
    redirect("/login?m=email&enviado=1");
  }

  async function smsStartAction(formData: FormData) {
    "use server";
    const phone = normalizePhone(String(formData.get("phone") ?? ""));
    if (!phone) redirect("/login?m=sms&error=telefono-invalido");
    await requestSmsCode(phone!); // respuesta genérica por privacidad
    const store = await cookies();
    store.set(PENDING_PHONE, phone!, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 600,
    });
    redirect("/login?m=sms&step=code");
  }

  async function smsVerifyAction(formData: FormData) {
    "use server";
    const store = await cookies();
    const phone = store.get(PENDING_PHONE)?.value;
    if (!phone) redirect("/login?m=sms&error=sin-telefono");
    const code = String(formData.get("code") ?? "").trim();
    const ok = await loginByPhone(phone!, code);
    if (!ok) redirect("/login?m=sms&step=code&error=codigo");
    store.delete(PENDING_PHONE);
    const s = await getSession();
    redirect(s && isStaffAdmin(s.role) ? "/panel" : "/mi-turno");
  }

  // --- Vistas ---
  const tabs = (
    <div className="mb-5 flex rounded-lg bg-slate-100 p-1 text-sm">
      <a
        href="/login?m=email"
        className={`flex-1 rounded-md py-1.5 text-center font-medium ${method === "email" ? "bg-white text-cyan-800 shadow-sm" : "text-slate-500"}`}
      >
        Correo
      </a>
      <a
        href="/login?m=sms"
        className={`flex-1 rounded-md py-1.5 text-center font-medium ${method === "sms" ? "bg-white text-cyan-800 shadow-sm" : "text-slate-500"}`}
      >
        Móvil
      </a>
    </div>
  );

  let body: React.ReactNode;

  if (sp.enviado === "1") {
    body = (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
        Si tu correo está dado de alta, te hemos enviado un enlace de acceso (caduca
        en 15 minutos).
      </div>
    );
  } else if (method === "sms" && sp.step === "code") {
    const store = await cookies();
    const phone = store.get(PENDING_PHONE)?.value;
    body = (
      <form action={smsVerifyAction} className="space-y-4">
        {errorMsg && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{errorMsg}</p>}
        <p className="text-sm text-slate-600">
          Te hemos enviado un código a tu móvil{phone ? ` (${maskPhone(phone)})` : ""}.
          Introdúcelo aquí:
        </p>
        <input
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          required
          placeholder="123456"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-center text-lg tracking-[0.4em] outline-none focus:border-cyan-500"
        />
        <button className="w-full rounded-lg bg-cyan-700 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-800">
          Entrar
        </button>
        <a href="/login?m=sms" className="block text-center text-xs text-slate-400 hover:underline">
          No me ha llegado · pedir otro código
        </a>
      </form>
    );
  } else if (method === "sms") {
    body = (
      <form action={smsStartAction} className="space-y-4">
        {errorMsg && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{errorMsg}</p>}
        <div>
          <label htmlFor="phone" className="text-sm font-medium text-slate-700">
            Tu número de móvil
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            required
            placeholder="675 82 31 84"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-cyan-500"
          />
        </div>
        <button className="w-full rounded-lg bg-cyan-700 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-800">
          Enviarme un código
        </button>
        <p className="text-center text-xs text-slate-400">
          Recibirás un código de 6 dígitos en tu móvil (WhatsApp o SMS). Sin contraseña.
        </p>
      </form>
    );
  } else {
    body = (
      <form action={emailAction} className="space-y-4">
        {errorMsg && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{errorMsg}</p>}
        <div>
          <label htmlFor="email" className="text-sm font-medium text-slate-700">
            Tu correo electrónico
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="nombre@ejemplo.com"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-cyan-500"
          />
        </div>
        <button className="w-full rounded-lg bg-cyan-700 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-800">
          Enviarme el enlace de acceso
        </button>
        <p className="text-center text-xs text-slate-400">
          Te enviaremos un enlace mágico. No necesitas contraseña.
        </p>
      </form>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow-sm">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-longea.png" alt="Longea · Grupo Aconser" className="mb-5 h-10 w-auto" />
        <h1 className="text-xl font-bold text-slate-800">Cuadrantes</h1>
        <p className="mt-1 mb-6 text-sm text-slate-500">Residencia Alhendín</p>
        {sp.enviado !== "1" && tabs}
        {body}
      </div>
    </main>
  );
}
