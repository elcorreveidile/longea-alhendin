import "server-only";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { workers as workersT, users as usersT, tenants as tenantsT } from "@/db/schema";
import { sendCuadranteEmail, type EmailBrand } from "./email";
import { sendSms } from "./sms";
import { appUrl } from "./env";

export interface NotifyResult {
  email: number;
  sms: number;
  skipped: number;
}

/**
 * Avisa a las trabajadoras activas con acceso de que hay un cuadrante nuevo.
 * Usa email si tienen correo; si no, SMS. `label` es p. ej. "julio 2026".
 */
export async function notifyNewCuadrante(tenantId: string, label: string): Promise<NotifyResult> {
  const ws = await db
    .select({ id: workersT.id })
    .from(workersT)
    .where(and(eq(workersT.tenantId, tenantId), eq(workersT.active, true)));
  const ids = ws.map((w) => w.id);
  if (ids.length === 0) return { email: 0, sms: 0, skipped: 0 };

  const recipients = await db
    .select()
    .from(usersT)
    .where(and(eq(usersT.tenantId, tenantId), inArray(usersT.workerId, ids)));

  // Marca de la empresa para personalizar el correo (excepto que sea PlanTurnos).
  const tenant = (await db.select().from(tenantsT).where(eq(tenantsT.id, tenantId)).limit(1))[0];
  const empresaName = tenant?.name ?? "PlanTurnos";
  const url = tenant?.slug ? `https://${tenant.slug}.planturnos.com/mi-turno` : appUrl();
  const brand: EmailBrand = {
    name: empresaName,
    logoUrl: tenant?.logoUrl ?? null,
    homeUrl: tenant?.slug ? `https://${tenant.slug}.planturnos.com` : undefined,
    planturnos: false,
  };

  let email = 0;
  let sms = 0;
  let skipped = 0;

  for (const u of recipients) {
    try {
      if (u.email) {
        await sendCuadranteEmail(u.email, u.name ?? "", label, url, brand);
        email++;
      } else if (u.phone) {
        await sendSms(u.phone, `${empresaName}: nuevo cuadrante de ${label} disponible. Entra en ${url}`);
        sms++;
      } else {
        skipped++;
      }
    } catch {
      skipped++;
    }
  }

  return { email, sms, skipped };
}
