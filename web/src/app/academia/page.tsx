import Link from "next/link";
import { getLang } from "./lang";
import { DICT, PROGRAMS, groupedAreas, areaLabel } from "./content";

export default async function AcademiaHome() {
  const lang = await getLang();
  const t = DICT[lang];
  const areas = groupedAreas();
  const totalSubjects = areas.reduce((n, a) => n + a.subjects.length, 0);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-cyan-700 to-teal-900 text-white">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <p className="text-sm font-semibold uppercase tracking-wide text-cyan-100">{t.hero.kicker}</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-bold leading-tight sm:text-5xl">{t.hero.title}</h1>
          <p className="mt-5 max-w-2xl text-lg text-cyan-50">{t.hero.subtitle}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/academia/cursos" className="rounded-lg bg-white px-6 py-3 text-sm font-semibold text-cyan-800 shadow hover:bg-cyan-50">
              {t.hero.ctaCursos}
            </Link>
            <Link href="/academia/contacto" className="rounded-lg border border-white/40 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10">
              {t.hero.ctaContacto}
            </Link>
          </div>
        </div>
      </section>

      {/* Highlights */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {t.highlights.map((h) => (
            <div key={h.title} className="rounded-xl border border-[#e7dcc4] bg-white p-5 shadow-sm">
              <h3 className="font-bold text-slate-900">{h.title}</h3>
              <p className="mt-1 text-sm text-slate-600">{h.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Programas */}
      <section className="bg-white py-14">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-2xl font-bold text-slate-900">{t.home.programsTitle}</h2>
          <div className="mt-6 grid gap-5 md:grid-cols-3">
            {PROGRAMS.map((p) => (
              <Link key={p.code} href="/academia/cursos" className="group rounded-xl border border-[#e7dcc4] bg-[#faf6ee] p-6 transition hover:border-cyan-300 hover:shadow-md">
                <span className="text-xs font-semibold uppercase tracking-wide text-cyan-700">{p[lang].tag}</span>
                <h3 className="mt-1 text-lg font-bold text-slate-900 group-hover:text-cyan-700">{p[lang].name}</h3>
                <p className="mt-2 text-sm text-slate-600">{p[lang].desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Áreas preview */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">{t.home.areasTitle}</h2>
            <p className="mt-1 max-w-2xl text-slate-600">{t.home.areasText}</p>
          </div>
          <Link href="/academia/areas" className="text-sm font-semibold text-cyan-700 hover:underline">
            {t.home.areasCta} →
          </Link>
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          {areas.map((a) => (
            <span key={a.area} className="rounded-full border border-[#e7dcc4] bg-white px-3 py-1.5 text-sm text-slate-700">
              {areaLabel(a.area, lang)} <span className="text-slate-400">· {a.subjects.length}</span>
            </span>
          ))}
        </div>
        <p className="mt-4 text-sm text-slate-500">{totalSubjects} {t.areas.subjects}.</p>
      </section>
    </>
  );
}
