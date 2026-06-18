import type { Metadata } from "next";
import Link from "next/link";
import MarketingHeader from "@/components/MarketingHeader";
import MarketingFooter from "@/components/MarketingFooter";
import DemoGenerator from "@/components/DemoGenerator";

export const metadata: Metadata = {
  title: "Demo interactiva · PlanTurnos",
  description:
    "Prueba PlanTurnos ahora mismo: elige el tamaño del equipo y la cobertura, pulsa un botón y mira cómo genera una semana de turnos en segundos.",
};

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-[#faf6ee] text-slate-800">
      <MarketingHeader />

      {/* Hero con fondo decorativo */}
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-cover bg-center" style={{ backgroundImage: "url(/img/background.webp)" }} />
        <div className="absolute inset-0 -z-10 bg-slate-900/40" />
        <div className="mx-auto max-w-5xl px-5 py-16 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/icon-demo.png" alt="" className="mx-auto mb-3 h-14 w-14 drop-shadow" />
          <span className="inline-block rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white ring-1 ring-white/30">
            Demo interactiva
          </span>
          <h1 className="mt-4 text-4xl font-extrabold text-white drop-shadow sm:text-5xl">
            Míralo funcionar <span className="text-cyan-300">ahora mismo</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-100/90">
            Elige cuánta gente tienes y cuántas personas necesitas por turno. Pulsa el botón y el motor te
            genera una semana completa en segundos, respetando descansos y máximos. Sin registrarte.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 py-12">
        <DemoGenerator />

        <p className="mt-6 text-center text-sm text-slate-500">
          Esto es solo una muestra. Con tu plantilla real, tus roles y tu convenio, el resultado es aún mejor.{" "}
          <Link href="/contacto" className="font-medium text-cyan-700 hover:underline">Pídenos una prueba a tu medida →</Link>
        </p>
      </section>

      <MarketingFooter />
    </div>
  );
}
