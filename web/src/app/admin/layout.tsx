import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import TopBar from "@/components/TopBar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");
  // El área superadmin es exclusiva del rol superadmin.
  if (session.role !== "superadmin") redirect("/panel");

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <TopBar name={session.name} role={session.role} tenantName="Administración" />
      <nav className="border-b border-slate-200 bg-white px-6">
        <div className="mx-auto flex max-w-5xl gap-1">
          <a href="/admin" className="border-b-2 border-transparent px-3 py-3 text-sm font-medium text-slate-600 hover:text-cyan-700">
            Empresas
          </a>
          <a href="/admin/leads" className="border-b-2 border-transparent px-3 py-3 text-sm font-medium text-slate-600 hover:text-cyan-700">
            Interesados
          </a>
        </div>
      </nav>
      {children}
    </div>
  );
}
