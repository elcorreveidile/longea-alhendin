import { getLang } from "../lang";
import { DICT, PRACTICAS } from "../content";

export default async function PracticasPage() {
  const lang = await getLang();
  const t = DICT[lang];

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold text-slate-900">{t.practicas.title}</h1>
      <p className="mt-2 max-w-2xl text-slate-600">{t.practicas.intro}</p>

      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        {PRACTICAS.map((p) => (
          <div key={p.key} className="rounded-xl border border-[#e7dcc4] bg-white p-6 shadow-sm">
            <h2 className="font-bold text-slate-900">{lang === "es" ? p.es : p.en}</h2>
            <p className="mt-1 text-sm text-slate-600">{lang === "es" ? p.descEs : p.descEn}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
