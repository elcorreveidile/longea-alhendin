import type { Metadata } from "next";
import Link from "next/link";
import { SECTORES } from "@/data/sectores";
import MarketingHeader from "@/components/MarketingHeader";
import MarketingFooter from "@/components/MarketingFooter";

export const metadata: Metadata = {
  title: "Cuadrantes para cada sector · PlanTurnos",
  description:
    "PlanTurnos genera los turnos cumpliendo el convenio de tu sector: residencias, clínicas, hostelería, seguridad, limpieza, industria y academias. Especialistas en digitalización del sector productivo.",
};

export default function SectoresPage() {
  return (
    <div className="min-h-screen bg-[#faf6ee] text-slate-800">
      <MarketingHeader />

      <section className="mx-auto max-w-5xl px-5 py-16 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icons/icon-sectores.png" alt="" className="mx-auto mb-3 h-14 w-14" />
        <span className="inline-block rounded-full bg-cyan-100 px-3 py-1 text-xs font-semibold text-cyan-800">
          Digitalización del sector productivo
        </span>
        <h1 className="mt-4 text-4xl font-extrabold text-slate-900 sm:text-5xl">
          Un cuadrante distinto para <span className="text-cyan-700">cada sector</span>
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-600">
          Cada sector tiene sus reglas, sus turnos y su convenio. PlanTurnos se adapta a cómo trabaja tu empresa
          y genera los cuadrantes cumpliendo lo que toca. Estamos especializados en digitalizar el día a día del
          sector productivo.
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-20">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {SECTORES.map((s) => (
            <Link
              key={s.slug}
              href={`/sectores/${s.slug}`}
              className="group overflow-hidden rounded-2xl border border-[#e7dcc4] bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/img/${s.photo}.webp`} alt={s.short} className="h-40 w-full object-cover object-top" />
              <div className="p-6">
                <h2 className="text-lg font-bold text-slate-900 group-hover:text-cyan-700">{s.short}</h2>
                <p className="mt-1 text-sm text-slate-600">{s.tagline}</p>
                <span className="mt-3 inline-block text-sm font-semibold text-cyan-700">Ver cómo funciona →</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-cyan-700">
        <div className="mx-auto max-w-3xl px-5 py-16 text-center text-white">
          <h2 className="text-3xl font-bold">¿No ves tu sector? Da igual.</h2>
          <p className="mt-2 text-cyan-100">
            Si tu empresa trabaja a turnos, PlanTurnos encaja. Te montamos una prueba a tu medida.
          </p>
          <Link href="/contacto" className="mt-6 inline-block rounded-lg bg-white px-8 py-3 font-semibold text-cyan-800 hover:bg-cyan-50">
            Hablemos de tu caso
          </Link>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
