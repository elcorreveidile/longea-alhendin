import "server-only";
import { desc, eq } from "drizzle-orm";
import { db } from "./index";
import { leads, type Lead } from "./schema";

export type LeadStatus = "new" | "contacted" | "archived";

/** Guarda un interesado del formulario público. No debe romper el envío de email. */
export async function createLead(data: {
  name: string;
  email: string;
  org?: string;
  message: string;
  source?: string;
}): Promise<void> {
  await db.insert(leads).values({
    name: data.name,
    email: data.email,
    org: data.org ?? null,
    message: data.message,
    source: data.source ?? "contacto",
  });
}

/** Lista de interesados, más recientes primero. */
export async function listLeads(): Promise<Lead[]> {
  return db.select().from(leads).orderBy(desc(leads.createdAt));
}

export async function getLead(id: string): Promise<Lead | null> {
  const r = await db.select().from(leads).where(eq(leads.id, id)).limit(1);
  return r[0] ?? null;
}

export async function setLeadStatus(id: string, status: LeadStatus): Promise<void> {
  await db
    .update(leads)
    .set({
      status,
      ...(status === "contacted" ? { contactedAt: new Date() } : {}),
    })
    .where(eq(leads.id, id));
}
