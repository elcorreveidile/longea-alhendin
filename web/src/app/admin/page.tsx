import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, asc, count, eq } from "drizzle-orm";
import { getSession } from "@/lib/session";
import { db } from "@/db";
import { tenants, workers, users } from "@/db/schema";

const MSG: Record<string, { ok: boolean; text: string }> = {
  creada: { ok: true, text: "✓ Empresa creada. Configura su subdominio en Vercel para que sea accesible." },
  slug: { ok: false, text: "El identificador (subdominio) solo puede llevar minúsculas, números y guiones." },
  existe: { ok: false, text: "Ya existe una empresa con ese identificador." },
  faltan: { ok: false, text: "Faltan datos: nombre e identificador son obligatorios." },
  admin: { ok: true, text: "✓ Administradora añadida a la empresa." },
  adminmail: { ok: false, text: "Introduce un correo válido para la administradora." },
  adminusado: { ok: false, text: "Ese correo ya está asignado a un usuario." },
};

async function createCompanyAction(formData: FormData) {
  "use server";
  const session = await getSession();
  if (!session || session.role !== "superadmin") redirect("/login");

  const name = String(formData.get("name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim().toLowerCase();
  const adminEmail = String(formData.get("adminEmail") ?? "").trim().toLowerCase();

  if (!name || !slug) redirect("/admin?m=faltan");
  if (!/^[a-z0-9-]+$/.test(slug)) redirect("/admin?m=slug");

  const dup = await db.select({ id: tenants.id }).from(tenants).where(eq(tenants.slug, slug)).limit(1);
  if (dup.length) redirect("/admin?m=existe");

  const [t] = await db.insert(tenants).values({ slug, name }).returning();

  if (adminEmail && adminEmail.includes("@")) {
    const exists = await db.select({ id: users.id }).from(users).where(eq(users.email, adminEmail)).limit(1);
    if (!exists.length) {
      await db.insert(users).values({
        email: adminEmail,
        role: "admin",
        name: "Administradora",
        tenantId: t.id,
      });
    }
  }

  revalidatePath("/admin");
  redirect("/admin?m=creada");
}

async function addAdminAction(formData: FormData) {
  "use server";
  const session = await getSession();
  if (!session || session.role !== "superadmin") redirect("/login");

  const tenantId = String(formData.get("tenantId") ?? "");
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email.includes("@")) redirect("/admin?m=adminmail");

  const exists = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (exists.length) redirect("/admin?m=adminusado");

  await db.insert(users).values({ email, role: "admin", name: "Administradora", tenantId });
  revalidatePath("/admin");
  redirect("/admin?m=admin");
}

export default async function AdminHome({
  searchParams,
}: {
  searchParams: Promise<{ m?: string }>;
}) {
  const session = await getSession();
  if (!session || session.role !== "superadmin") redirect("/panel");
  const sp = await searchParams;
  const msg = sp.m ? MSG[sp.m] : null;

  const rows = await db.select().from(tenants).orderBy(asc(tenants.name));

  // Conteos y administradoras por empresa.
  const companies = await Promise.all(
    rows.map(async (t) => {
      const [wc] = await db
        .select({ n: count() })
        .from(workers)
        .where(and(eq(workers.tenantId, t.id), eq(workers.active, true)));
      const admins = await db
        .select({ email: users.email, name: users.name })
        .from(users)
        .where(and(eq(users.tenantId, t.id), eq(users.role, "admin")));
      return { ...t, workerCount: wc?.n ?? 0, admins };
    }),
  );

  return (
    <main className="mx-auto max-w-5xl px-6 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Empresas</h1>
          <p className="text-sm text-slate-500">Cada empresa tiene su plantilla, sus cuadrantes y su administradora.</p>
        </div>
      </div>

      {msg && (
        <p className={`mt-4 rounded-lg p-3 text-sm ${msg.ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"}`}>
          {msg.text}
        </p>
      )}

      <div className="mt-6 space-y-4">
        {companies.map((c) => (
          <div key={c.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">{c.name}</h2>
                <p className="text-sm text-slate-500">
                  <span className="font-mono">{c.slug}.planturnos.com</span> · {c.workerCount} trabajadoras activas
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Admins: {c.admins.length ? c.admins.map((a) => a.email).join(", ") : "— ninguna —"}
                </p>
              </div>
              <a
                href={`https://${c.slug}.planturnos.com/panel`}
                className="rounded-lg bg-cyan-700 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-800"
              >
                Abrir panel →
              </a>
            </div>

            <form action={addAdminAction} className="mt-4 flex flex-wrap items-end gap-2 border-t border-slate-100 pt-4">
              <input type="hidden" name="tenantId" value={c.id} />
              <div className="flex-1 min-w-[200px]">
                <label className="text-xs font-medium text-slate-600">Añadir administradora (correo)</label>
                <input
                  name="email"
                  type="email"
                  placeholder="correo@empresa.com"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-cyan-500"
                />
              </div>
              <button className="rounded-lg border border-cyan-700 px-4 py-1.5 text-sm font-semibold text-cyan-700 hover:bg-cyan-50">
                Añadir
              </button>
            </form>
          </div>
        ))}
        {!companies.length && <p className="text-sm text-slate-500">Todavía no hay empresas.</p>}
      </div>

      <div className="mt-10 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Nueva empresa</h2>
        <p className="text-sm text-slate-500">
          Crea la empresa aquí; luego añade el subdominio <span className="font-mono">identificador.planturnos.com</span> en Vercel.
        </p>
        <form action={createCompanyAction} className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-slate-700">Nombre de la empresa</label>
            <input name="name" required placeholder="Clínica San Juan"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-cyan-500" />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Identificador (subdominio)</label>
            <input name="slug" required placeholder="clinica-sanjuan" pattern="[a-z0-9-]+"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm outline-none focus:border-cyan-500" />
          </div>
          <div className="sm:col-span-2">
            <label className="text-sm font-medium text-slate-700">Correo de la administradora <span className="text-slate-400">(opcional)</span></label>
            <input name="adminEmail" type="email" placeholder="diana@clinica.com"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-cyan-500" />
          </div>
          <div className="sm:col-span-2">
            <button className="rounded-lg bg-cyan-700 px-6 py-2.5 text-sm font-semibold text-white hover:bg-cyan-800">
              Crear empresa
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
