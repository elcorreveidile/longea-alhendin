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
  return (
    <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3 print:hidden">
      <div className="flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoUrl || "/logo-longea.png"} alt={tenantName ?? "PlanTurnos"} className="h-9 w-auto" />
        <div className="border-l border-slate-200 pl-3">
          <h1 className="text-sm font-semibold text-slate-800 leading-tight">
            Cuadrantes
          </h1>
          <p className="text-xs text-slate-500 leading-tight">{tenantName ?? "PlanTurnos"}</p>
        </div>
      </div>
      <div className="flex items-center gap-4 text-sm">
        <span className="text-slate-600">
          {name ?? "Usuaria"}{" "}
          <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
            {role === "superadmin"
              ? "Súper administrador"
              : role === "admin"
                ? "Administradora"
                : "Trabajadora"}
          </span>
        </span>
        <a href="/logout" className="text-cyan-700 hover:underline">
          Salir
        </a>
      </div>
    </header>
  );
}
