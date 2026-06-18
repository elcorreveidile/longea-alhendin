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
// Estado de un apunte del libro de horas (profesorado).
//  confirmed: declarado por la persona · locked: periodo cerrado por gestión ·
//  voided: anulado (no se borra, queda traza). Correcciones = apunte nuevo.
export const hourStatus = pgEnum("hour_status", ["confirmed", "locked", "voided"]);

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
  status: hourStatus("status").notNull().default("confirmed"),
  createdByUserId: uuid("created_by_user_id").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Tenant = typeof tenants.$inferSelect;
export type Worker = typeof workers.$inferSelect;
export type User = typeof users.$inferSelect;
export type Cuadrante = typeof cuadrantes.$inferSelect;
export type Lead = typeof leads.$inferSelect;
export type TeacherProfile = typeof teacherProfiles.$inferSelect;
export type HourEntry = typeof hourEntries.$inferSelect;
