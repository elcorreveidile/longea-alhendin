import Link from "next/link";

export default function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2 font-bold">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo-symbol.png" alt="PlanTurnos" className="h-9 w-9" />
      <span className="text-xl lowercase tracking-tight">
        <span className={light ? "text-white" : "text-[#0E7490]"}>plan</span>
        <span className="text-[#E59A3C]">turnos</span>
      </span>
    </Link>
  );
}
