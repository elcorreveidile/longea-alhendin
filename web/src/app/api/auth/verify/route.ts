import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { consumeMagicToken } from "@/lib/magic";
import { loginByEmail } from "@/lib/auth";
import { getSession } from "@/lib/session";
import { db } from "@/db";
import { tenants } from "@/db/schema";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const to = (path: string) => NextResponse.redirect(new URL(path, req.url));

  if (!token) {
    return to("/login?error=falta-token");
  }

  const email = await consumeMagicToken(token);
  if (!email) {
    return to("/login?error=enlace-invalido");
  }

  try {
    await loginByEmail(email);
  } catch {
    return to("/login?error=no-autorizado");
  }

  const session = await getSession();

  // Superadmin: a su área (en el dominio raíz).
  if (session?.role === "superadmin") {
    console.log(`[verify] ${email} -> superadmin -> /admin`);
    return to("/admin");
  }

  // Admin o trabajadora: al subdominio de SU empresa, a su zona.
  if (session?.tenantId) {
    const t = (
      await db.select({ slug: tenants.slug }).from(tenants).where(eq(tenants.id, session.tenantId)).limit(1)
    )[0];
    const path = session.role === "admin" ? "/panel" : "/mi-turno";
    const host = req.headers.get("host") ?? "";
    console.log(`[verify] ${email} -> role=${session.role} tenantId=${session.tenantId} slug=${t?.slug ?? "?"} host=${host} path=${path}`);
    if (t?.slug && host.endsWith("planturnos.com")) {
      return NextResponse.redirect(`https://${t.slug}.planturnos.com${path}`);
    }
    return to(path);
  }

  // Sin empresa asignada (no debería pasar en admins/trabajadoras bien dados de alta).
  console.log(`[verify] ${email} -> role=${session?.role ?? "?"} SIN tenantId`);
  return to(session?.role === "admin" ? "/panel" : "/mi-turno");
}
