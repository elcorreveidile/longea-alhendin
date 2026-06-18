import Link from "next/link";
import Logo from "@/components/Logo";
import MobileNav from "@/components/MobileNav";

export default function MarketingHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-[#e7dcc4] bg-[#faf6ee]/90 backdrop-blur">
      <div className="relative mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
        <Logo />
        <nav className="flex items-center gap-3 text-sm">
          <div className="hidden items-center gap-5 md:flex">
            <Link href="/funcionalidades" className="text-slate-600 hover:text-cyan-700">Funcionalidades</Link>
            <Link href="/sectores" className="text-slate-600 hover:text-cyan-700">Sectores</Link>
            <Link href="/precios" className="text-slate-600 hover:text-cyan-700">Precios</Link>
            <Link href="/blog" className="hidden text-slate-600 hover:text-cyan-700 lg:block">Blog</Link>
            <Link href="/demo" className="rounded-lg border border-cyan-600 px-4 py-2 font-semibold text-cyan-700 hover:bg-cyan-50">
              Probar demo
            </Link>
          </div>
          <Link href="/entrar" className="rounded-lg bg-cyan-700 px-4 py-2 font-semibold text-white hover:bg-cyan-800">
            Acceder
          </Link>
          <MobileNav />
        </nav>
      </div>
    </header>
  );
}
