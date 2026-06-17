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
}

export const DEFAULT_GEN: GenConfig = {
  coverage: { M: 9, T: 9, N: 2 },
  maxConsecutive: 6,
  maxConsecutiveRest: 2,
  restAfterStreak: { threshold: 5, minRest: 2 },
  sundayOff: 1,
  supervisorsCountInCoverage: true,
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
