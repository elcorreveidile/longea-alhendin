import "server-only";
import { and, asc, desc, eq, gte, lte, ne, sql } from "drizzle-orm";
import { db } from "./index";
import { workers, teacherProfiles, hourEntries, type TeacherProfile, type Worker } from "./schema";
import { courseYearRange } from "@/data/hour-concepts";

export type TeacherRow = Worker & {
  profile: TeacherProfile | null;
  doneMin: number; // minutos no anulados del curso
  pending: number; // nº de apuntes declarados sin confirmar
};

/** Perfil docente de un trabajador (o null si no es profesor). */
export async function getTeacherProfile(workerId: string): Promise<TeacherProfile | null> {
  const r = await db.select().from(teacherProfiles).where(eq(teacherProfiles.workerId, workerId)).limit(1);
  return r[0] ?? null;
}

export async function upsertTeacherProfile(data: {
  workerId: string;
  tenantId: string;
  annualTargetMin: number;
  reductionMin: number;
  reductionType?: string | null;
  availability: string;
  notes?: string | null;
}): Promise<void> {
  await db
    .insert(teacherProfiles)
    .values({
      workerId: data.workerId,
      tenantId: data.tenantId,
      annualTargetMin: data.annualTargetMin,
      reductionMin: data.reductionMin,
      reductionType: data.reductionType ?? null,
      availability: data.availability,
      notes: data.notes ?? null,
    })
    .onConflictDoUpdate({
      target: teacherProfiles.workerId,
      set: {
        annualTargetMin: data.annualTargetMin,
        reductionMin: data.reductionMin,
        reductionType: data.reductionType ?? null,
        availability: data.availability,
        notes: data.notes ?? null,
        updatedAt: new Date(),
      },
    });
}

/** Suma de minutos válidos (no anulados) por trabajador en un curso. */
async function doneMinutesByWorker(tenantId: string, startYear: number): Promise<Record<string, number>> {
  const { from, to } = courseYearRange(startYear);
  const rows = await db
    .select({ workerId: hourEntries.workerId, total: sql<number>`coalesce(sum(${hourEntries.minutes}),0)` })
    .from(hourEntries)
    .where(
      and(
        eq(hourEntries.tenantId, tenantId),
        ne(hourEntries.status, "voided"),
        gte(hourEntries.workDate, from),
        lte(hourEntries.workDate, to),
      ),
    )
    .groupBy(hourEntries.workerId);
  const out: Record<string, number> = {};
  for (const r of rows) out[r.workerId] = Number(r.total);
  return out;
}

/** Nº de apuntes "declarados" (pendientes de confirmar) por trabajador en un curso. */
async function pendingByWorker(tenantId: string, startYear: number): Promise<Record<string, number>> {
  const { from, to } = courseYearRange(startYear);
  const rows = await db
    .select({ workerId: hourEntries.workerId, n: sql<number>`count(*)` })
    .from(hourEntries)
    .where(
      and(
        eq(hourEntries.tenantId, tenantId),
        eq(hourEntries.status, "declared"),
        gte(hourEntries.workDate, from),
        lte(hourEntries.workDate, to),
      ),
    )
    .groupBy(hourEntries.workerId);
  const out: Record<string, number> = {};
  for (const r of rows) out[r.workerId] = Number(r.n);
  return out;
}

/** Listado de profesores (trabajadores activos con perfil docente) + horas hechas. */
export async function listTeachers(tenantId: string, startYear: number): Promise<TeacherRow[]> {
  const rows = await db
    .select({ w: workers, p: teacherProfiles })
    .from(workers)
    .innerJoin(teacherProfiles, eq(teacherProfiles.workerId, workers.id))
    .where(and(eq(workers.tenantId, tenantId), eq(workers.active, true)))
    .orderBy(asc(workers.name));
  const done = await doneMinutesByWorker(tenantId, startYear);
  const pending = await pendingByWorker(tenantId, startYear);
  return rows.map((r) => ({ ...r.w, profile: r.p, doneMin: done[r.w.id] ?? 0, pending: pending[r.w.id] ?? 0 }));
}

/** Apuntes de un profesor en un curso, más recientes primero. */
export async function listHourEntries(tenantId: string, workerId: string, startYear: number) {
  const { from, to } = courseYearRange(startYear);
  return db
    .select()
    .from(hourEntries)
    .where(
      and(
        eq(hourEntries.tenantId, tenantId),
        eq(hourEntries.workerId, workerId),
        gte(hourEntries.workDate, from),
        lte(hourEntries.workDate, to),
      ),
    )
    .orderBy(desc(hourEntries.workDate), desc(hourEntries.createdAt));
}

export async function addHourEntry(data: {
  tenantId: string;
  workerId: string;
  workDate: string;
  minutes: number;
  concept: string;
  note?: string | null;
  createdByUserId?: string | null;
}): Promise<void> {
  await db.insert(hourEntries).values({
    tenantId: data.tenantId,
    workerId: data.workerId,
    workDate: data.workDate,
    minutes: data.minutes,
    concept: data.concept,
    note: data.note ?? null,
    createdByUserId: data.createdByUserId ?? null,
  });
}

/** Subdirección confirma un apunte declarado. */
export async function confirmHourEntry(id: string, byUserId: string): Promise<void> {
  await db
    .update(hourEntries)
    .set({ status: "confirmed", confirmedByUserId: byUserId, confirmedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(hourEntries.id, id), eq(hourEntries.status, "declared")));
}

/** Subdirección confirma de una vez TODAS las horas declaradas de un profesor en el curso. */
export async function confirmAllDeclared(
  tenantId: string,
  workerId: string,
  byUserId: string,
  startYear: number,
): Promise<void> {
  const { from, to } = courseYearRange(startYear);
  await db
    .update(hourEntries)
    .set({ status: "confirmed", confirmedByUserId: byUserId, confirmedAt: new Date(), updatedAt: new Date() })
    .where(
      and(
        eq(hourEntries.tenantId, tenantId),
        eq(hourEntries.workerId, workerId),
        eq(hourEntries.status, "declared"),
        gte(hourEntries.workDate, from),
        lte(hourEntries.workDate, to),
      ),
    );
}

/** Anula un apunte (no se borra: queda traza). */
export async function voidHourEntry(id: string): Promise<void> {
  await db
    .update(hourEntries)
    .set({ status: "voided", updatedAt: new Date() })
    .where(and(eq(hourEntries.id, id), ne(hourEntries.status, "locked")));
}

/** El profesor solo puede anular un apunte SUYO que aún esté "declarado". */
export async function voidOwnDeclared(id: string, workerId: string): Promise<void> {
  await db
    .update(hourEntries)
    .set({ status: "voided", updatedAt: new Date() })
    .where(and(eq(hourEntries.id, id), eq(hourEntries.workerId, workerId), eq(hourEntries.status, "declared")));
}

/** RRHH cierra el curso: bloquea todos los apuntes válidos del periodo. */
export async function lockCourse(tenantId: string, startYear: number): Promise<void> {
  const { from, to } = courseYearRange(startYear);
  await db
    .update(hourEntries)
    .set({ status: "locked", updatedAt: new Date() })
    .where(
      and(
        eq(hourEntries.tenantId, tenantId),
        ne(hourEntries.status, "voided"),
        gte(hourEntries.workDate, from),
        lte(hourEntries.workDate, to),
      ),
    );
}
