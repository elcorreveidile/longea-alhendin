import { getLang } from "../lang";
import { DICT } from "../content";
import { SECTION_ICON } from "../icons";
import { Spot, WithBackground } from "../media";

export default async function SobrePage() {
  const lang = await getLang();
  const t = DICT[lang];
  const Icon = SECTION_ICON.sobre;

  return (
    <WithBackground src="/academia/bg/azulejo.jpg" fade={0.88}>
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="flex items-center gap-3 text-3xl font-bold text-slate-900">
        <Icon className="text-cyan-700" /> {t.sobre.title}
      </h1>
      <Spot src="/academia/spot/academia.png" className="mx-auto mt-6 h-48 w-48" />
      <div className="mt-6 space-y-4 text-slate-700">
        <p>{t.sobre.p1}</p>
        <p>{t.sobre.p2}</p>
        <p>{t.sobre.p3}</p>
      </div>
    </div>
    </WithBackground>
  );
}
