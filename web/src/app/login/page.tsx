import { redirect } from "next/navigation";
import { requestMagicLink } from "@/lib/auth";
import { getSession } from "@/lib/session";

const ERRORS: Record<string, string> = {
  "falta-token": "El enlace no es válido.",
  "enlace-invalido": "El enlace ha caducado o ya se ha usado. Pide uno nuevo.",
  "no-autorizado": "Tu correo no está autorizado.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; enviado?: string }>;
}) {
  const session = await getSession();
  if (session) redirect("/panel");

  const sp = await searchParams;
  const errorMsg = sp.error ? ERRORS[sp.error] ?? "Ha ocurrido un error." : null;
  const enviado = sp.enviado === "1";

  async function action(formData: FormData) {
    "use server";
    const email = String(formData.get("email") ?? "");
    if (email.includes("@")) {
      await requestMagicLink(email);
    }
    redirect("/login?enviado=1");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow-sm">
        <h1 className="text-xl font-bold text-cyan-900">Cuadrantes</h1>
        <p className="mt-1 text-sm text-slate-500">Residencia Alhendín · Grupo Longea</p>

        {enviado ? (
          <div className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            Si tu correo está dado de alta, te hemos enviado un enlace de acceso.
            Revisa tu bandeja de entrada (caduca en 15 minutos).
          </div>
        ) : (
          <form action={action} className="mt-6 space-y-4">
            {errorMsg && (
              <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{errorMsg}</p>
            )}
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
            <button
              type="submit"
              className="w-full rounded-lg bg-cyan-700 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-800"
            >
              Enviarme el enlace de acceso
            </button>
            <p className="text-center text-xs text-slate-400">
              Te enviaremos un enlace mágico. No necesitas contraseña.
            </p>
          </form>
        )}
      </div>
    </main>
  );
}
