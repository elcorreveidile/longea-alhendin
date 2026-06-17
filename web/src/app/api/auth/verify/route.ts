import { NextRequest, NextResponse } from "next/server";
import { consumeMagicToken } from "@/lib/magic";
import { loginByEmail } from "@/lib/auth";
import { getSession, isStaffAdmin } from "@/lib/session";
import { appUrl } from "@/lib/env";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const base = appUrl();

  if (!token) {
    return NextResponse.redirect(`${base}/login?error=falta-token`);
  }

  const email = await consumeMagicToken(token);
  if (!email) {
    return NextResponse.redirect(`${base}/login?error=enlace-invalido`);
  }

  try {
    await loginByEmail(email);
  } catch {
    return NextResponse.redirect(`${base}/login?error=no-autorizado`);
  }

  // Cada cual a su sitio: admin al panel, trabajadora a su turno.
  const session = await getSession();
  const dest = session && isStaffAdmin(session.role) ? "/panel" : "/mi-turno";
  return NextResponse.redirect(`${base}${dest}`);
}
