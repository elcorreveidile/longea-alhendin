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

      <section className="mx-auto max-w-5xl px-5 pt-14 pb-4 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icons/icon-demo.png" alt="" className="mx-auto mb-3 h-14 w-14" />
        <span className="inline-block rounded-full bg-cyan-100 px-3 py-1 text-xs font-semibold text-cyan-800">
          Demo interactiva
        </span>
        <h1 className="mt-4 text-4xl font-extrabold text-slate-900 sm:text-5xl">
          Míralo funcionar <span className="text-cyan-700">ahora mismo</span>
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-600">
          Elige cuánta gente tienes y cuántas personas necesitas por turno. Pulsa el botón y el motor te
          genera una semana completa en segundos, respetando descansos y máximos. Sin registrarte.
        </p>
      </section>

      {/* Simulador sobre fondo decorativo difuminado */}
      <section className="relative isolate overflow-hidden py-10">
        <div className="absolute inset-0 -z-20 bg-cover bg-center" style={{ backgroundImage: "url(/img/background.webp)" }} />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[#faf6ee] via-[#faf6ee]/75 to-[#faf6ee]" />
        <div className="mx-auto max-w-5xl px-5">
          <DemoGenerator />
          <p className="mt-6 text-center text-sm text-slate-600">
            Esto es solo una muestra. Con tu plantilla real, tus roles y tu convenio, el resultado es aún mejor.{" "}
            <Link href="/contacto" className="font-medium text-cyan-700 hover:underline">Pídenos una prueba a tu medida →</Link>
          </p>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
