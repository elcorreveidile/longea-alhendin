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
  spam?: boolean;
}): Promise<void> {
  await db.insert(leads).values({
    name: data.name,
    email: data.email,
    org: data.org ?? null,
    message: data.message,
    source: data.source ?? "contacto",
    spam: data.spam ?? false,
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

/** Marca/desmarca un interesado como spam. Al marcarlo, lo archiva. */
export async function setLeadSpam(id: string, spam: boolean): Promise<void> {
  await db
    .update(leads)
    .set({ spam, ...(spam ? { status: "archived" as const } : {}) })
    .where(eq(leads.id, id));
}

/** Borra definitivamente un interesado. */
export async function deleteLead(id: string): Promise<void> {
  await db.delete(leads).where(eq(leads.id, id));
}
