import {
  pgTable,
  uuid,
  text,
  timestamp,
  date,
  integer,
  jsonb,
  boolean,
  pgEnum,
  uniqueIndex,
  primaryKey,
} from "drizzle-orm/pg-core";

/** Cliente (residencia). Cada tenant tiene su plantilla, cuadrantes y código. */
export const tenants = pgTable("tenants", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: text("slug").notNull().unique(), // subdominio: alhendin, escoriza…
  name: text("name").notNull(), // "Residencia Alhendín"
  logoUrl: text("logo_url"), // por defecto el logo de Longea
  loginBgUrl: text("login_bg_url"), // imagen de fondo del login/acceso
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Permiso dentro de la app (distinto del puesto laboral)
export const appRole = pgEnum("app_role", ["superadmin", "admin", "worker"]);
// Puesto laboral en la residencia
export const jobRole = pgEnum("job_role", [
  "gerocultora",
  "gerocultora_lv", // M.Mar: solo L-V mañana
  "supervisora",
]);
export const cuadranteStatus = pgEnum("cuadrante_status", ["draft", "published"]);
// Estado de un contacto/interesado llegado por el formulario público.
export const leadStatus = pgEnum("lead_status", ["new", "contacted", "archived"]);
// Estado de un apunte del libro de horas (profesorado). Flujo:
//  declared: el profesor lo ha declarado · confirmed: subdirección lo confirma ·
//  locked: periodo cerrado por RRHH/nóminas · voided: anulado (no se borra,
//  queda traza). Las correcciones se hacen con un apunte nuevo.
export const hourStatus = pgEnum("hour_status", ["declared", "confirmed", "locked", "voided"]);

// --- Reparto de docencia (Acentos / academia) ---
// Tipo de programa/curso (CILE, CEH, verano, examen, formación…).
export const programKind = pgEnum("program_kind", [
  "intensivo", "semestral", "verano", "colaboracion", "examen", "formacion", "otro",
]);
// Tipo de plaza docente. `tutoria` ocupa franja pero NO computa carga.
export const groupKind = pgEnum("group_kind", [
  "clase", "practicas", "vigilancia_examen", "prueba_nivel", "tutoria", "otro",
]);
// Estado de asignación de un grupo.
export const groupStatus = pgEnum("group_status", ["sin_asignar", "auto", "manual", "locked"]);
// Rol de un profesor respecto a una asignatura.
export const teacherRole = pgEnum("teacher_role", ["titular", "candidato"]);


/** Plantilla: cada trabajadora de la residencia. */
export const workers = pgTable("workers", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  jobRole: jobRole("job_role").notNull().default("gerocultora"),
  phone: text("phone"),
  noNight: boolean("no_night").notNull().default(false),
  onlyShift: text("only_shift"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/** Usuarios que pueden iniciar sesión (admin o trabajadora). */
export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    // Trabajadora -> su residencia; admin global -> null
    tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }),
    email: text("email"),
    phone: text("phone"),
    name: text("name"),
    role: appRole("role").notNull().default("worker"),
    // Enlaza el login con su ficha de plantilla (para "mi turno")
    workerId: uuid("worker_id").references(() => workers.id, { onDelete: "set null" }),
    // PIN de acceso de la trabajadora (hash), para el acceso por código + nombre + PIN
    pinHash: text("pin_hash"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("users_email_idx").on(t.email),
    uniqueIndex("users_phone_idx").on(t.phone),
  ],
);

/** Tokens de magic link (correo). */
export const magicTokens = pgTable("magic_tokens", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull(),
  tokenHash: text("token_hash").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/** Códigos OTP por SMS (de un solo uso, se guarda solo el hash). */
export const otpCodes = pgTable("otp_codes", {
  id: uuid("id").defaultRandom().primaryKey(),
  phone: text("phone").notNull(),
  codeHash: text("code_hash").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  attempts: integer("attempts").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/** Vacaciones por trabajadora (rangos de fechas). */
export const vacations = pgTable("vacations", {
  id: uuid("id").defaultRandom().primaryKey(),
  workerId: uuid("worker_id")
    .notNull()
    .references(() => workers.id, { onDelete: "cascade" }),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/** Cuadrantes generados/guardados por mes. */
export const cuadrantes = pgTable(
  "cuadrantes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    year: integer("year").notNull(),
    month: integer("month").notNull(),
    status: cuadranteStatus("status").notNull().default("draft"),
    // Salida del motor: { days, weekdays, assignments, violations, ... }
    data: jsonb("data").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("cuadrantes_tenant_year_month_idx").on(t.tenantId, t.year, t.month)],
);

/** Ajustes de la aplicación (clave/valor). P. ej. el código de acceso de trabajadoras. */
export const settings = pgTable(
  "settings",
  {
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    key: text("key").notNull(),
    value: text("value").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [primaryKey({ columns: [t.tenantId, t.key] })],
);

/**
 * Interesados que escriben por el formulario de contacto de la web pública.
 * No pertenecen a ninguna empresa (son prospectos): los gestiona el superadmin.
 */
export const leads = pgTable("leads", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  org: text("org"),
  message: text("message").notNull(),
  status: leadStatus("status").notNull().default("new"),
  source: text("source").notNull().default("contacto"), // contacto, demo…
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  contactedAt: timestamp("contacted_at", { withTimezone: true }),
});

/**
 * Perfil docente (uno a uno con un trabajador): objetivo de horas anuales,
 * reducciones y disponibilidad. Las horas se guardan en MINUTOS para evitar
 * errores con los decimales (p. ej. 494,5 h = 29 670 min). Curso oct–sept.
 */
export const teacherProfiles = pgTable("teacher_profiles", {
  workerId: uuid("worker_id")
    .primaryKey()
    .references(() => workers.id, { onDelete: "cascade" }),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  annualTargetMin: integer("annual_target_min").notNull().default(46020), // 767 h
  reductionMin: integer("reduction_min").notNull().default(0),
  reductionType: text("reduction_type"), // "Comité", "Edad", "Subdirección"…
  availability: text("availability").notNull().default("both"), // both | morning | afternoon
  languages: text("languages").notNull().default("es"), // CSV idiomas que puede impartir
  levelMin: text("level_min"), // A1…C2
  levelMax: text("level_max"),
  notes: text("notes"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

/**
 * Libro de horas del profesorado: apuntes de horas reales realizadas de forma
 * fehaciente (sello de fecha-hora y autor; nunca se borra, se anula). Las
 * correcciones se hacen con un apunte nuevo. Curso académico oct–sept.
 */
export const hourEntries = pgTable("hour_entries", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  workerId: uuid("worker_id")
    .notNull()
    .references(() => workers.id, { onDelete: "cascade" }),
  workDate: date("work_date").notNull(),
  minutes: integer("minutes").notNull(),
  concept: text("concept").notNull().default("clase"),
  note: text("note"),
  status: hourStatus("status").notNull().default("declared"),
  // Quién confirmó (subdirección) y cuándo, para la trazabilidad fehaciente.
  confirmedByUserId: uuid("confirmed_by_user_id").references(() => users.id, { onDelete: "set null" }),
  confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
  createdByUserId: uuid("created_by_user_id").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

/** Programa/curso (CILE, CEH, CLCE, verano, UNAM, examen, formación…). */
export const coursePrograms = pgTable("course_programs", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  code: text("code").notNull(), // CILE, CEH, CLCE…
  name: text("name").notNull(),
  kind: programKind("kind").notNull().default("otro"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/** Edición concreta de un programa en el calendario (CEH Otoño 2026…). */
export const courseTerms = pgTable("course_terms", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  programId: uuid("program_id").notNull().references(() => coursePrograms.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  courseYear: integer("course_year").notNull(), // año de inicio del curso académico (oct–sep)
  startDate: date("start_date"),
  endDate: date("end_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/** Catálogo de asignaturas (reutilizable entre ediciones). */
export const subjects = pgTable("subjects", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  area: text("area"), // Lengua, Literatura, Cultura…
  languages: text("languages").notNull().default("es"), // CSV: "es" | "en" | "es,en"
  levelMin: text("level_min"), // A1…C2
  levelMax: text("level_max"),
  staffing: text("staffing").notNull().default("abierta"), // fija | abierta
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/** Grupo / plaza docente: la unidad que se asigna a un profesor. */
export const teachingGroups = pgTable("teaching_groups", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  termId: uuid("term_id").notNull().references(() => courseTerms.id, { onDelete: "cascade" }),
  subjectId: uuid("subject_id").references(() => subjects.id, { onDelete: "set null" }),
  groupCode: text("group_code"),
  kind: groupKind("kind").notNull().default("clase"),
  language: text("language").notNull().default("es"), // es | en (idioma de ESTE grupo)
  level: text("level"),
  minutes: integer("minutes").notNull().default(0), // carga en minutos
  schedule: jsonb("schedule"), // [{ weekdays:["L","X"], start:"16:00", end:"18:00" }]
  status: groupStatus("status").notNull().default("sin_asignar"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/** Asignación profesor↔grupo (N:M, admite co-docencia). */
export const groupTeachers = pgTable("group_teachers", {
  groupId: uuid("group_id").notNull().references(() => teachingGroups.id, { onDelete: "cascade" }),
  workerId: uuid("worker_id").notNull().references(() => workers.id, { onDelete: "cascade" }),
  role: text("role"), // titular | co-docente
}, (t) => ({ pk: primaryKey({ columns: [t.groupId, t.workerId] }) }));

/** Quién puede dar cada asignatura y con qué rol (titular/candidato). */
export const teacherSubjects = pgTable("teacher_subjects", {
  workerId: uuid("worker_id").notNull().references(() => workers.id, { onDelete: "cascade" }),
  subjectId: uuid("subject_id").notNull().references(() => subjects.id, { onDelete: "cascade" }),
  role: teacherRole("role").notNull().default("candidato"),
  preferred: boolean("preferred").notNull().default(false),
}, (t) => ({ pk: primaryKey({ columns: [t.workerId, t.subjectId] }) }));

/** No disponibilidad del profesorado: ausencias y permisos.
 *  kind: vacaciones | asuntos_propios | permiso | no_retribuido | baja_medica | otro */
export const teacherUnavailability = pgTable("teacher_unavailability", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  workerId: uuid("worker_id").notNull().references(() => workers.id, { onDelete: "cascade" }),
  kind: text("kind").notNull().default("vacaciones"),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  note: text("note"),
  createdByUserId: uuid("created_by_user_id").references(() => users.id, { onDelete: "set null" }),
});

/** Incompatibilidades entre profesores (no coincidir/compartir). */
export const teacherIncompatibilities = pgTable("teacher_incompatibilities", {
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  workerId: uuid("worker_id").notNull().references(() => workers.id, { onDelete: "cascade" }),
  otherWorkerId: uuid("other_worker_id").notNull().references(() => workers.id, { onDelete: "cascade" }),
}, (t) => ({ pk: primaryKey({ columns: [t.workerId, t.otherWorkerId] }) }));

/** Aulas (recurso secundario). */
export const rooms = pgTable("rooms", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  code: text("code").notNull(),
  site: text("site"), // A | B | ETSI
  capacity: integer("capacity"),
});

export type Tenant = typeof tenants.$inferSelect;
export type Worker = typeof workers.$inferSelect;
export type User = typeof users.$inferSelect;
export type Cuadrante = typeof cuadrantes.$inferSelect;
export type Lead = typeof leads.$inferSelect;
export type TeacherProfile = typeof teacherProfiles.$inferSelect;
export type HourEntry = typeof hourEntries.$inferSelect;
export type CourseProgram = typeof coursePrograms.$inferSelect;
export type CourseTerm = typeof courseTerms.$inferSelect;
export type Subject = typeof subjects.$inferSelect;
export type TeachingGroup = typeof teachingGroups.$inferSelect;
