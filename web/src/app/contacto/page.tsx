import { redirect } from "next/navigation";
import { sendContactEmail } from "@/lib/email";
import DevCredit from "@/components/DevCredit";

const MSG: Record<string, string> = {
  faltan: "Rellena tu nombre, correo y mensaje.",
  robot: "Marca la casilla para confirmar que no eres un robot.",
  error: "No se pudo enviar. Inténtalo de nuevo en un momento.",
};

async function contactAction(formData: FormData) {
  "use server";
  // Honeypot: si un bot rellena este campo oculto, descartamos en silencio.
  if (String(formData.get("website") ?? "").trim() !== "") redirect("/contacto?enviado=1");

  if (formData.get("human") !== "on") redirect("/contacto?error=robot");

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const org = String(formData.get("org") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();

  if (!name || !email.includes("@") || !message) redirect("/contacto?error=faltan");

  let ok = true;
  try {
    await sendContactEmail({ name, email, org: org || undefined, message });
  } catch {
    ok = false;
  }
  redirect(ok ? "/contacto?enviado=1" : "/contacto?error=error");
}

export default async function ContactoPage({
  searchParams,
}: {
  searchParams: Promise<{ enviado?: string; error?: string }>;
}) {
  const sp = await searchParams;
  const errorMsg = sp.error ? MSG[sp.error] ?? "Ha ocurrido un error." : null;
  const sent = sp.enviado === "1";

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-cyan-50 to-white p-6">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm">
        <a href="/" className="text-sm font-medium text-cyan-700 hover:underline">← Volver</a>
        <h1 className="mt-3 text-2xl font-bold text-slate-900">Hablemos</h1>
        <p className="mt-1 mb-6 text-sm text-slate-500">
          Cuéntanos sobre tu centro y te montamos una prueba sin compromiso.
        </p>

        {sent ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            ✓ ¡Mensaje enviado! Te responderemos pronto. Gracias por tu interés.
          </div>
        ) : (
          <form action={contactAction} className="space-y-4">
            {errorMsg && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{errorMsg}</p>}

            {/* Honeypot (oculto a personas) */}
            <input
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              className="absolute left-[-9999px] h-0 w-0 opacity-0"
              aria-hidden="true"
            />

            <div>
              <label htmlFor="name" className="text-sm font-medium text-slate-700">Nombre</label>
              <input id="name" name="name" required
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-cyan-500" />
            </div>
            <div>
              <label htmlFor="email" className="text-sm font-medium text-slate-700">Correo</label>
              <input id="email" name="email" type="email" required autoComplete="email"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-cyan-500" />
            </div>
            <div>
              <label htmlFor="org" className="text-sm font-medium text-slate-700">Centro o empresa <span className="text-slate-400">(opcional)</span></label>
              <input id="org" name="org"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-cyan-500" />
            </div>
            <div>
              <label htmlFor="message" className="text-sm font-medium text-slate-700">Mensaje</label>
              <textarea id="message" name="message" required rows={4}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-cyan-500" />
            </div>

            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" name="human" required className="h-4 w-4 rounded border-slate-300 text-cyan-700 focus:ring-cyan-500" />
              No soy un robot 🤖
            </label>

            <button className="w-full rounded-lg bg-cyan-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-cyan-800">
              Enviar mensaje
            </button>
          </form>
        )}

        <DevCredit />
      </div>
    </main>
  );
}
