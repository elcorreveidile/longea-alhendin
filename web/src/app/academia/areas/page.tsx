import { getLang } from "../lang";
import { DICT, groupedAreas, areaLabel, langBadge } from "../content";
import { AREA_ICON } from "../icons";
import { Banner } from "../media";

/** slug de archivo de fondo por área (coincide con /public/academia/areas/<slug>.jpg). */
const AREA_SLUG: Record<string, string> = {
  "Lengua": "lengua",
  "Literatura": "literatura",
  "Geografía": "geografia",
  "Historia": "historia",
  "Historia del Arte": "arte",
  "Cultura": "cultura",
  "Sociología, Política y Economía": "sociedad",
  "Ciencia y Tecnología": "ciencia",
  "Derecho": "derecho",
  "Prácticas": "practicas",
};

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
        {areas.map((a) => {
          const Icon = AREA_ICON[a.area];
          const slug = AREA_SLUG[a.area] ?? "";
          return (
            <section key={a.area} className="overflow-hidden rounded-xl border border-[#e7dcc4] bg-white shadow-sm">
              <Banner src={`/academia/areas/${slug}.jpg`} className="flex h-28 items-end p-4 sm:h-32 sm:p-5">
                <div className="flex items-center gap-3 text-white">
                  {Icon && (
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/15 backdrop-blur">
                      <Icon size={22} />
                    </span>
                  )}
                  <div>
                    <h2 className="text-xl font-bold drop-shadow-sm">{areaLabel(a.area, lang)}</h2>
                    <p className="text-xs text-cyan-50">{a.subjects.length} {t.areas.subjects}</p>
                  </div>
                </div>
              </Banner>
              <ul className="grid gap-x-6 gap-y-2 p-5 sm:grid-cols-2 sm:p-6">
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
          );
        })}
      </div>
    </div>
  );
}
