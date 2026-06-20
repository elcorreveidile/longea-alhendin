import "server-only";
import { desc, eq } from "drizzle-orm";
import { db } from "./index";
import { staffMessages, type StaffMessage } from "./schema";

export async function createStaffMessage(data: {
  tenantId: string;
  senderUserId: string;
  senderName: string;
  senderRole: string | null;
  subject: string;
  body: string;
  to: string[];
  cc: string[];
}): Promise<void> {
  await db.insert(staffMessages).values({
    tenantId: data.tenantId,
    senderUserId: data.senderUserId,
    senderName: data.senderName,
    senderRole: data.senderRole,
    subject: data.subject,
    body: data.body,
    toEmails: data.to.join(", "),
    ccEmails: data.cc.join(", "),
    toCount: data.to.length,
  });
}

/** Últimos envíos del centro, más recientes primero. */
export async function listStaffMessages(tenantId: string, limit = 40): Promise<StaffMessage[]> {
  return db
    .select()
    .from(staffMessages)
    .where(eq(staffMessages.tenantId, tenantId))
    .orderBy(desc(staffMessages.createdAt))
    .limit(limit);
}
