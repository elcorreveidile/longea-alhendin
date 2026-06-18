import { NextRequest, NextResponse } from "next/server";
import { consumeMagicToken } from "@/lib/magic";
import { loginByEmail } from "@/lib/auth";
import { getSession, isStaffAdmin } from "@/lib/session";

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

  // Cada cual a su sitio: superadmin a su área, admin al panel, trabajadora a su turno.
  const session = await getSession();
  const dest = !session
    ? "/mi-turno"
    : session.role === "superadmin"
      ? "/admin"
      : isStaffAdmin(session.role)
        ? "/panel"
        : "/mi-turno";
  return to(dest);
}
