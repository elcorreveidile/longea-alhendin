import "server-only";
import { redirect } from "next/navigation";
import { getCurrentTenant } from "./tenant";
import { getTenantKind } from "./tenant-kind";

/** Páginas del panel de residencia (cuadrantes): una academia se va a su panel. */
export async function requireResidencePanel(): Promise<void> {
  const tenant = await getCurrentTenant();
  if (tenant && (await getTenantKind(tenant.id)) === "academia") redirect("/panel/horas");
}

/** Páginas del panel de academia (profesorado): una residencia se va a su panel. */
export async function requireAcademiaPanel(): Promise<void> {
  const tenant = await getCurrentTenant();
  if (tenant && (await getTenantKind(tenant.id)) !== "academia") redirect("/panel");
}
