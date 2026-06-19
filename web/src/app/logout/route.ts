import { NextRequest, NextResponse } from "next/server";
import { destroySession } from "@/lib/session";

export async function GET(req: NextRequest) {
  await destroySession(); // por si acaso

  const res = NextResponse.redirect(new URL("/login", req.url));
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";

  // Borra la cookie de sesión EN la respuesta, en sus dos ámbitos posibles:
  //  - a nivel de host (sesiones antiguas)
  //  - a nivel de dominio compartido .planturnos.com (sesiones actuales)
  res.headers.append("Set-Cookie", `session=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax${secure}`);
  const host = (req.headers.get("host") ?? "").split(":")[0].toLowerCase();
  if (host === "planturnos.com" || host.endsWith(".planturnos.com")) {
    res.headers.append(
      "Set-Cookie",
      `session=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax; Domain=.planturnos.com${secure}`,
    );
  }
  return res;
}
