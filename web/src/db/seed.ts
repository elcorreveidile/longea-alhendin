/**
 * Carga la plantilla inicial de trabajadoras en la base de datos.
 * Uso:  DATABASE_URL=... npm run db:seed
 *
 * Los nombres provienen de la plantilla actual (leídos del Excel). Revisar y
 * ajustar la lista real con Diana (26 gerocultoras + 2 supervisoras).
 */
import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { workers } from "./schema";

const ROSTER: { name: string; jobRole: "gerocultora" | "gerocultora_lv" | "supervisora" }[] = [
  { name: "Diana", jobRole: "supervisora" },
  { name: "Supervisora 2", jobRole: "supervisora" },
  { name: "M.Mar", jobRole: "gerocultora_lv" },
  { name: "Mónica", jobRole: "gerocultora" },
  { name: "Bárbara", jobRole: "gerocultora" },
  { name: "Rocío", jobRole: "gerocultora" },
  { name: "Pamela", jobRole: "gerocultora" },
  { name: "Irene León", jobRole: "gerocultora" },
  { name: "Desiree", jobRole: "gerocultora" },
  { name: "Cloe", jobRole: "gerocultora" },
  { name: "Laura Padilla", jobRole: "gerocultora" },
  { name: "Montse", jobRole: "gerocultora" },
  { name: "Mar", jobRole: "gerocultora" },
  { name: "Melody", jobRole: "gerocultora" },
  { name: "Mª José", jobRole: "gerocultora" },
  { name: "Sandra", jobRole: "gerocultora" },
  { name: "Ana Montoro", jobRole: "gerocultora" },
  { name: "Isabel", jobRole: "gerocultora" },
  { name: "Noemí", jobRole: "gerocultora" },
  { name: "Ainhoa", jobRole: "gerocultora" },
  { name: "Conce", jobRole: "gerocultora" },
  { name: "Ana Isabel", jobRole: "gerocultora" },
  { name: "Sara", jobRole: "gerocultora" },
  { name: "Azblais", jobRole: "gerocultora" },
  { name: "Diego", jobRole: "gerocultora" },
  { name: "Isabel María", jobRole: "gerocultora" },
  { name: "Yolanda", jobRole: "gerocultora" },
  { name: "Laura", jobRole: "gerocultora" },
  { name: "Toñi", jobRole: "gerocultora" },
  { name: "Wisan", jobRole: "gerocultora" },
  { name: "Nuria", jobRole: "gerocultora" },
  { name: "Susana", jobRole: "gerocultora" },
];

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("Define DATABASE_URL para hacer seed.");
  const db = drizzle(neon(url));

  const inserted = await db.insert(workers).values(ROSTER).returning({ id: workers.id });
  console.log(`✓ ${inserted.length} trabajadoras insertadas.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
