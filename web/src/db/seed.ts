/**
 * Carga la plantilla inicial de trabajadoras (con restricciones) y las
 * vacaciones de julio en la base de datos.
 * Uso:  DATABASE_URL=... npm run db:seed
 *
 * Revisar y ajustar la lista real con Diana (26 gerocultoras + 2 supervisoras).
 */
import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { workers, vacations } from "./schema";

type Role = "gerocultora" | "gerocultora_lv" | "supervisora";

const ROSTER: {
  name: string;
  jobRole: Role;
  noNight?: boolean;
  onlyShift?: string;
}[] = [
  { name: "Diana", jobRole: "supervisora" },
  { name: "Supervisora 2", jobRole: "supervisora" },
  { name: "M.Mar", jobRole: "gerocultora_lv" },
  { name: "Mónica", jobRole: "gerocultora" },
  { name: "Bárbara", jobRole: "gerocultora" },
  { name: "Rocío", jobRole: "gerocultora", noNight: true },
  { name: "Pamela", jobRole: "gerocultora" },
  { name: "Irene León", jobRole: "gerocultora" },
  { name: "Desiree", jobRole: "gerocultora" },
  { name: "Cloe", jobRole: "gerocultora" },
  { name: "Laura Padilla", jobRole: "gerocultora" },
  { name: "Montse", jobRole: "gerocultora" },
  { name: "Mar", jobRole: "gerocultora", noNight: true },
  { name: "Melody", jobRole: "gerocultora" },
  { name: "Mª José", jobRole: "gerocultora" },
  { name: "Sandra", jobRole: "gerocultora" },
  { name: "Ana Montoro", jobRole: "gerocultora" },
  { name: "Isabel", jobRole: "gerocultora" },
  { name: "Noemí", jobRole: "gerocultora", noNight: true, onlyShift: "T" },
  { name: "Ainhoa", jobRole: "gerocultora" },
  { name: "Conce", jobRole: "gerocultora" },
  { name: "Ana Isabel", jobRole: "gerocultora" },
  { name: "Sara", jobRole: "gerocultora" },
  { name: "Azblais", jobRole: "gerocultora" },
  { name: "Diego", jobRole: "gerocultora", noNight: true },
  { name: "Isabel María", jobRole: "gerocultora" },
  { name: "Yolanda", jobRole: "gerocultora" },
  { name: "Laura", jobRole: "gerocultora" },
  { name: "Toñi", jobRole: "gerocultora" },
  { name: "Wisan", jobRole: "gerocultora" },
  { name: "Nuria", jobRole: "gerocultora" },
  { name: "Susana", jobRole: "gerocultora" },
];

// Vacaciones de julio 2026 (rangos): nombre -> [inicio, fin]
const VACACIONES: Record<string, [string, string]> = {
  "Cloe": ["2026-07-01", "2026-07-15"],
  "Diana": ["2026-07-01", "2026-07-15"],
  "Mar": ["2026-07-16", "2026-07-30"],
  "Isabel": ["2026-07-16", "2026-07-30"],
  "Toñi": ["2026-07-16", "2026-07-30"],
};

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("Define DATABASE_URL para hacer seed.");
  const db = drizzle(neon(url));

  const inserted = await db
    .insert(workers)
    .values(ROSTER)
    .returning({ id: workers.id, name: workers.name });
  console.log(`✓ ${inserted.length} trabajadoras insertadas.`);

  const idByName = new Map(inserted.map((w) => [w.name, w.id]));
  const vacRows = Object.entries(VACACIONES)
    .filter(([name]) => idByName.has(name))
    .map(([name, [startDate, endDate]]) => ({
      workerId: idByName.get(name)!,
      startDate,
      endDate,
      note: "Vacaciones",
    }));
  if (vacRows.length) {
    await db.insert(vacations).values(vacRows);
    console.log(`✓ ${vacRows.length} periodos de vacaciones insertados.`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
