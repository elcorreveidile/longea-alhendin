import type { Metadata } from "next";
import Link from "next/link";
import MarketingHeader from "@/components/MarketingHeader";
import MarketingFooter from "@/components/MarketingFooter";

export const metadata: Metadata = {
  title: "Cómo funciona · PlanTurnos",
  description:
    "Así de fácil es usar PlanTurnos: carga tu plantilla, define tus reglas, genera el cuadrante en segundos, ajústalo y publícalo. Tu equipo lo ve en el móvil.",
};

const PASOS = [
  {
    icon: "icon-plantilla",
    t: "1. Carga tu plantilla",
    d: "Das de alta a tu equipo con su puesto, sus preferencias (quién no hace noches, turnos fijos…) y sus vacaciones. Se hace una vez y se queda guardado.",
  },
  {
    icon: "icon-reglas",
    t: "2. Define tus reglas",
    d: "Indicas cuántas personas necesitas por turno, los descansos, el máximo de días seguidos, los domingos libres… Tú mandas, y lo cambias cuando quieras sin tocar código.",
  },
  {
    icon: "icon-generar",
    t: "3. Genera el cuadrante",
    d: "Pulsas «Generar» y en segundos tienes el mes (o la semana) completo, equilibrado y cumpliendo tus reglas. Si algún día no se puede cubrir, te avisa de qué falta.",
  },
  {
    icon: "icon-editar",
    t: "4. Ajusta a mano si quieres",
    d: "¿Un cambio de última hora? Tocas una casilla y cambias el turno. El cuadrante es tuyo: el motor te da el 95% hecho y tú rematas.",
  },
  {
    icon: "icon-avisar",
    t: "5. Publica y avisa",
    d: "Cuando esté listo, lo publicas y tu equipo recibe un aviso por email o SMS. Nada de fotos por WhatsApp ni papeles en el tablón.",
  },
  {
    icon: "icon-mi-turno",
    t: "6. Cada persona ve su turno",
    d: "Tus trabajadores entran desde el móvil y ven su turno de hoy, mañana y el mes entero. Pueden descargarlo en PDF. Se acabaron las llamadas de «¿yo qué turno tengo?».",
  },
];

export default function ComoFuncionaPage() {
  return (
    <div className="min-h-screen bg-[#faf6ee] text-slate-800">
      <MarketingHeader />

      <section className="mx-auto max-w-3xl px-5 py-16 text-center">
        <span className="inline-block rounded-full bg-cyan-100 px-3 py-1 text-xs font-semibold text-cyan-800">
          Cómo funciona
        </span>
        <h1 className="mt-4 text-4xl font-extrabold text-slate-900 sm:text-5xl">
          De la plantilla al móvil de tu equipo, <span className="text-cyan-700">en 6 pasos</span>
        </h1>
        <p className="mt-5 text-lg text-slate-600">
          Sin instalar nada y sin cursillos. Funciona en el navegador y en el móvil.
        </p>
      </section>

      <section className="mx-auto max-w-4xl px-5 pb-12">
        <div className="space-y-4">
          {PASOS.map((p) => (
            <div key={p.t} className="flex items-start gap-4 rounded-2xl border border-[#e7dcc4] bg-white p-6 shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/icons/${p.icon}.png`} alt="" className="h-12 w-12 shrink-0" />
              <div>
                <h2 className="text-lg font-bold text-slate-900">{p.t}</h2>
                <p className="mt-1 text-slate-600">{p.d}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-cyan-700">
        <div className="mx-auto max-w-3xl px-5 py-16 text-center text-white">
          <h2 className="text-3xl font-bold">Pruébalo con tu propio equipo</h2>
          <p className="mt-2 text-cyan-100">Te lo dejamos montado con tu plantilla y tus reglas para que lo veas funcionando.</p>
          <Link href="/contacto" className="mt-6 inline-block rounded-lg bg-white px-8 py-3 font-semibold text-cyan-800 hover:bg-cyan-50">
            Pruébalo gratis
          </Link>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
