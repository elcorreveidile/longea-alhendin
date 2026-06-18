import type { Metadata } from "next";
import Link from "next/link";
import MarketingHeader from "@/components/MarketingHeader";
import MarketingFooter from "@/components/MarketingFooter";

export const metadata: Metadata = {
  title: "Preguntas frecuentes · PlanTurnos",
  description:
    "Resolvemos las dudas más habituales sobre PlanTurnos: normativa, instalación, prueba gratuita, sectores, precios y soporte.",
};

const FAQ = [
  { q: "¿Cumple la normativa laboral?", a: "Sí. El motor respeta los descansos (36 h semanales y 12 h entre turnos), los máximos de días seguidos, los domingos libres y las vacaciones. Además, tú configuras las reglas concretas de tu convenio." },
  { q: "¿Mis trabajadores necesitan instalar algo?", a: "No. Entran desde el móvil con su correo o número, sin apps ni contraseñas complicadas, y ven su turno al momento." },
  { q: "¿Puedo probarlo antes de pagar?", a: "Sí. Ofrecemos una prueba gratuita montada con tu plantilla y tus reglas para que valores si encaja en tu centro, sin compromiso." },
  { q: "¿Sirve para mi sector?", a: "PlanTurnos funciona para cualquier empresa con personal a turnos: residencias, clínicas, hostelería, seguridad, limpieza, industria y academias, entre otros." },
  { q: "¿Y si un día no se puede cubrir por falta de personal?", a: "El sistema no falla: genera igualmente el cuadrante y te avisa exactamente de qué turno y qué día se queda corto, para que tú decidas." },
  { q: "¿Puedo cambiar el cuadrante a mano?", a: "Claro. El motor te da el cuadrante casi terminado y tú puedes ajustar cualquier casilla con un clic." },
  { q: "¿Cómo se enteran los trabajadores de un cuadrante nuevo?", a: "Cuando lo publicas, tu equipo recibe un aviso automático por email o SMS, y lo consultan desde el móvil." },
  { q: "¿Mis datos están seguros?", a: "Sí. Cada empresa tiene su espacio privado, los accesos son individuales y aplicamos medidas de seguridad. Cumplimos el RGPD." },
  { q: "¿Tiene permanencia?", a: "No. En la modalidad de suscripción puedes cancelar cuando quieras." },
];

export default function FaqPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <div className="min-h-screen bg-[#faf6ee] text-slate-800">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <MarketingHeader />

      <section className="mx-auto max-w-3xl px-5 py-16 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icons/icon-faq.png" alt="" className="mx-auto mb-3 h-14 w-14" />
        <span className="inline-block rounded-full bg-cyan-100 px-3 py-1 text-xs font-semibold text-cyan-800">
          Preguntas frecuentes
        </span>
        <h1 className="mt-4 text-4xl font-extrabold text-slate-900 sm:text-5xl">Resolvemos tus dudas</h1>
        <p className="mt-5 text-lg text-slate-600">Y si te queda alguna, escríbenos y te la contamos.</p>
      </section>

      <section className="mx-auto max-w-3xl px-5 pb-12">
        <div className="space-y-3">
          {FAQ.map((f) => (
            <details key={f.q} className="group rounded-xl border border-[#e7dcc4] bg-white p-4">
              <summary className="cursor-pointer list-none font-semibold text-slate-800 marker:hidden">{f.q}</summary>
              <p className="mt-2 text-sm text-slate-600">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="bg-cyan-700">
        <div className="mx-auto max-w-3xl px-5 py-16 text-center text-white">
          <h2 className="text-3xl font-bold">¿Te queda alguna duda?</h2>
          <p className="mt-2 text-cyan-100">Cuéntanosla y te respondemos sin compromiso.</p>
          <Link href="/contacto" className="mt-6 inline-block rounded-lg bg-white px-8 py-3 font-semibold text-cyan-800 hover:bg-cyan-50">
            Escríbenos
          </Link>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
