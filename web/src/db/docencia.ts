import "server-only";
import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "./index";
import {
  coursePrograms, courseTerms, subjects, teachingGroups,
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
