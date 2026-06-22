export default function TopBar({
  name,
  role,
  tenantName,
  logoUrl,
}: {
  name: string | null;
  role: string;
  tenantName?: string;
  logoUrl?: string | null;
}) {
  const roleLabel =
    role === "superadmin" ? "Súper administrador" : role === "admin" ? "Administradora" : "Trabajadora";

  return (
    <header className="flex items-center justify-between gap-2 border-b border-slate-200 bg-white px-4 py-3 sm:px-6 print:hidden">
      <a href="/" className="flex min-w-0 items-center gap-2 sm:gap-3" title="Ir al inicio">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoUrl || "/logo-symbol.png"} alt={tenantName ?? "PlanTurnos"} className="h-9 w-auto max-w-[120px] shrink-0" />
        <div className="min-w-0 border-l border-slate-200 pl-2 sm:pl-3">
          <h1 className="text-sm font-semibold leading-tight text-slate-800">Cuadrantes</h1>
          <p className="truncate text-xs leading-tight text-slate-500">{tenantName ?? "PlanTurnos"}</p>
        </div>
      </a>
      <div className="flex min-w-0 items-center gap-2 text-sm sm:gap-4">
        <a href="/" className="hidden items-center gap-1.5 sm:flex" title="PlanTurnos">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-symbol.png" alt="PlanTurnos" className="h-6 w-6" />
          <span className="text-sm font-bold lowercase tracking-tight">
            <span className="text-[#0E7490]">plan</span><span className="text-[#E59A3C]">turnos</span>
          </span>
        </a>
        {role === "superadmin" && (
          <nav className="hidden items-center gap-3 sm:flex">
            <a href="/admin" className="text-slate-600 hover:text-cyan-700">Administración</a>
          </nav>
        )}
        {role === "admin" && (
          <nav className="hidden items-center gap-3 sm:flex">
            <a href="/panel" className="text-slate-600 hover:text-cyan-700">Panel</a>
            <a href="/mi-turno" className="text-slate-600 hover:text-cyan-700">Mi turno</a>
          </nav>
        )}
        <span className="flex min-w-0 items-center gap-1.5 text-slate-600">
          <span className="max-w-[34vw] truncate sm:max-w-none">{name ?? "Usuaria"}</span>
          <span className="hidden rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-500 sm:inline">{roleLabel}</span>
        </span>
        <a href="/logout" className="shrink-0 font-medium text-cyan-700 hover:underline">
          Salir
        </a>
      </div>
    </header>
  );
}
