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

export type Tenant = typeof tenants.$inferSelect;
export type Worker = typeof workers.$inferSelect;
export type User = typeof users.$inferSelect;
export type Cuadrante = typeof cuadrantes.$inferSelect;
