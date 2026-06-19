import Link from "next/link";
import Logo from "@/components/Logo";
import DevCredit from "@/components/DevCredit";
import { SECTORES } from "@/data/sectores";
import { APP_VERSION } from "@/lib/version";

const NAV = [
  { href: "/funcionalidades", label: "Funcionalidades" },
  { href: "/como-funciona", label: "Cómo funciona" },
  { href: "/sectores", label: "Sectores" },
  { href: "/demo", label: "Demo" },
  { href: "/precios", label: "Precios" },
  { href: "/casos-de-exito", label: "Casos de éxito" },
  { href: "/blog", label: "Blog" },
  { href: "/preguntas-frecuentes", label: "Preguntas frecuentes" },
  { href: "/sobre-nosotros", label: "Sobre nosotros" },
  { href: "/contacto", label: "Contacto" },
];
const LEGAL = [
  { href: "/aviso-legal", label: "Aviso legal" },
  { href: "/privacidad", label: "Privacidad" },
  { href: "/cookies", label: "Cookies" },
];

export default function MarketingFooter() {
  return (
    <footer className="border-t border-[#e7dcc4] bg-[#faf6ee] py-10">
      <div className="mx-auto max-w-6xl px-5">
        <div className="flex flex-col items-center gap-3 text-center">
          <Logo />
          <p className="max-w-md text-sm text-slate-500">
            Especialistas en la <strong>digitalización del sector productivo</strong>: herramientas a medida que
            ahorran tiempo a tu empresa.
          </p>
          <nav className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1 text-sm text-slate-600">
            {NAV.map((l) => (
              <Link key={l.href} href={l.href} className="hover:text-cyan-700">{l.label}</Link>
            ))}
          </nav>
          <div className="flex flex-wrap justify-center gap-2 text-xs">
            {SECTORES.map((s) => (
              <Link key={s.slug} href={`/sectores/${s.slug}`} className="rounded-full bg-white px-3 py-1 text-slate-600 shadow-sm hover:text-cyan-700">
                {s.short}
              </Link>
            ))}
          </div>
          <nav className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-slate-400">
            {LEGAL.map((l) => (
              <Link key={l.href} href={l.href} className="hover:text-cyan-700">{l.label}</Link>
            ))}
          </nav>
          <DevCredit />
          <p className="text-xs text-slate-400">© {new Date().getFullYear()} PlanTurnos · planturnos.com · {APP_VERSION}</p>
        </div>
      </div>
    </footer>
  );
}
