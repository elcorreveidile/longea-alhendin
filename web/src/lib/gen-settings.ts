import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { settings } from "@/db/schema";

export interface GenConfig {
  coverage: { M: number; T: number; N: number };
  maxConsecutive: number;
  maxConsecutiveRest: number;
  restAfterStreak: { threshold: number; minRest: number };
  sundayOff: number;
  supervisorsCountInCoverage: boolean;
  minRestDaysPerMonth: number;
  minWorkRun: number;
}

export const DEFAULT_GEN: GenConfig = {
  coverage: { M: 9, T: 9, N: 2 },
  maxConsecutive: 5,          // gerocultoras: bloques de 4-5 días (Diana)
  maxConsecutiveRest: 2,
  restAfterStreak: { threshold: 4, minRest: 2 },
  sundayOff: 1,
  supervisorsCountInCoverage: true,
  minRestDaysPerMonth: 10,    // >= 10 descansos/mes por gerocultora (aparte de vacaciones)
  minWorkRun: 4,              // bloques de trabajo de >= 4 días
};

const KEY = "gen_config";

export async function getGenConfig(tenantId: string): Promise<GenConfig> {
  const r = (
    await db.select().from(settings).where(and(eq(settings.tenantId, tenantId), eq(settings.key, KEY))).limit(1)
  )[0];
  if (!r) return DEFAULT_GEN;
  try {
    const parsed = JSON.parse(r.value);
    return {
      ...DEFAULT_GEN,
      ...parsed,
      coverage: { ...DEFAULT_GEN.coverage, ...(parsed.coverage ?? {}) },
      restAfterStreak: { ...DEFAULT_GEN.restAfterStreak, ...(parsed.restAfterStreak ?? {}) },
    };
  } catch {
    return DEFAULT_GEN;
  }
}

export async function setGenConfig(tenantId: string, cfg: GenConfig): Promise<void> {
  const v = JSON.stringify(cfg);
  await db
    .insert(settings)
    .values({ tenantId, key: KEY, value: v })
    .onConflictDoUpdate({ target: [settings.tenantId, settings.key], set: { value: v, updatedAt: new Date() } });
}
