import type { Metadata } from "next";
import Link from "next/link";
import MarketingHeader from "@/components/MarketingHeader";
import MarketingFooter from "@/components/MarketingFooter";

export const metadata: Metadata = {
  title: "Sobre nosotros · PlanTurnos",
  description:
    "Somos especialistas en la digitalización del sector productivo. Creamos herramientas a medida, como PlanTurnos, que ahorran tiempo real a las empresas.",
};

const VALORES = [
  { t: "A medida, no “para todos”", d: "El software se adapta a tu empresa y a tu convenio, no al revés." },
  { t: "Sencillo de usar", d: "Sin cursillos ni manuales: si sabes usar el móvil, sabes usar PlanTurnos." },
  { t: "Cercanía", d: "Hablas con quien desarrolla. Te escuchamos y lo ajustamos a tu caso." },
  { t: "Resultados reales", d: "Medimos el éxito en horas ahorradas y problemas que desaparecen." },
];

export default function SobreNosotrosPage() {
  return (
    <div className="min-h-screen bg-[#faf6ee] text-slate-800">
      <MarketingHeader />

      <section className="mx-auto max-w-3xl px-5 py-16 text-center">
        <span className="inline-block rounded-full bg-cyan-100 px-3 py-1 text-xs font-semibold text-cyan-800">
          Quiénes somos
        </span>
        <h1 className="mt-4 text-4xl font-extrabold text-slate-900 sm:text-5xl">
          Especialistas en <span className="text-cyan-700">digitalización del sector productivo</span>
        </h1>
        <p className="mt-5 text-lg text-slate-600">
          Ayudamos a empresas con personal a turnos a quitarse de encima el trabajo manual y repetitivo.
          PlanTurnos nació de un problema real —los cuadrantes en Excel— y hoy es una herramienta que
          ahorra horas cada mes. Esa es nuestra forma de trabajar: detectar el dolor y construir la solución.
        </p>
      </section>

      <section className="mx-auto max-w-3xl px-5 pb-4">
        <div className="rounded-2xl border-l-4 border-cyan-600 bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900">Cómo nació PlanTurnos</h2>
          <div className="mt-4 space-y-4 text-slate-700">
            <p>
              Todo empezó con una conversación. Hace unas semanas, en la despedida de un amigo que vuelve a vivir
              fuera de España, nos juntamos los de siempre. Entre ellos estaba <strong>Diana</strong> —amiga común y
              cuidadora en una residencia de mayores—, que nos contó, entre nervios e ilusión, que la iban a ascender
              a <strong>supervisora del personal</strong>… y que el tema de los cuadrantes la tenía agobiada.
            </p>
            <p>
              Unos días después me escribió por WhatsApp:{" "}
              <em>«¿Te acuerdas de eso que te comenté? Voy a ser supervisora a partir de julio y estoy súper liada
              con los cuadrantes. ¿Me podrías ayudar con una de esas aplicaciones que tú haces?»</em>.
            </p>
            <p>
              Así, sin más, nació <strong>PlanTurnos</strong>: de la necesidad real de una amiga y de las ganas de
              echarle una mano. Lo desarrollé para que le sirviera, al menos, en esos primeros meses de julio y
              agosto.
            </p>
            <p>
              Pero había una <strong>segunda razón, más personal</strong>. Yo mismo he sufrido en mis trabajos turnos
              que parecían caprichosos, repartidos sin demasiado criterio y que te trastocan la vida. Y pensé: si una
              herramienta bien diseñada puede solucionarle esto a Diana, puede hacerlo en muchísimas empresas. Porque
              unos turnos justos y bien organizados no son un lujo: son <strong>calidad de vida</strong> para quien
              madruga, trasnocha y sostiene el día a día de cualquier empresa del sector productivo.
            </p>
            <p>
              Funcionó tan bien que decidimos convertirlo en una herramienta para cualquier equipo que pelea cada mes
              con sus turnos.
            </p>
            <p className="font-medium text-slate-800">
              Eso resume nuestra forma de trabajar: una idea, una necesidad, una conversación… y una solución a medida.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-5 pb-6">
        <div className="rounded-2xl border border-[#e7dcc4] bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900">Nuestra misión</h2>
          <p className="mt-3 text-slate-700">
            Que la tecnología trabaje para ti, y no al revés. Muchas empresas pierden horas en tareas que un
            sistema bien hecho resuelve en segundos: cuadrantes, avisos, control de vacaciones, partes…
            Nosotros las digitalizamos con herramientas claras, rápidas y hechas a vuestra medida.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-12">
        <h2 className="text-center text-2xl font-bold text-slate-900">Cómo trabajamos</h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          {VALORES.map((v) => (
            <div key={v.t} className="rounded-2xl border border-[#e7dcc4] bg-white p-6 shadow-sm">
              <h3 className="font-semibold text-slate-800">{v.t}</h3>
              <p className="mt-1 text-sm text-slate-600">{v.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-cyan-700">
        <div className="mx-auto max-w-3xl px-5 py-16 text-center text-white">
          <h2 className="text-3xl font-bold">¿Tienes un proceso que te roba tiempo?</h2>
          <p className="mt-2 text-cyan-100">Cuéntanoslo. A veces la solución es más sencilla (y asequible) de lo que crees.</p>
          <Link href="/contacto" className="mt-6 inline-block rounded-lg bg-white px-8 py-3 font-semibold text-cyan-800 hover:bg-cyan-50">
            Hablemos
          </Link>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
