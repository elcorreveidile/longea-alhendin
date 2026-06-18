import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Por aquí no se pasa · PlanTurnos",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#faf6ee] px-6 py-16 text-center text-slate-800">
      <div className="w-full max-w-lg">
        <div className="mb-6 flex justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-symbol.png" alt="" className="h-12 w-12 opacity-80" />
        </div>

        <p className="text-sm font-semibold uppercase tracking-widest text-[#8a6d3b]">Error 404</p>
        <h1 className="mt-3 text-3xl font-extrabold text-slate-900 sm:text-4xl">
          Aquí no hay nada que rascar 👀
        </h1>

        <p className="mt-5 text-lg text-slate-600">
          ¿Buscabas <code className="rounded bg-white px-1.5 py-0.5 text-sm text-slate-500">wp-admin</code>,{" "}
          <code className="rounded bg-white px-1.5 py-0.5 text-sm text-slate-500">.git</code>,{" "}
          <code className="rounded bg-white px-1.5 py-0.5 text-sm text-slate-500">.env</code> o alguna
          puertecita trasera? Pues no. Esto está cerrado a cal y canto.
        </p>
        <p className="mt-3 text-slate-600">
          Te invitamos amablemente a <strong>irte a tomar viento</strong> 🌬️… o, si de verdad eres de
          los nuestros, a entrar por la puerta de delante, como las personas decentes.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/" className="rounded-lg bg-cyan-700 px-6 py-3 font-semibold text-white hover:bg-cyan-800">
            Ir a la página principal
          </Link>
          <Link href="/login" className="rounded-lg border border-cyan-700 px-6 py-3 font-semibold text-cyan-700 hover:bg-cyan-50">
            Acceder con mi correo
          </Link>
        </div>

        <p className="mt-10 text-xs text-slate-400">
          Por cierto: cada intento queda registrado. Sonríe, que sales en la foto 📸
        </p>
      </div>
    </main>
  );
}
