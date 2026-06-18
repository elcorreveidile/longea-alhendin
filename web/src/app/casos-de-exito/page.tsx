import type { Metadata } from "next";
import Link from "next/link";
import MarketingHeader from "@/components/MarketingHeader";
import MarketingFooter from "@/components/MarketingFooter";

export const metadata: Metadata = {
  title: "Casos de éxito · PlanTurnos",
  description:
    "Cómo una residencia de mayores pasó de medio día cuadrando turnos en Excel a tenerlos listos en segundos con PlanTurnos. Un caso real.",
};

const METRICAS = [
  { n: "½ día → minutos", d: "Tiempo en montar el cuadrante mensual" },
  { n: "0", d: "Incumplimientos de descansos y coberturas" },
  { n: "100%", d: "Del equipo consultando su turno en el móvil" },
];

export default function CasosPage() {
  return (
    <div className="min-h-screen bg-[#faf6ee] text-slate-800">
      <MarketingHeader />

      <section className="mx-auto max-w-3xl px-5 py-16 text-center">
        <span className="inline-block rounded-full bg-cyan-100 px-3 py-1 text-xs font-semibold text-cyan-800">
          Caso real
        </span>
        <h1 className="mt-4 text-4xl font-extrabold text-slate-900 sm:text-5xl">
          De un Excel imposible a los turnos <span className="text-cyan-700">en segundos</span>
        </h1>
        <p className="mt-5 text-lg text-slate-600">
          Una residencia de mayores nos contó su problema. Hoy montan el cuadrante con un clic.
        </p>
      </section>

      <section className="mx-auto max-w-5xl px-5 pb-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/img/home-hero2.webp" alt="Planificando los turnos del equipo" className="h-64 w-full rounded-3xl object-cover shadow-xl sm:h-80" />
      </section>

      <section className="mx-auto max-w-4xl px-5">
        <div className="grid gap-4 sm:grid-cols-3">
          {METRICAS.map((m) => (
            <div key={m.d} className="rounded-2xl border border-[#e7dcc4] bg-white p-6 text-center shadow-sm">
              <p className="text-2xl font-extrabold text-cyan-700">{m.n}</p>
              <p className="mt-1 text-sm text-slate-600">{m.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-3xl space-y-8 px-5 py-14">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">El problema</h2>
          <p className="mt-3 text-slate-700">
            La coordinadora dedicaba <strong>medio día cada mes</strong> a cuadrar turnos en una hoja de Excel
            gigante: coberturas de mañana, tarde y noche, ratios de personal, descansos del convenio, vacaciones
            solapadas y un montón de casos particulares. Y aun así, al publicarlo, siempre había quejas por el
            reparto.
          </p>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">La solución</h2>
          <p className="mt-3 text-slate-700">
            Construimos un <strong>motor que entiende sus reglas</strong> y calcula el mejor cuadrante posible en
            segundos. Si por números un día no se puede cubrir, no falla: lo genera igual y avisa exactamente de
            qué falta. La coordinadora puede ajustar a mano lo que quiera y, al publicar, el equipo recibe el aviso.
          </p>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">El resultado</h2>
          <p className="mt-3 text-slate-700">
            Lo que antes era media jornada ahora es <strong>un clic</strong>. Cero errores de convenio, reparto justo
            de noches y findes, y cada trabajadora consultando su turno desde el móvil. Se acabaron las llamadas y los
            papeles.
          </p>
        </div>

        <blockquote className="rounded-2xl border-l-4 border-cyan-600 bg-white p-6 shadow-sm">
          <p className="text-lg font-medium italic text-slate-800">
            “Hacer el cuadrante me llevaba medio día. Ahora lo tengo en un par de minutos y sin errores.”
          </p>
          <footer className="mt-2 text-sm text-slate-500">— Coordinadora de residencia</footer>
        </blockquote>
      </section>

      <section className="bg-cyan-700">
        <div className="mx-auto max-w-3xl px-5 py-16 text-center text-white">
          <h2 className="text-3xl font-bold">¿Quieres ser el próximo caso de éxito?</h2>
          <p className="mt-2 text-cyan-100">Te montamos una prueba con tu plantilla y tus reglas, sin compromiso.</p>
          <Link href="/contacto" className="mt-6 inline-block rounded-lg bg-white px-8 py-3 font-semibold text-cyan-800 hover:bg-cyan-50">
            Quiero probarlo
          </Link>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
