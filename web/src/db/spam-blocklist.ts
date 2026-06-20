import "server-only";
import { asc, eq } from "drizzle-orm";
import { db } from "./index";
import { spamBlocklist, type SpamBlock } from "./schema";

export type BlockKind = "term" | "email" | "domain";

/** Normaliza el valor según el tipo (minúsculas, sin @ inicial en dominios). */
export function normalizeBlock(kind: BlockKind, raw: string): string {
  const v = raw.trim().toLowerCase();
  if (kind === "domain") return v.replace(/^@/, "");
  return v;
}

export async function listBlocklist(): Promise<SpamBlock[]> {
  return db.select().from(spamBlocklist).orderBy(asc(spamBlocklist.kind), asc(spamBlocklist.value));
}

/** Añade una entrada. Ignora duplicados (índice único). */
export async function addBlock(kind: BlockKind, value: string): Promise<void> {
  const v = normalizeBlock(kind, value);
  if (!v) return;
  await db.insert(spamBlocklist).values({ kind, value: v }).onConflictDoNothing();
}

export async function removeBlock(id: string): Promise<void> {
  await db.delete(spamBlocklist).where(eq(spamBlocklist.id, id));
}
