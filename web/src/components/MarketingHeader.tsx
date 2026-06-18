import Link from "next/link";
import Logo from "@/components/Logo";

export default function MarketingHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-[#e7dcc4] bg-[#faf6ee]/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
        <Logo />
        <nav className="flex items-center gap-5 text-sm">
          <Link href="/sectores" className="hidden text-slate-600 hover:text-cyan-700 sm:block">Sectores</Link>
          <Link href="/#precios" className="hidden text-slate-600 hover:text-cyan-700 sm:block">Precios</Link>
          <Link href="/login" className="rounded-lg bg-cyan-700 px-4 py-2 font-semibold text-white hover:bg-cyan-800">
            Acceder
          </Link>
        </nav>
      </div>
    </header>
  );
}
