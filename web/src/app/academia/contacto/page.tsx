import { getLang } from "../lang";
import { DICT } from "../content";
import { SECTION_ICON } from "../icons";
import { Spot } from "../media";

const input = "mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm";

export default async function ContactoPage() {
  const lang = await getLang();
  const t = DICT[lang];
  const Icon = SECTION_ICON.contacto;

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="flex items-center gap-3 text-3xl font-bold text-slate-900">
        <Icon className="text-cyan-700" /> {t.contacto.title}
      </h1>
      <Spot src="/academia/spot/sobre.png" className="mt-4 h-32 w-32" />
      <p className="mt-2 text-slate-600">{t.contacto.intro}</p>

      {/* Formulario provisional: se conectará cuando confirmemos el correo de destino. */}
      <form className="mt-8 space-y-4 rounded-xl border border-[#e7dcc4] bg-white p-6 shadow-sm">
        <label className="block text-sm font-medium text-slate-700">
          {t.contacto.name}
          <input name="name" className={input} />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          {t.contacto.email}
          <input name="email" type="email" className={input} />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          {t.contacto.message}
          <textarea name="message" rows={5} className={input} />
        </label>
        <button type="submit" className="rounded-lg bg-cyan-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-cyan-800">
          {t.contacto.send}
        </button>
      </form>

      <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">{t.contacto.note}</p>

      <p className="mt-6 text-sm text-slate-500">
        <a href="/login" className="font-medium text-cyan-700 hover:underline">{t.contacto.staff}</a>
      </p>
    </div>
  );
}
