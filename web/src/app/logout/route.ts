import { NextRequest, NextResponse } from "next/server";

// Nunca cachear el cierre de sesión.
export const dynamic = "force-dynamic";

/**
 * Cierra la sesión borrando la cookie en TODOS sus ámbitos posibles.
 *
 * Importante: NO usamos aquí `cookies().set()` (destroySession). Mezclar esa
 * mutación con cabeceras `Set-Cookie` manuales hace que Next deduplique las
 * cabeceras del mismo nombre y se quede con una sola —la de ámbito de host—,
 * dejando viva la cookie con `Domain=.planturnos.com`. Eso es justo lo que le
 * pasaba al superadministrador (opera en el dominio raíz con esa cookie de
 * dominio). Usando solo cabeceras explícitas garantizamos borrar las dos.
 */
function clearSession(req: NextRequest): NextResponse {
  const res = NextResponse.redirect(new URL("/login", req.url));
  res.headers.set("Cache-Control", "no-store, max-age=0");
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";

  // 1) Cookie a nivel de host (sesiones sin dominio / vercel.app / local).
  res.headers.append("Set-Cookie", `session=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax${secure}`);

  // 2) Cookie a nivel de dominio compartido .planturnos.com (sesiones actuales,
  //    las del superadministrador incluidas).
  const host = (req.headers.get("host") ?? "").split(":")[0].toLowerCase();
  if (host === "planturnos.com" || host.endsWith(".planturnos.com")) {
    res.headers.append(
      "Set-Cookie",
      `session=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax; Domain=.planturnos.com${secure}`,
    );
  }
  return res;
}

export async function GET(req: NextRequest) {
  return clearSession(req);
}

// Permite también cerrar sesión por POST (formularios).
export async function POST(req: NextRequest) {
  return clearSession(req);
}
