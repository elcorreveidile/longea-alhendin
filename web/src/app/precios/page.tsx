import type { Metadata } from "next";
import Link from "next/link";
import MarketingHeader from "@/components/MarketingHeader";
import MarketingFooter from "@/components/MarketingFooter";

export const metadata: Metadata = {
  title: "Precios · PlanTurnos",
  description:
    "Precios sencillos de PlanTurnos: suscripción mensual o compra única. Prueba gratuita para valorar el ajuste a tu centro. Sin permanencia.",
};

export default function PreciosPage() {
  return (
    <div className="min-h-screen bg-[#faf6ee] text-slate-800">
      <MarketingHeader />

      <section className="mx-auto max-w-3xl px-5 py-16 text-center">
        <span className="inline-block rounded-full bg-cyan-100 px-3 py-1 text-xs font-semibold text-cyan-800">
          Precios
        </span>
        <h1 className="mt-4 text-4xl font-extrabold text-slate-900 sm:text-5xl">
          Sencillo y sin sorpresas
        </h1>
        <p className="mt-5 text-lg text-slate-600">
          Elige pago mensual o compra única. Empieza con una prueba gratuita y sin permanencia.
        </p>
      </section>

      <section className="mx-auto max-w-4xl px-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="rounded-2xl border-2 border-cyan-600 bg-white p-7 shadow-sm">
            <span className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-semibold text-cyan-800">Recomendado</span>
            <h2 className="mt-3 text-xl font-bold text-slate-900">Suscripción</h2>
            <p className="mt-2 text-3xl font-extrabold text-slate-900">49 €<span className="text-base font-medium text-slate-500">/mes por centro</span></p>
            <p className="text-sm text-slate-500">o 1,50 € por trabajador/mes</p>
            <ul className="mt-4 space-y-1.5 text-sm text-slate-600">
              <li>✓ Todo incluido (alojamiento, soporte, actualizaciones)</li>
              <li>✓ Sin pago inicial</li>
              <li>✓ Cancela cuando quieras</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-[#e7dcc4] bg-white p-7 shadow-sm">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">Pago único</span>
            <h2 className="mt-3 text-xl font-bold text-slate-900">Compra</h2>
            <p className="mt-2 text-3xl font-extrabold text-slate-900">1.297 €<span className="text-base font-medium text-slate-500"> única</span></p>
            <p className="text-sm text-slate-500">+ mantenimiento desde 29 €/mes</p>
            <ul className="mt-4 space-y-1.5 text-sm text-slate-600">
              <li>✓ La app en propiedad de uso</li>
              <li>✓ Mantenimiento opcional</li>
              <li>✓ Ideal si prefieres no pagar mensual</li>
            </ul>
          </div>
        </div>
        <p className="mt-4 text-center text-xs text-slate-400">Precios + IVA. Prueba gratuita para valorar el ajuste a tu centro.</p>
      </section>

      <section className="mx-auto max-w-3xl px-5 py-12 text-center">
        <p className="text-slate-600">
          ¿Dudas sobre el plan que te encaja? Lo vemos juntos.{" "}
          <Link href="/preguntas-frecuentes" className="font-medium text-cyan-700 hover:underline">Preguntas frecuentes</Link>.
        </p>
      </section>

      <section className="bg-cyan-700">
        <div className="mx-auto max-w-3xl px-5 py-16 text-center text-white">
          <h2 className="text-3xl font-bold">Empieza con una prueba gratis</h2>
          <p className="mt-2 text-cyan-100">Te lo montamos con tu plantilla y tus reglas, sin compromiso.</p>
          <Link href="/contacto" className="mt-6 inline-block rounded-lg bg-white px-8 py-3 font-semibold text-cyan-800 hover:bg-cyan-50">
            Pruébalo gratis
          </Link>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
