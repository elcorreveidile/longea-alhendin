export default function TopBar({ name, role }: { name: string | null; role: string }) {
  return (
    <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3">
      <div>
        <h1 className="text-lg font-bold text-cyan-900">
          Cuadrantes · Residencia Alhendín
        </h1>
        <p className="text-xs text-slate-500">Grupo Longea</p>
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
