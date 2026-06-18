import "server-only";
import { createHash } from "crypto";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { users, workers, settings } from "@/db/schema";
import { authSecret } from "./env";
import { createSession } from "./session";

const CODE_KEY = "worker_access_code";

/** Código de acceso de trabajadoras del tenant (el que reparte la administradora). */
export async function getAccessCode(tenantId: string): Promise<string | null> {
  const r = (
    await db
      .select()
      .from(settings)
      .where(and(eq(settings.tenantId, tenantId), eq(settings.key, CODE_KEY)))
      .limit(1)
  )[0];
  return r?.value ?? null;
}

export async function setAccessCode(tenantId: string, code: string): Promise<void> {
  const v = code.trim();
  await db
    .insert(settings)
    .values({ tenantId, key: CODE_KEY, value: v })
    .onConflictDoUpdate({
      target: [settings.tenantId, settings.key],
      set: { value: v, updatedAt: new Date() },
    });
}

const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, "");

export async function verifyAccessCode(tenantId: string, code: string): Promise<boolean> {
  const stored = await getAccessCode(tenantId);
  if (!stored) return false;
  return norm(stored) === norm(code);
}

export async function listActiveWorkers(tenantId: string) {
  return db
    .select({ id: workers.id, name: workers.name })
    .from(workers)
    .where(and(eq(workers.tenantId, tenantId), eq(workers.active, true)));
}

function pinHash(workerId: string, pin: string): string {
  return createHash("sha256").update(`${authSecret()}:${workerId}:${pin}`).digest("hex");
}

export async function getWorkerUser(workerId: string) {
  return (await db.select().from(users).where(eq(users.workerId, workerId)).limit(1))[0] ?? null;
}

/** ¿La trabajadora ya tiene un PIN creado? */
export async function workerHasPin(workerId: string): Promise<boolean> {
  const u = await getWorkerUser(workerId);
  return !!u?.pinHash;
}

async function startWorkerSession(user: typeof users.$inferSelect, workerId: string) {
  await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id));
  await createSession({
    userId: user.id,
    email: user.email ?? "",
    name: user.name,
    role: "worker",
    workerId,
    tenantId: user.tenantId,
  });
}

/** Crea (o restablece) el PIN de la trabajadora y arranca su sesión. */
export async function setWorkerPinAndLogin(workerId: string, pin: string): Promise<boolean> {
  const w = (await db.select().from(workers).where(eq(workers.id, workerId)).limit(1))[0];
  if (!w) return false;
  const hash = pinHash(workerId, pin);
  let user = await getWorkerUser(workerId);
  if (user) {
    await db.update(users).set({ pinHash: hash }).where(eq(users.id, user.id));
  } else {
    user = (
      await db
        .insert(users)
        .values({ tenantId: w.tenantId, name: w.name, role: "worker", workerId, pinHash: hash })
        .returning()
    )[0];
  }
  await startWorkerSession(user, workerId);
  return true;
}

/** Verifica el PIN y arranca la sesión. */
export async function loginWorkerWithPin(workerId: string, pin: string): Promise<boolean> {
  const user = await getWorkerUser(workerId);
  if (!user?.pinHash) return false;
  if (user.pinHash !== pinHash(workerId, pin)) return false;
  await startWorkerSession(user, workerId);
  return true;
}
