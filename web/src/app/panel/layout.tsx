import { redirect } from "next/navigation";
import { getSession, isStaffAdmin, canManageTenant } from "@/lib/session";
import { getCurrentTenant } from "@/lib/tenant";
import VersionFooter from "@/components/VersionFooter";

/**
 * Puerta de acceso al panel de una empresa:
 *  - debe haber sesión y ser personal (admin o superadmin);
 *  - una admin solo entra al panel de SU empresa; el superadmin, a cualquiera.
 */
export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!isStaffAdmin(session.role)) redirect("/mi-turno");

  const tenant = await getCurrentTenant();
  // Las admins sin empresa asignada (sesiones antiguas, anteriores a la
  // separación) se permiten: se reatan a su empresa en el próximo login.
  const legacyUnbound = session.role === "admin" && session.tenantId === null;
  if (tenant && !legacyUnbound && !canManageTenant(session, tenant.id)) redirect("/");

  return (
    <>
      {children}
      <VersionFooter />
    </>
  );
}
