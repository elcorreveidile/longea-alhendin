import Link from "next/link";
import { getLang } from "../lang";
import { DICT, PROGRAMS, PROGRAM_SLUG } from "../content";
import { SECTION_ICON } from "../icons";
import { Spot } from "../media";

export default async function CursosPage() {
  const lang = await getLang();
  const t = DICT[lang];

  const Icon = SECTION_ICON.cursos;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <h1 className="flex items-center gap-3 text-3xl font-bold text-slate-900">
        <Icon className="text-cyan-700" /> {t.cursos.title}
      </h1>
      <p className="mt-2 max-w-2xl text-slate-600">{t.cursos.intro}</p>

      <div className="mt-8 grid gap-6 md:grid-cols-3">
        {PROGRAMS.map((p) => (
          <article key={p.code} className="flex flex-col rounded-xl border border-[#e7dcc4] bg-white p-6 shadow-sm">
            <Spot src={`/academia/spot/${PROGRAM_SLUG[p.code]}.png`} className="mb-4 h-28 w-full" />
            <span className="text-xs font-semibold uppercase tracking-wide text-cyan-700">{p[lang].tag}</span>
            <h2 className="mt-1 text-xl font-bold text-slate-900">{p[lang].name}</h2>
            <p className="mt-3 flex-1 text-sm text-slate-600">{p[lang].desc}</p>
            <Link href="/academia/contacto" className="mt-5 inline-block rounded-lg bg-cyan-700 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-cyan-800">
              {t.hero.ctaContacto}
            </Link>
          </article>
        ))}
      </div>

      <p className="mt-8 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">{t.cursos.pending}</p>
    </div>
  );
}
