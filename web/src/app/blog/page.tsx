import type { Metadata } from "next";
import Link from "next/link";
import { POSTS } from "@/data/blog";
import MarketingHeader from "@/components/MarketingHeader";
import MarketingFooter from "@/components/MarketingFooter";

export const metadata: Metadata = {
  title: "Blog · PlanTurnos",
  description:
    "Ideas y consejos sobre gestión de turnos, cuadrantes y digitalización del sector productivo.",
};

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-[#faf6ee] text-slate-800">
      <MarketingHeader />

      <section className="mx-auto max-w-3xl px-5 py-16 text-center">
        <span className="inline-block rounded-full bg-cyan-100 px-3 py-1 text-xs font-semibold text-cyan-800">
          Blog
        </span>
        <h1 className="mt-4 text-4xl font-extrabold text-slate-900 sm:text-5xl">Turnos, cuadrantes y productividad</h1>
        <p className="mt-5 text-lg text-slate-600">Consejos para organizar mejor a tu equipo y ahorrar tiempo.</p>
      </section>

      <section className="mx-auto max-w-3xl px-5 pb-16">
        <div className="space-y-5">
          {POSTS.map((p) => (
            <Link
              key={p.slug}
              href={`/blog/${p.slug}`}
              className="block rounded-2xl border border-[#e7dcc4] bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <p className="text-xs font-medium uppercase tracking-widest text-[#8a6d3b]">{p.dateLabel}</p>
              <h2 className="mt-1 text-xl font-bold text-slate-900">{p.title}</h2>
              <p className="mt-2 text-slate-600">{p.excerpt}</p>
              <span className="mt-3 inline-block text-sm font-semibold text-cyan-700">Leer más →</span>
            </Link>
          ))}
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
