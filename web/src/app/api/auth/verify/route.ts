import { NextRequest, NextResponse } from "next/server";
import { consumeMagicToken } from "@/lib/magic";
import { loginByEmail } from "@/lib/auth";
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

  return NextResponse.redirect(`${base}/panel`);
}
