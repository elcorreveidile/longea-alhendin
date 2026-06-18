import Link from "next/link";
import Logo from "@/components/Logo";
import DevCredit from "@/components/DevCredit";
import { SECTORES } from "@/data/sectores";

export default function MarketingFooter() {
  return (
    <footer className="border-t border-[#e7dcc4] bg-[#faf6ee] py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-5 text-center">
        <Logo />
        <p className="max-w-md text-sm text-slate-500">
          Especialistas en la <strong>digitalización del sector productivo</strong>: herramientas a medida que
          ahorran tiempo a tu empresa.
        </p>
        <div className="flex flex-wrap justify-center gap-2 text-xs">
          {SECTORES.map((s) => (
            <Link key={s.slug} href={`/sectores/${s.slug}`} className="rounded-full bg-white px-3 py-1 text-slate-600 shadow-sm hover:text-cyan-700">
              {s.short}
            </Link>
          ))}
        </div>
        <DevCredit />
        <p className="text-xs text-slate-400">© {new Date().getFullYear()} PlanTurnos · planturnos.com</p>
      </div>
    </footer>
  );
}
