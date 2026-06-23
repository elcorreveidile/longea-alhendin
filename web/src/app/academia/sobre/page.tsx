import { getLang } from "../lang";
import { DICT } from "../content";

export default async function SobrePage() {
  const lang = await getLang();
  const t = DICT[lang];

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold text-slate-900">{t.sobre.title}</h1>
      <div className="mt-6 space-y-4 text-slate-700">
        <p>{t.sobre.p1}</p>
        <p>{t.sobre.p2}</p>
        <p>{t.sobre.p3}</p>
      </div>
    </div>
  );
}
