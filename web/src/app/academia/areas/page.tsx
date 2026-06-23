import { getLang } from "../lang";
import { DICT, groupedAreas, areaLabel, langBadge } from "../content";

export default async function AreasPage() {
  const lang = await getLang();
  const t = DICT[lang];
  const areas = groupedAreas();

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold text-slate-900">{t.areas.title}</h1>
      <p className="mt-2 max-w-2xl text-slate-600">{t.areas.intro}</p>
      <p className="mt-1 text-sm text-slate-500">{t.areas.legend}</p>

      <div className="mt-8 space-y-6">
        {areas.map((a) => (
          <section key={a.area} className="rounded-xl border border-[#e7dcc4] bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-xl font-bold text-slate-900">{areaLabel(a.area, lang)}</h2>
              <span className="text-sm text-slate-400">{a.subjects.length} {t.areas.subjects}</span>
            </div>
            <ul className="mt-4 grid gap-x-6 gap-y-2 sm:grid-cols-2">
              {a.subjects.map((s) => (
                <li key={s.name} className="flex items-start justify-between gap-3 border-b border-slate-100 pb-2">
                  <span className="text-sm text-slate-700">{s.name}</span>
                  <span className="shrink-0 rounded bg-cyan-50 px-1.5 py-0.5 text-[10px] font-semibold text-cyan-700">
                    {langBadge(s.languages, lang)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
