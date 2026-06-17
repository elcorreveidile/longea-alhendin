import "server-only";
import { randomInt, createHash } from "crypto";
import { and, desc, eq, gt, isNull } from "drizzle-orm";
import { db } from "@/db";
import { otpCodes } from "@/db/schema";

const TTL_MS = 10 * 60 * 1000; // 10 minutos
const MAX_ATTEMPTS = 5; // intentos por código antes de invalidarlo
const RESEND_COOLDOWN_MS = 45 * 1000; // no reenviar antes de 45s

function hashCode(phone: string, code: string): string {
  return createHash("sha256").update(`${phone}:${code}`).digest("hex");
}

/**
 * Crea un código de 6 dígitos para el teléfono y guarda solo su hash.
 * Devuelve el código en claro (para enviarlo por SMS) o null si hay que esperar
 * (antiflood: hay un código reciente sin caducar).
 */
export async function createOtp(phoneE164: string): Promise<string | null> {
  const last = (
    await db
      .select()
      .from(otpCodes)
      .where(eq(otpCodes.phone, phoneE164))
      .orderBy(desc(otpCodes.createdAt))
      .limit(1)
  )[0];

  if (last && Date.now() - new Date(last.createdAt).getTime() < RESEND_COOLDOWN_MS) {
    return null; // pedido hace muy poco
  }

  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  await db.insert(otpCodes).values({
    phone: phoneE164,
    codeHash: hashCode(phoneE164, code),
    expiresAt: new Date(Date.now() + TTL_MS),
  });
  return code;
}

/**
 * Verifica el código del teléfono. Marca el código como usado si es correcto.
 * Controla intentos (máx. 5) y caducidad (10 min). Devuelve true si es válido.
 */
export async function verifyOtp(phoneE164: string, code: string): Promise<boolean> {
  const now = new Date();
  const row = (
    await db
      .select()
      .from(otpCodes)
      .where(
        and(
          eq(otpCodes.phone, phoneE164),
          isNull(otpCodes.usedAt),
          gt(otpCodes.expiresAt, now),
        ),
      )
      .orderBy(desc(otpCodes.createdAt))
      .limit(1)
  )[0];

  if (!row) return false;
  if (row.attempts >= MAX_ATTEMPTS) return false;

  const ok = row.codeHash === hashCode(phoneE164, code);

  if (!ok) {
    await db
      .update(otpCodes)
      .set({ attempts: row.attempts + 1 })
      .where(eq(otpCodes.id, row.id));
    return false;
  }

  // Correcto: marcar como usado (un solo uso).
  const updated = await db
    .update(otpCodes)
    .set({ usedAt: now })
    .where(and(eq(otpCodes.id, row.id), isNull(otpCodes.usedAt)))
    .returning({ id: otpCodes.id });

  return updated.length > 0;
}
