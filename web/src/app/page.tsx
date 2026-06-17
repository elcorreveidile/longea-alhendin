import { redirect } from "next/navigation";
import { getSession, isStaffAdmin } from "@/lib/session";

export default async function Home() {
  const session = await getSession();
  if (!session) redirect("/login");
  redirect(isStaffAdmin(session.role) ? "/panel" : "/mi-turno");
}
