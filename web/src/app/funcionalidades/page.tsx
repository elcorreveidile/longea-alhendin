import type { Metadata } from "next";
import Link from "next/link";
import MarketingHeader from "@/components/MarketingHeader";
import MarketingFooter from "@/components/MarketingFooter";

export const metadata: Metadata = {
  title: "Funcionalidades · PlanTurnos",
  description:
    "Todo lo que hace PlanTurnos: generación automática de cuadrantes, reglas configurables, edición manual, portal del trabajador, vacaciones, avisos y exportación a PDF/Excel.",
};

const FEATURES = [
  { icon: "icon-generar", t: "Generación automática", d: "Crea el cuadrante del mes o de la semana en segundos, respetando coberturas, descansos y convenio." },
  { icon: "icon-reglas", t: "Reglas configurables", d: "Cobertura por turno, máximo de días seguidos, descansos, domingos libres… Tú las ajustas sin tocar código." },
  { icon: "icon-editar", t: "Edición manual", d: "Toca una casilla y cambia el turno. El motor te da el grueso hecho y tú rematas los detalles." },
  { icon: "icon-semana", t: "Cuadrante por semanas", d: "Genera y publica semana a semana cuando lo necesites, con las mismas reglas que el mes." },
  { icon: "icon-plantilla", t: "Gestión de plantilla", d: "Altas, bajas y datos de cada persona: puesto, turno fijo, sin noches… Todo en un sitio." },
  { icon: "icon-ficha", t: "Ficha del trabajador", d: "Datos, preferencias, foto, vacaciones y hoja de servicio de cada miembro del equipo." },
  { icon: "icon-vacaciones", t: "Vacaciones y solapes", d: "Registra vacaciones por persona y míralas en un calendario para detectar solapes de un vistazo." },
  { icon: "icon-avisar", t: "Avisos automáticos", d: "Al publicar el cuadrante, tu equipo recibe un aviso por email o SMS. Sin grupos de WhatsApp." },
  { icon: "icon-mi-turno", t: "Portal del trabajador", d: "Cada persona ve su turno de hoy, mañana y el mes entero desde el móvil." },
  { icon: "icon-pdf", t: "Exporta a PDF y Excel", d: "Descarga el cuadrante con colores, listo para imprimir, enviar o colgar." },
  { icon: "icon-acceso", t: "Acceso seguro", d: "Cada persona entra con su correo o móvil. Sin contraseñas complicadas ni apps que instalar." },
];

export default function FuncionalidadesPage() {
  return (
    <div className="min-h-screen bg-[#faf6ee] text-slate-800">
      <MarketingHeader />

      <section className="mx-auto max-w-3xl px-5 py-16 text-center">
        <span className="inline-block rounded-full bg-cyan-100 px-3 py-1 text-xs font-semibold text-cyan-800">
          Funcionalidades
        </span>
        <h1 className="mt-4 text-4xl font-extrabold text-slate-900 sm:text-5xl">
          Todo lo que necesitas para tus turnos, <span className="text-cyan-700">en un solo sitio</span>
        </h1>
        <p className="mt-5 text-lg text-slate-600">
          Desde generar el cuadrante hasta que cada trabajador lo ve en el móvil. Sin Excel y sin papeles.
        </p>
      </section>

      <section className="mx-auto max-w-5xl px-5 pb-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/img/home-hero3.webp" alt="El cuadrante en el ordenador y en el móvil" className="h-64 w-full rounded-3xl object-cover shadow-xl sm:h-80" />
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-12">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.t} className="rounded-2xl border border-[#e7dcc4] bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/icons/${f.icon}.png`} alt="" className="h-12 w-12" />
              <h2 className="mt-3 text-lg font-bold text-slate-900">{f.t}</h2>
              <p className="mt-1 text-sm text-slate-600">{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-cyan-700">
        <div className="mx-auto max-w-3xl px-5 py-16 text-center text-white">
          <h2 className="text-3xl font-bold">¿Lo vemos con tu equipo?</h2>
          <p className="mt-2 text-cyan-100">Te montamos una prueba a tu medida, sin compromiso.</p>
          <Link href="/contacto" className="mt-6 inline-block rounded-lg bg-white px-8 py-3 font-semibold text-cyan-800 hover:bg-cyan-50">
            Pruébalo gratis
          </Link>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
