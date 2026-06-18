import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSession, homeForRole } from "@/lib/session";
import { slugFromHost } from "@/lib/tenant";
import Landing from "@/components/Landing";

export default async function Home() {
  const session = await getSession();
  // Los usuarios con sesión van a su zona.
  if (session) redirect(homeForRole(session.role));

  // En el subdominio de una empresa, la raíz es su pantalla de acceso.
  const host = (await headers()).get("host");
  if (slugFromHost(host)) redirect("/login");

  // En el dominio raíz, el público ve la web comercial de PlanTurnos.
  return <Landing />;
}
