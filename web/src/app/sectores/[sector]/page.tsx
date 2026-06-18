import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SECTORES, getSector } from "@/data/sectores";
import MarketingHeader from "@/components/MarketingHeader";
import MarketingFooter from "@/components/MarketingFooter";

export function generateStaticParams() {
  return SECTORES.map((s) => ({ sector: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ sector: string }>;
}): Promise<Metadata> {
  const { sector } = await params;
  const s = getSector(sector);
  if (!s) return { title: "Sector no encontrado · PlanTurnos" };
  return {
    title: `Cuadrantes para ${s.short} · PlanTurnos`,
    description: s.metaDescription,
  };
}

export default async function SectorPage({
  params,
}: {
  params: Promise<{ sector: string }>;
}) {
  const { sector } = await params;
  const s = getSector(sector);
  if (!s) notFound();

  const otros = SECTORES.filter((x) => x.slug !== s.slug);

  return (
    <div className="min-h-screen bg-[#faf6ee] text-slate-800">
      <MarketingHeader />

      {/* Hero */}
      <section className="bg-[#f4ecd8]">
        <div className="mx-auto max-w-5xl px-5 py-16 sm:py-20">
          <div className="text-5xl">{s.emoji}</div>
          <span className="mt-4 inline-block rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#8a6d3b] shadow-sm">
            Cuadrantes para {s.short}
          </span>
          <h1 className="mt-3 text-4xl font-extrabold leading-tight text-slate-900 sm:text-5xl">{s.name}</h1>
          <p className="mt-4 max-w-2xl text-lg text-slate-600">{s.tagline}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/contacto" className="rounded-lg bg-cyan-700 px-6 py-3 font-semibold text-white shadow-sm hover:bg-cyan-800">
              Pruébalo gratis
            </Link>
            <Link href="/sectores" className="rounded-lg border border-slate-300 px-6 py-3 font-semibold text-slate-700 hover:bg-white">
              Ver otros sectores
            </Link>
          </div>
        </div>
      </section>

      {/* Intro */}
      <section className="mx-auto max-w-3xl px-5 py-14">
        <p className="text-lg leading-relaxed text-slate-700">{s.intro}</p>
      </section>

      {/* Retos + Soluciones */}
      <section className="mx-auto max-w-6xl px-5 pb-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-[#e7dcc4] bg-white p-7 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900">Los retos de los turnos en {s.short.toLowerCase()}</h2>
            <ul className="mt-4 space-y-3">
              {s.retos.map((r) => (
                <li key={r} className="flex gap-2 text-slate-700">
                  <span className="text-[#c8862f]">•</span> {r}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border-2 border-cyan-600 bg-white p-7 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900">Cómo lo resuelve PlanTurnos</h2>
            <ul className="mt-4 space-y-3">
              {s.soluciones.map((r) => (
                <li key={r} className="flex gap-2 text-slate-700">
                  <span className="text-cyan-700">✓</span> {r}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Ejemplo de reglas */}
      <section className="mx-auto max-w-4xl px-5 py-10">
        <div className="rounded-2xl bg-slate-900 p-7 text-center text-white">
          <p className="text-xs font-semibold uppercase tracking-widest text-cyan-300">Un ejemplo de reglas</p>
          <p className="mt-3 text-lg font-medium">{s.reglaEjemplo}</p>
          <p className="mt-3 text-sm text-slate-300">Y tú las ajustas cuando quieras, sin tocar código.</p>
        </div>
      </section>

      {/* Especialización */}
      <section className="bg-[#f4ecd8] py-16">
        <div className="mx-auto max-w-3xl px-5 text-center">
          <h2 className="text-2xl font-bold text-slate-900">Especialistas en digitalización del sector productivo</h2>
          <p className="mt-3 text-slate-600">
            No vendemos un programa “para todos”. Construimos soluciones que entienden tu actividad y tu convenio,
            y que se integran en tu día a día. PlanTurnos es nuestra herramienta de cuadrantes; si tu empresa
            necesita digitalizar otro proceso, también te ayudamos.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-cyan-700">
        <div className="mx-auto max-w-3xl px-5 py-16 text-center text-white">
          <h2 className="text-3xl font-bold">Pon tus cuadrantes en piloto automático</h2>
          <p className="mt-2 text-cyan-100">Te montamos una prueba para {s.short.toLowerCase()} sin compromiso.</p>
          <Link href="/contacto" className="mt-6 inline-block rounded-lg bg-white px-8 py-3 font-semibold text-cyan-800 hover:bg-cyan-50">
            Quiero probarlo
          </Link>
        </div>
      </section>

      {/* Otros sectores */}
      <section className="mx-auto max-w-6xl px-5 py-14">
        <h2 className="text-center text-sm font-semibold uppercase tracking-widest text-slate-400">Otros sectores</h2>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {otros.map((o) => (
            <Link key={o.slug} href={`/sectores/${o.slug}`} className="rounded-full border border-[#e7dcc4] bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:text-cyan-700">
              {o.emoji} {o.short}
            </Link>
          ))}
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
