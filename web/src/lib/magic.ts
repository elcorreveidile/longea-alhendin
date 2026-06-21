import "server-only";
import { randomBytes, createHash } from "crypto";
import { and, eq, gt, isNull, lt } from "drizzle-orm";
import { db } from "@/db";
import { magicTokens } from "@/db/schema";

const TTL_MS = 60 * 60 * 1000; // 60 minutos (margen para correos que tardan en llegar)

export function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

/** Crea un token de un solo uso y guarda solo su hash. Devuelve el token en claro. */
export async function createMagicToken(email: string): Promise<string> {
  const raw = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + TTL_MS);
  await db.insert(magicTokens).values({
    email: email.toLowerCase(),
    tokenHash: hashToken(raw),
    expiresAt,
  });
  return raw;
}

/**
 * Valida un token: que exista, no esté usado y no haya caducado.
 * Si es válido, lo marca como usado (un solo uso) y devuelve el email.
 */
export async function consumeMagicToken(raw: string): Promise<string | null> {
  const tokenHash = hashToken(raw);
  const now = new Date();

  const rows = await db
    .select()
    .from(magicTokens)
    .where(
      and(
        eq(magicTokens.tokenHash, tokenHash),
        isNull(magicTokens.usedAt),
        gt(magicTokens.expiresAt, now),
      ),
    )
    .limit(1);

  const token = rows[0];
  if (!token) return null;

  // Marca como usado (idempotente gracias a la condición usedAt IS NULL).
  const updated = await db
    .update(magicTokens)
    .set({ usedAt: now })
    .where(and(eq(magicTokens.id, token.id), isNull(magicTokens.usedAt)))
    .returning({ id: magicTokens.id });

  if (updated.length === 0) return null; // ya consumido en paralelo
  return token.email;
}

/** Limpieza de tokens caducados (se puede llamar de vez en cuando). */
export async function purgeExpiredTokens(): Promise<void> {
  await db.delete(magicTokens).where(lt(magicTokens.expiresAt, new Date()));
}
