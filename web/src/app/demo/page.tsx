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

      <section className="mx-auto max-w-5xl px-5 py-14">
        <div className="text-center">
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
        </div>

        <div className="mt-8">
          <DemoGenerator />
        </div>

        <p className="mt-6 text-center text-sm text-slate-500">
          Esto es solo una muestra. Con tu plantilla real, tus roles y tu convenio, el resultado es aún mejor.{" "}
          <Link href="/contacto" className="font-medium text-cyan-700 hover:underline">Pídenos una prueba a tu medida →</Link>
        </p>
      </section>

      <MarketingFooter />
    </div>
  );
}
