import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { asc } from "drizzle-orm";
import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@/db";
import { tenants } from "@/db/schema";
import { slugFromHost } from "@/lib/tenant";
import { getSession, homeForRole } from "@/lib/session";
import Logo from "@/components/Logo";

export const metadata: Metadata = {
  title: "Acceder · PlanTurnos",
  description: "Entra en la aplicación de cuadrantes de tu empresa.",
};

export default async function EntrarPage() {
  const session = await getSession();
  if (session) redirect(homeForRole(session.role));

  // Si ya estás en el subdominio de una empresa, vas directo a su acceso.
  const host = (await headers()).get("host");
  if (slugFromHost(host)) redirect("/login");

  const empresas = await db.select().from(tenants).orderBy(asc(tenants.name));

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#faf6ee] px-5 py-12 text-slate-800">
      <div className="w-full max-w-md">
        <div className="flex justify-center">
          <Logo />
        </div>
        <h1 className="mt-8 text-center text-2xl font-bold text-slate-900">Elige tu empresa</h1>
        <p className="mt-2 text-center text-sm text-slate-500">
          Entra en la aplicación de cuadrantes de tu organización.
        </p>

        <div className="mt-8 space-y-3">
          {empresas.map((e) => (
            <a
              key={e.id}
              href={`https://${e.slug}.planturnos.com/`}
              className="flex items-center gap-3 rounded-xl border border-[#e7dcc4] bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              {e.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={e.logoUrl} alt="" className="h-10 w-10 rounded-lg object-contain" />
              ) : (
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-100 text-sm font-bold text-cyan-700">
                  {e.name.slice(0, 2).toUpperCase()}
                </span>
              )}
              <div className="flex-1">
                <p className="font-semibold text-slate-900">{e.name}</p>
                <p className="text-xs text-slate-400">{e.slug}.planturnos.com</p>
              </div>
              <span className="text-cyan-700">→</span>
            </a>
          ))}
          {!empresas.length && (
            <p className="text-center text-sm text-slate-500">Todavía no hay empresas configuradas.</p>
          )}
        </div>

        <p className="mt-8 text-center text-sm">
          <Link href="/" className="text-cyan-700 hover:underline">← Volver a PlanTurnos</Link>
        </p>
      </div>
    </main>
  );
}
