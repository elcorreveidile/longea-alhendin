import type { Metadata } from "next";
import Link from "next/link";
import { getLang } from "./lang";
import { DICT } from "./content";
import LangToggle from "./LangToggle";

export const metadata: Metadata = {
  title: "Acentos del español · Español y estudios hispánicos",
  description:
    "Academia de español como lengua extranjera y estudios hispánicos en Andalucía. Cursos de lengua, cultura y prácticas, en español e inglés.",
};

export default async function AcademiaLayout({ children }: { children: React.ReactNode }) {
  const lang = await getLang();
  const t = DICT[lang];

  const nav = [
    { href: "/academia", label: t.nav.inicio },
    { href: "/academia/cursos", label: t.nav.cursos },
    { href: "/academia/areas", label: t.nav.areas },
    { href: "/academia/practicas", label: t.nav.practicas },
    { href: "/academia/sobre", label: t.nav.sobre },
    { href: "/academia/contacto", label: t.nav.contacto },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-[#faf6ee] text-slate-800">
      <header className="sticky top-0 z-30 border-b border-[#e7dcc4] bg-[#faf6ee]/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 sm:px-6">
          <Link href="/academia" className="flex shrink-0 items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-acentos.png" alt="Acentos del español" className="h-9 w-9" />
            <span className="text-lg font-bold tracking-tight text-slate-900">
              Acentos<span className="text-cyan-700"> del español</span>
            </span>
          </Link>
          <div className="ml-auto order-3 w-full overflow-x-auto sm:order-2 sm:w-auto">
            <nav className="flex items-center gap-1 whitespace-nowrap text-sm font-medium text-slate-600">
              {nav.map((n) => (
                <Link key={n.href} href={n.href} className="rounded-lg px-3 py-1.5 hover:bg-white hover:text-cyan-700">
                  {n.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="order-2 shrink-0 sm:order-3">
            <LangToggle lang={lang} />
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-[#e7dcc4] bg-white">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-3 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-acentos.png" alt="" className="h-8 w-8" />
            <div>
              <p className="font-semibold text-slate-900">Acentos del español</p>
              <p className="text-sm text-slate-500">{t.footer.tagline}</p>
            </div>
          </div>
          <div className="text-sm text-slate-500">
            <a href="/login" className="font-medium text-cyan-700 hover:underline">{t.footer.staff}</a>
            <p className="mt-1 text-xs">© {new Date().getFullYear()} Acentos del español. {t.footer.rights}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
