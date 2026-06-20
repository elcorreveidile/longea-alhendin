import { redirect } from "next/navigation";
import { getSession, isStaffAdmin } from "@/lib/session";
import { getCurrentTenant } from "@/lib/tenant";
import { requireAcademiaPanel } from "@/lib/panel-guard";
import { listPrograms, listTerms, listSubjects } from "@/db/docencia";
import TopBar from "@/components/TopBar";

export default async function DocenciaPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!isStaffAdmin(session.role)) redirect("/mi-turno");
  await requireAcademiaPanel();
  const tenant = await getCurrentTenant();

  const [programs, terms, subjects] = tenant
    ? await Promise.all([listPrograms(tenant.id), listTerms(tenant.id), listSubjects(tenant.id)])
    : [[], [], []];

  const cards = [
    { href: "/panel/docencia/programas", title: "Programas y ediciones", n: `${programs.length} programas · ${terms.length} ediciones`, desc: "Cursos del centro (CILE, CEH, verano…) y sus ediciones por calendario." },
    { href: "/panel/docencia/asignaturas", title: "Asignaturas", n: `${subjects.length} asignaturas`, desc: "Catálogo de asignaturas: área, idioma, niveles y dotación (fija/abierta)." },
    { href: "/panel/docencia/grupos", title: "Grupos / plazas", n: `${terms.length ? "por edición" : "necesita una edición"}`, desc: "Las plazas docentes (asignatura + horario) que luego se asignan a profesorado." },
  ];

  return (
    <div className="min-h-screen bg-[#faf6ee]">
      <TopBar name={session.name} role={session.role} tenantName={tenant?.name} logoUrl={tenant?.logoUrl} />
      <main className="mx-auto max-w-[1100px] space-y-5 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Docencia (reparto)</h1>
            <p className="text-sm text-slate-500">Catálogo de cursos, asignaturas y plazas. El reparto automático llegará después.</p>
          </div>
          <a href="/panel/horas" className="text-sm font-medium text-cyan-700 hover:underline">Control de horas →</a>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {cards.map((c) => (
            <a key={c.href} href={c.href} className="rounded-xl border border-[#e7dcc4] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow">
              <h2 className="font-semibold text-slate-900">{c.title}</h2>
              <p className="mt-1 text-xs font-medium text-cyan-700">{c.n}</p>
              <p className="mt-2 text-sm text-slate-500">{c.desc}</p>
            </a>
          ))}
        </div>

        <p className="rounded-lg bg-white p-3 text-xs text-slate-500 shadow-sm">
          Esqueleto inicial: aquí se introducen los datos a mano. Más adelante, el motor asignará el profesorado a cada
          plaza respetando idioma, nivel, disponibilidad, horas y no-solape.
        </p>
      </main>
    </div>
  );
}
