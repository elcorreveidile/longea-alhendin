import "server-only";
import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "./index";
import {
  coursePrograms, courseTerms, subjects, teachingGroups, groupTeachers, teacherUnavailability,
  type CourseProgram, type CourseTerm, type Subject, type TeachingGroup,
} from "./schema";

// --- Programas ---
export async function listPrograms(tenantId: string): Promise<CourseProgram[]> {
  return db.select().from(coursePrograms).where(eq(coursePrograms.tenantId, tenantId)).orderBy(asc(coursePrograms.code));
}
export async function addProgram(d: { tenantId: string; code: string; name: string; kind: string; notes?: string | null }) {
  await db.insert(coursePrograms).values({
    tenantId: d.tenantId, code: d.code, name: d.name,
    kind: d.kind as CourseProgram["kind"], notes: d.notes ?? null,
  });
}
export async function deleteProgram(tenantId: string, id: string) {
  await db.delete(coursePrograms).where(and(eq(coursePrograms.id, id), eq(coursePrograms.tenantId, tenantId)));
}

// --- Ediciones (terms) ---
export type TermRow = CourseTerm & { programName: string; programCode: string };
export async function listTerms(tenantId: string): Promise<TermRow[]> {
  const rows = await db
    .select({ t: courseTerms, pName: coursePrograms.name, pCode: coursePrograms.code })
    .from(courseTerms)
    .innerJoin(coursePrograms, eq(coursePrograms.id, courseTerms.programId))
    .where(eq(courseTerms.tenantId, tenantId))
    .orderBy(desc(courseTerms.courseYear), asc(coursePrograms.code));
  return rows.map((r) => ({ ...r.t, programName: r.pName, programCode: r.pCode }));
}
export async function addTerm(d: {
  tenantId: string; programId: string; name: string; courseYear: number;
  startDate?: string | null; endDate?: string | null;
}) {
  await db.insert(courseTerms).values({
    tenantId: d.tenantId, programId: d.programId, name: d.name, courseYear: d.courseYear,
    startDate: d.startDate || null, endDate: d.endDate || null,
  });
}
export async function deleteTerm(tenantId: string, id: string) {
  await db.delete(courseTerms).where(and(eq(courseTerms.id, id), eq(courseTerms.tenantId, tenantId)));
}

// --- Asignaturas ---
export async function listSubjects(tenantId: string): Promise<Subject[]> {
  return db.select().from(subjects).where(eq(subjects.tenantId, tenantId)).orderBy(asc(subjects.area), asc(subjects.name));
}
export async function addSubject(d: {
  tenantId: string; name: string; area?: string | null; languages: string;
  levelMin?: string | null; levelMax?: string | null; staffing: string;
}) {
  await db.insert(subjects).values({
    tenantId: d.tenantId, name: d.name, area: d.area || null, languages: d.languages,
    levelMin: d.levelMin || null, levelMax: d.levelMax || null, staffing: d.staffing,
  });
}
export async function deleteSubject(tenantId: string, id: string) {
  await db.delete(subjects).where(and(eq(subjects.id, id), eq(subjects.tenantId, tenantId)));
}

/** Inserta asignaturas del catálogo que aún no existan (por nombre). Devuelve cuántas añadió. */
export async function addSubjectsBulk(
  tenantId: string,
  items: { name: string; area?: string | null; languages: string }[],
): Promise<number> {
  const existing = await db.select({ name: subjects.name }).from(subjects).where(eq(subjects.tenantId, tenantId));
  const have = new Set(existing.map((s) => s.name.trim().toLowerCase()));
  const toAdd = items.filter((i) => !have.has(i.name.trim().toLowerCase()));
  if (toAdd.length === 0) return 0;
  await db.insert(subjects).values(
    toAdd.map((i) => ({
      tenantId, name: i.name, area: i.area ?? null, languages: i.languages, staffing: "abierta",
    })),
  );
  return toAdd.length;
}

// --- Grupos / plazas ---
export type GroupRow = TeachingGroup & { subjectName: string | null };
export async function listGroups(tenantId: string, termId: string): Promise<GroupRow[]> {
  const rows = await db
    .select({ g: teachingGroups, sName: subjects.name })
    .from(teachingGroups)
    .leftJoin(subjects, eq(subjects.id, teachingGroups.subjectId))
    .where(and(eq(teachingGroups.tenantId, tenantId), eq(teachingGroups.termId, termId)))
    .orderBy(asc(teachingGroups.groupCode));
  return rows.map((r) => ({ ...r.g, subjectName: r.sName }));
}
export async function addGroup(d: {
  tenantId: string; termId: string; subjectId?: string | null; groupCode?: string | null;
  kind: string; language: string; level?: string | null; minutes: number;
  schedule?: unknown;
}) {
  await db.insert(teachingGroups).values({
    tenantId: d.tenantId, termId: d.termId, subjectId: d.subjectId || null,
    groupCode: d.groupCode || null, kind: d.kind as TeachingGroup["kind"],
    language: d.language, level: d.level || null, minutes: d.minutes,
    schedule: d.schedule ?? null,
  });
}
export async function deleteGroup(tenantId: string, id: string) {
  await db.delete(teachingGroups).where(and(eq(teachingGroups.id, id), eq(teachingGroups.tenantId, tenantId)));
}
/** Reemplaza el horario (franjas) de un grupo. null = sin horario. */
export async function setGroupSchedule(tenantId: string, id: string, schedule: unknown) {
  await db.update(teachingGroups).set({ schedule: schedule ?? null }).where(and(eq(teachingGroups.id, id), eq(teachingGroups.tenantId, tenantId)));
}

// --- Docencia asignada a un profesor (vía group_teachers) ---
export interface TeacherGroupRow {
  id: string;
  kind: string;
  groupCode: string | null;
  language: string;
  level: string | null;
  minutes: number;
  schedule: unknown;
  subjectName: string | null;
  termName: string;
}
export async function listGroupsForTeacher(tenantId: string, workerId: string): Promise<TeacherGroupRow[]> {
  const rows = await db
    .select({
      id: teachingGroups.id, kind: teachingGroups.kind, groupCode: teachingGroups.groupCode,
      language: teachingGroups.language, level: teachingGroups.level, minutes: teachingGroups.minutes,
      schedule: teachingGroups.schedule, subjectName: subjects.name, termName: courseTerms.name,
    })
    .from(groupTeachers)
    .innerJoin(teachingGroups, eq(teachingGroups.id, groupTeachers.groupId))
    .innerJoin(courseTerms, eq(courseTerms.id, teachingGroups.termId))
    .leftJoin(subjects, eq(subjects.id, teachingGroups.subjectId))
    .where(and(eq(groupTeachers.workerId, workerId), eq(teachingGroups.tenantId, tenantId)))
    .orderBy(asc(courseTerms.name));
  return rows.map((r) => ({ ...r, subjectName: r.subjectName ?? null }));
}

// --- Ausencias / permisos del profesor ---
export type Absence = typeof teacherUnavailability.$inferSelect;
export async function listAbsences(tenantId: string, workerId: string): Promise<Absence[]> {
  return db
    .select().from(teacherUnavailability)
    .where(and(eq(teacherUnavailability.tenantId, tenantId), eq(teacherUnavailability.workerId, workerId)))
    .orderBy(desc(teacherUnavailability.startDate));
}
export async function addAbsence(d: {
  tenantId: string; workerId: string; kind: string; startDate: string; endDate: string;
  note?: string | null; createdByUserId?: string | null; status?: string;
}) {
  await db.insert(teacherUnavailability).values({
    tenantId: d.tenantId, workerId: d.workerId, kind: d.kind,
    startDate: d.startDate, endDate: d.endDate, note: d.note ?? null,
    status: d.status ?? "aprobada", createdByUserId: d.createdByUserId ?? null,
  });
}
/** Subdirección aprueba o rechaza una ausencia solicitada. */
export async function setAbsenceStatus(tenantId: string, id: string, status: string, byUserId: string) {
  await db.update(teacherUnavailability)
    .set({ status, decidedByUserId: byUserId, decidedAt: new Date() })
    .where(and(eq(teacherUnavailability.id, id), eq(teacherUnavailability.tenantId, tenantId)));
}
export async function deleteAbsence(tenantId: string, id: string, opts?: { workerId?: string; onlyPending?: boolean }) {
  const conds = [eq(teacherUnavailability.id, id), eq(teacherUnavailability.tenantId, tenantId)];
  if (opts?.workerId) conds.push(eq(teacherUnavailability.workerId, opts.workerId));
  if (opts?.onlyPending) conds.push(eq(teacherUnavailability.status, "solicitada"));
  await db.delete(teacherUnavailability).where(and(...conds));
}
