import type { Metadata } from "next";
import Link from "next/link";
import MarketingHeader from "@/components/MarketingHeader";
import MarketingFooter from "@/components/MarketingFooter";

export const metadata: Metadata = {
  title: "Precios · PlanTurnos",
  description:
    "Precios sencillos de PlanTurnos: 49 €/mes por centro o 490 €/año (2 meses gratis), hasta 50 trabajadores. Más de 50 o varios centros, precio a medida. Sin permanencia.",
};

export default function PreciosPage() {
  return (
    <div className="min-h-screen bg-[#faf6ee] text-slate-800">
      <MarketingHeader />

      <section className="mx-auto max-w-3xl px-5 py-16 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icons/icon-precios.png" alt="" className="mx-auto mb-3 h-14 w-14" />
        <span className="inline-block rounded-full bg-cyan-100 px-3 py-1 text-xs font-semibold text-cyan-800">
          Precios
        </span>
        <h1 className="mt-4 text-4xl font-extrabold text-slate-900 sm:text-5xl">
          Sencillo y sin sorpresas
        </h1>
        <p className="mt-5 text-lg text-slate-600">
          49 € al mes por centro (hasta 50 trabajadores), o 490 € al año con 2 meses gratis. ¿Más de 50 o varios centros? Precio a medida. Sin permanencia.
        </p>
      </section>

      <section className="mx-auto max-w-5xl px-5">
        <div className="grid gap-5 sm:grid-cols-3">
          <div className="rounded-2xl border border-[#e7dcc4] bg-white p-7 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">Mensual</h2>
            <p className="mt-2 text-3xl font-extrabold text-slate-900">49 €<span className="text-base font-medium text-slate-500">/mes</span></p>
            <p className="text-sm text-slate-500">por centro · hasta 50 trabajadores</p>
            <ul className="mt-4 space-y-1.5 text-sm text-slate-600">
              <li>✓ Todo incluido (alojamiento, soporte, actualizaciones)</li>
              <li>✓ Sin pago inicial · sin permanencia</li>
              <li>✓ Cancela cuando quieras</li>
            </ul>
            <Link href="/contacto" className="mt-5 inline-block rounded-lg border border-cyan-700 px-6 py-2.5 text-sm font-semibold text-cyan-700 hover:bg-cyan-50">
              Empezar
            </Link>
          </div>
          <div className="rounded-2xl border-2 border-cyan-600 bg-white p-7 shadow-sm">
            <span className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-semibold text-cyan-800">Mejor precio · 2 meses gratis</span>
            <h2 className="mt-3 text-lg font-bold text-slate-900">Anual</h2>
            <p className="mt-2 text-3xl font-extrabold text-slate-900">490 €<span className="text-base font-medium text-slate-500">/año</span></p>
            <p className="text-sm text-slate-500">por centro · una sola factura al año</p>
            <ul className="mt-4 space-y-1.5 text-sm text-slate-600">
              <li>✓ 2 meses gratis (490 € en vez de 588 €)</li>
              <li>✓ Todo incluido · hasta 50 trabajadores</li>
              <li>✓ Ideal como licencia anual (entidades y centros públicos)</li>
            </ul>
            <Link href="/contacto" className="mt-5 inline-block rounded-lg bg-cyan-700 px-6 py-2.5 text-sm font-semibold text-white hover:bg-cyan-800">
              Pruébalo gratis
            </Link>
          </div>
          <div className="rounded-2xl border border-[#e7dcc4] bg-white p-7 shadow-sm">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">Más de 50 · varios centros</span>
            <h2 className="mt-3 text-lg font-bold text-slate-900">A medida</h2>
            <p className="mt-2 text-3xl font-extrabold text-slate-900">Consúltanos</p>
            <p className="text-sm text-slate-500">centros grandes o cadenas</p>
            <ul className="mt-4 space-y-1.5 text-sm text-slate-600">
              <li>✓ Tarifa adaptada al tamaño</li>
              <li>✓ Varios centros bajo una misma cuenta</li>
              <li>✓ Soporte prioritario</li>
            </ul>
            <Link href="/contacto" className="mt-5 inline-block rounded-lg border border-cyan-700 px-6 py-2.5 text-sm font-semibold text-cyan-700 hover:bg-cyan-50">
              Pedir presupuesto
            </Link>
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
