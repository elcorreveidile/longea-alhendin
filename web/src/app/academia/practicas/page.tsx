import { getLang } from "../lang";
import { DICT, PRACTICAS } from "../content";
import { PRACTICA_ICON } from "../icons";
import { Spot, WithBackground } from "../media";

export default async function PracticasPage() {
  const lang = await getLang();
  const t = DICT[lang];

  return (
    <WithBackground src="/academia/bg/textura.jpg" fade={0.88}>
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <Spot src="/academia/spot/practicas.png" className="mb-2 h-40 w-40" />
      <h1 className="text-3xl font-bold text-slate-900">{t.practicas.title}</h1>
      <p className="mt-2 max-w-2xl text-slate-600">{t.practicas.intro}</p>

      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        {PRACTICAS.map((p) => {
          const Icon = PRACTICA_ICON[p.key];
          return (
            <div key={p.key} className="flex gap-4 rounded-xl border border-[#e7dcc4] bg-white p-6 shadow-sm">
              {Icon && (
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-cyan-50 text-cyan-700">
                  <Icon size={22} />
                </span>
              )}
              <div>
                <h2 className="font-bold text-slate-900">{lang === "es" ? p.es : p.en}</h2>
                <p className="mt-1 text-sm text-slate-600">{lang === "es" ? p.descEs : p.descEn}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
    </WithBackground>
  );
}
