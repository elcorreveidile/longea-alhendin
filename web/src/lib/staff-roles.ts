import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";

/** Roles de personal del centro (academia), sobre las cuentas admin. */
export const STAFF_ROLES = [
  { value: "direccion", label: "Dirección" },
  { value: "subdireccion", label: "Subdirección de Español" },
  { value: "secretaria", label: "Secretaría de Dirección" },
] as const;
export const STAFF_ROLE_LABEL: Record<string, string> = Object.fromEntries(STAFF_ROLES.map((r) => [r.value, r.label]));
export type StaffRole = (typeof STAFF_ROLES)[number]["value"];

/** Lee el rol de personal del usuario actual (fresco de la BD, no de la sesión). */
export async function getStaffRole(userId: string): Promise<string | null> {
  const r = (await db.select({ s: users.staffRole }).from(users).where(eq(users.id, userId)).limit(1))[0];
  return r?.s ?? null;
}

/** Admins del centro (academia) con su rol de personal. */
export async function listCenterAdmins(tenantId: string) {
  return db
    .select({ id: users.id, email: users.email, name: users.name, staffRole: users.staffRole })
    .from(users)
    .where(and(eq(users.tenantId, tenantId), eq(users.role, "admin")));
}

/** Asigna (o quita con null) el rol de personal a una cuenta admin del centro. */
export async function setStaffRole(tenantId: string, userId: string, staffRole: string | null): Promise<void> {
  const value = STAFF_ROLES.some((r) => r.value === staffRole) ? staffRole : null;
  await db.update(users).set({ staffRole: value }).where(and(eq(users.id, userId), eq(users.tenantId, tenantId)));
}

/** Correos de los admins del centro con un rol concreto (para copias automáticas). */
export async function emailsByStaffRole(tenantId: string, staffRole: string): Promise<string[]> {
  const rows = await db
    .select({ email: users.email })
    .from(users)
    .where(and(eq(users.tenantId, tenantId), eq(users.staffRole, staffRole)));
  return rows.map((r) => r.email).filter((e): e is string => !!e);
}
