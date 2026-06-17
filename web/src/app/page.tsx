import { redirect } from "next/navigation";
import { getSession, isStaffAdmin } from "@/lib/session";
import Landing from "@/components/Landing";

export default async function Home() {
  const session = await getSession();
  // Los usuarios con sesión van a su zona; el público ve la landing de PlanTurnos.
  if (session) redirect(isStaffAdmin(session.role) ? "/panel" : "/mi-turno");
  return <Landing />;
}
