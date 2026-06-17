import { NextRequest, NextResponse } from "next/server";
import { destroySession } from "@/lib/session";

export async function GET(req: NextRequest) {
  await destroySession();
  // Redirige al mismo dominio desde el que se accede (no al de Vercel).
  return NextResponse.redirect(new URL("/login", req.url));
}
